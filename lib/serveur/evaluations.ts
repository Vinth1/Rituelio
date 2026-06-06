// Couche d'accès aux évaluations (côté serveur). Lit/écrit dans SQLite et calcule
// la correction (formes via la banque de verbes, note /20) à la lecture, pour
// éviter des scores périmés. Module serveur uniquement (dépend de `./db`).
import { db, transaction } from "./db";
import {
  calculerNote,
  formeEstCorrecte,
  trouverConjugaison,
} from "@/lib/conjugaison";

export type VerbeRef = { infinitif: string; temps: string; mode: string };
export type LigneSaisie = { pronom: string; forme: string };

export type EvaluationPublique = {
  code: string;
  name: string;
  date: string;
  status: string;
  verbes: VerbeRef[];
  contraintes: string[];
};

export type CopieEntrante = {
  prenom: string;
  tableaux: { lignes: LigneSaisie[] }[]; // 2 tableaux × 6 lignes
  phrase: string;
};

export type LigneCorrigee = {
  pronom: string;
  forme: string;
  attendue: string;
  correcte: boolean;
};
export type CopieCorrigee = {
  id: string;
  prenom: string;
  rendueLe: number;
  tableaux: { verbe: VerbeRef; lignes: LigneCorrigee[] }[];
  phrase: string;
  contraintes: { label: string; validee: boolean }[];
  formesCorrectes: number;
  brut: number;
  max: number;
  noteAuto: number;
  noteForcee: number | null;
  note: number;
  commentaire: string;
};

export type ResumeEvaluation = {
  code: string;
  name: string;
  date: string;
  status: string;
  classeId: string;
  classeNom: string;
  verbes: VerbeRef[];
  contraintes: string[];
  nbCopies: number;
};

function id(): string {
  return crypto.randomUUID();
}

function prefixeCode(classeNom: string): string {
  const base = classeNom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return base.slice(0, 4) || "EVAL";
}

function genererCode(classeNom: string): string {
  const prefixe = prefixeCode(classeNom);
  for (let i = 0; i < 50; i++) {
    const code = `${prefixe}-${Math.floor(100 + Math.random() * 900)}`;
    const existe = db().prepare("SELECT 1 FROM sessions WHERE code = ?").get(code);
    if (!existe) return code;
  }
  return `${prefixe}-${Date.now() % 100000}`;
}

// --- Création (prof) ---
export function creerEvaluation(p: {
  name: string;
  classeId: string;
  classeNom: string;
  date: string;
  verbes: VerbeRef[];
  contraintes: string[];
}): { code: string } {
  const code = genererCode(p.classeNom);
  const sessionId = id();
  transaction(() => {
    db()
      .prepare(
        "INSERT INTO sessions (id,code,name,class_id,class_name,date,status,created_at) VALUES (?,?,?,?,?,?, 'ouverte', ?)",
      )
      .run(sessionId, code, p.name, p.classeId, p.classeNom, p.date, Date.now());
    p.verbes.forEach((v, i) =>
      db()
        .prepare(
          "INSERT INTO session_items (id,session_id,infinitive,tense,grammatical_mode,order_index) VALUES (?,?,?,?,?,?)",
        )
        .run(id(), sessionId, v.infinitif, v.temps, v.mode, i),
    );
    p.contraintes.forEach((label, i) =>
      db()
        .prepare(
          "INSERT INTO session_constraints (id,session_id,label,order_index) VALUES (?,?,?,?)",
        )
        .run(id(), sessionId, label, i),
    );
  });
  return { code };
}

// --- Infos publiques (élève) : aucune réponse correcte ---
export function evaluationParCode(code: string): EvaluationPublique | null {
  const s = db()
    .prepare("SELECT id,code,name,date,status FROM sessions WHERE code = ?")
    .get(code) as
    | { id: string; code: string; name: string; date: string; status: string }
    | undefined;
  if (!s) return null;
  const items = db()
    .prepare(
      "SELECT infinitive,tense,grammatical_mode FROM session_items WHERE session_id = ? ORDER BY order_index",
    )
    .all(s.id) as {
    infinitive: string;
    tense: string;
    grammatical_mode: string;
  }[];
  const contraintes = db()
    .prepare(
      "SELECT label FROM session_constraints WHERE session_id = ? ORDER BY order_index",
    )
    .all(s.id) as { label: string }[];
  return {
    code: s.code,
    name: s.name,
    date: s.date,
    status: s.status,
    verbes: items.map((it) => ({
      infinitif: it.infinitive,
      temps: it.tense,
      mode: it.grammatical_mode,
    })),
    contraintes: contraintes.map((c) => c.label),
  };
}

// --- Envoi d'une copie (élève) ---
export function enregistrerCopie(
  code: string,
  copie: CopieEntrante,
): { id: string } | null {
  const s = db()
    .prepare("SELECT id,status FROM sessions WHERE code = ?")
    .get(code) as { id: string; status: string } | undefined;
  if (!s || s.status !== "ouverte") return null;
  const contraintes = db()
    .prepare(
      "SELECT label FROM session_constraints WHERE session_id = ? ORDER BY order_index",
    )
    .all(s.id) as { label: string }[];
  const submissionId = id();
  transaction(() => {
    db()
      .prepare(
        "INSERT INTO submissions (id,session_id,student_name,submitted_at) VALUES (?,?,?,?)",
      )
      .run(submissionId, s.id, copie.prenom, Date.now());
    copie.tableaux.forEach((tab, ti) =>
      tab.lignes.forEach((lg, li) =>
        db()
          .prepare(
            "INSERT INTO answers (id,submission_id,item_order,line_index,pronoun,answer) VALUES (?,?,?,?,?,?)",
          )
          .run(id(), submissionId, ti, li, lg.pronom, lg.forme),
      ),
    );
    db()
      .prepare(
        "INSERT INTO sentences (id,submission_id,sentence_text) VALUES (?,?,?)",
      )
      .run(id(), submissionId, copie.phrase);
    contraintes.forEach((c) =>
      db()
        .prepare(
          "INSERT INTO submission_constraints (id,submission_id,label,validated) VALUES (?,?,?,0)",
        )
        .run(id(), submissionId, c.label),
    );
  });
  return { id: submissionId };
}

type LigneSession = {
  infinitive: string;
  tense: string;
  grammatical_mode: string;
  order_index: number;
};
type LigneSubmission = {
  id: string;
  student_name: string;
  submitted_at: number;
  teacher_comment: string;
  forced_note: number | null;
};

function corriger(sub: LigneSubmission, items: LigneSession[]): CopieCorrigee {
  const answers = db()
    .prepare(
      "SELECT item_order,line_index,pronoun,answer FROM answers WHERE submission_id = ?",
    )
    .all(sub.id) as {
    item_order: number;
    line_index: number;
    pronoun: string;
    answer: string;
  }[];
  const sentence = db()
    .prepare("SELECT sentence_text FROM sentences WHERE submission_id = ?")
    .get(sub.id) as { sentence_text: string } | undefined;
  const cons = db()
    .prepare(
      "SELECT label,validated FROM submission_constraints WHERE submission_id = ?",
    )
    .all(sub.id) as { label: string; validated: number }[];

  let formesCorrectes = 0;
  const tableaux = items.map((it) => {
    const conj = trouverConjugaison(it.infinitive, it.tense, it.grammatical_mode);
    const lignes: LigneCorrigee[] = [];
    for (let li = 0; li < 6; li++) {
      const a = answers.find(
        (x) => x.item_order === it.order_index && x.line_index === li,
      );
      const forme = a?.answer ?? "";
      const attendue = conj ? conj.formes[li] : "";
      const correcte = conj ? formeEstCorrecte(forme, attendue) : false;
      if (correcte) formesCorrectes += 1;
      lignes.push({ pronom: a?.pronoun ?? "", forme, attendue, correcte });
    }
    return {
      verbe: {
        infinitif: it.infinitive,
        temps: it.tense,
        mode: it.grammatical_mode,
      },
      lignes,
    };
  });

  const contraintes = cons.map((c) => ({
    label: c.label,
    validee: c.validated === 1,
  }));
  const nbValidees = contraintes.filter((c) => c.validee).length;
  const { brut, max, note } = calculerNote(
    formesCorrectes,
    nbValidees,
    contraintes.length,
  );
  return {
    id: sub.id,
    prenom: sub.student_name,
    rendueLe: sub.submitted_at,
    tableaux,
    phrase: sentence?.sentence_text ?? "",
    contraintes,
    formesCorrectes,
    brut,
    max,
    noteAuto: note,
    noteForcee: sub.forced_note ?? null,
    note: sub.forced_note ?? note,
    commentaire: sub.teacher_comment,
  };
}

// --- Copies corrigées (prof) ---
export function copiesDe(code: string): CopieCorrigee[] {
  const s = db()
    .prepare("SELECT id FROM sessions WHERE code = ?")
    .get(code) as { id: string } | undefined;
  if (!s) return [];
  const items = db()
    .prepare(
      "SELECT infinitive,tense,grammatical_mode,order_index FROM session_items WHERE session_id = ? ORDER BY order_index",
    )
    .all(s.id) as LigneSession[];
  const subs = db()
    .prepare(
      "SELECT id,student_name,submitted_at,teacher_comment,forced_note FROM submissions WHERE session_id = ? ORDER BY submitted_at",
    )
    .all(s.id) as LigneSubmission[];
  return subs.map((sub) => corriger(sub, items));
}

// --- Corrections du prof ---
export function definirContraintesValidees(
  submissionId: string,
  labelsValides: string[],
): void {
  const rows = db()
    .prepare("SELECT id,label FROM submission_constraints WHERE submission_id = ?")
    .all(submissionId) as { id: string; label: string }[];
  transaction(() => {
    rows.forEach((r) =>
      db()
        .prepare("UPDATE submission_constraints SET validated = ? WHERE id = ?")
        .run(labelsValides.includes(r.label) ? 1 : 0, r.id),
    );
  });
}

export function fixerCommentaire(submissionId: string, texte: string): void {
  db()
    .prepare("UPDATE submissions SET teacher_comment = ? WHERE id = ?")
    .run(texte, submissionId);
}

export function forcerNote(submissionId: string, note: number | null): void {
  db()
    .prepare("UPDATE submissions SET forced_note = ? WHERE id = ?")
    .run(note, submissionId);
}

export function terminer(code: string): void {
  db().prepare("UPDATE sessions SET status = 'terminee' WHERE code = ?").run(code);
}

// --- Historique par classe ---
export function evaluationsDeClasse(classeId: string): ResumeEvaluation[] {
  const sessions = db()
    .prepare(
      "SELECT id,code,name,date,status,class_id,class_name FROM sessions WHERE class_id = ? ORDER BY created_at DESC",
    )
    .all(classeId) as {
    id: string;
    code: string;
    name: string;
    date: string;
    status: string;
    class_id: string;
    class_name: string;
  }[];
  return sessions.map((s) => {
    const items = db()
      .prepare(
        "SELECT infinitive,tense,grammatical_mode FROM session_items WHERE session_id = ? ORDER BY order_index",
      )
      .all(s.id) as {
      infinitive: string;
      tense: string;
      grammatical_mode: string;
    }[];
    const cons = db()
      .prepare(
        "SELECT label FROM session_constraints WHERE session_id = ? ORDER BY order_index",
      )
      .all(s.id) as { label: string }[];
    const n = db()
      .prepare("SELECT COUNT(*) AS n FROM submissions WHERE session_id = ?")
      .get(s.id) as { n: number };
    return {
      code: s.code,
      name: s.name,
      date: s.date,
      status: s.status,
      classeId: s.class_id,
      classeNom: s.class_name,
      verbes: items.map((it) => ({
        infinitif: it.infinitive,
        temps: it.tense,
        mode: it.grammatical_mode,
      })),
      contraintes: cons.map((c) => c.label),
      nbCopies: n.n,
    };
  });
}
