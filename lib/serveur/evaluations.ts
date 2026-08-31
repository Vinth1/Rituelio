// Couche d'accès aux évaluations (côté serveur). Lit/écrit dans Postgres et calcule
// la correction (formes via la banque de verbes, note /20) à la lecture, pour
// éviter des scores périmés. Module serveur uniquement (dépend de `./db`).
import type postgres from "postgres";
import { sql, transaction } from "./db";
import {
  calculerNote,
  conjugaisonFigee,
  formeAcceptee,
  trouverConjugaison,
} from "@/lib/conjugaison";

import type {
  CopieCorrigee,
  CopieEntrante,
  EvaluationPublique,
  LigneCorrigee,
  ResumeEvaluation,
  VerbeRef,
} from "@/lib/evaluation-types";

// Re-export pour conserver les imports existants (routes API).
export type {
  CopieCorrigee,
  CopieEntrante,
  EvaluationPublique,
  LigneCorrigee,
  ResumeEvaluation,
  VerbeRef,
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

async function genererCode(classeNom: string): Promise<string> {
  const prefixe = prefixeCode(classeNom);
  for (let i = 0; i < 50; i++) {
    const code = `${prefixe}-${Math.floor(100 + Math.random() * 900)}`;
    const [existe] = await sql()`SELECT 1 FROM sessions WHERE code = ${code}`;
    if (!existe) return code;
  }
  return `${prefixe}-${Date.now() % 100000}`;
}

// --- Création (prof) ---
export async function creerEvaluation(p: {
  name: string;
  userId: string;
  classeId: string;
  classeNom: string;
  date: string;
  verbes: VerbeRef[];
  contraintes: string[];
}): Promise<{ code: string }> {
  const code = await genererCode(p.classeNom);
  const sessionId = id();
  // On ne lie class_id que si la classe existe ET appartient au prof (sinon la FK
  // échouerait) ; le nom reste conservé en snapshot dans tous les cas.
  const [classeOk] = p.classeId
    ? await sql()`SELECT 1 FROM classes WHERE id = ${p.classeId} AND user_id = ${p.userId}`
    : [undefined];
  const classId = classeOk ? p.classeId : null;
  await transaction(async (tx) => {
    await tx`
      INSERT INTO sessions (id, code, name, user_id, class_id, class_name, date, status, created_at)
      VALUES (${sessionId}, ${code}, ${p.name}, ${p.userId},
              ${classId}, ${p.classeNom}, ${p.date}, 'ouverte', ${Date.now()})
    `;
    for (let i = 0; i < p.verbes.length; i++) {
      const v = p.verbes[i];
      await tx`
        INSERT INTO session_items (id, session_id, infinitive, tense, grammatical_mode, order_index, formes)
        VALUES (${id()}, ${sessionId}, ${v.infinitif}, ${v.temps}, ${v.mode}, ${i},
                ${v.formes ? tx.json(v.formes as unknown as postgres.JSONValue) : null})
      `;
    }
    for (let i = 0; i < p.contraintes.length; i++) {
      await tx`
        INSERT INTO session_constraints (id, session_id, label, order_index)
        VALUES (${id()}, ${sessionId}, ${p.contraintes[i]}, ${i})
      `;
    }
  });
  return { code };
}

// --- Infos publiques (élève) : aucune réponse correcte ---
export async function evaluationParCode(
  code: string,
): Promise<EvaluationPublique | null> {
  const [s] = await sql()`
    SELECT id, code, name, date, status FROM sessions WHERE code = ${code}
  `;
  if (!s) return null;
  const session = s as {
    id: string;
    code: string;
    name: string;
    date: string;
    status: string;
  };
  const items = (await sql()`
    SELECT infinitive, tense, grammatical_mode FROM session_items
    WHERE session_id = ${session.id} ORDER BY order_index
  `) as unknown as {
    infinitive: string;
    tense: string;
    grammatical_mode: string;
  }[];
  const contraintes = (await sql()`
    SELECT label FROM session_constraints WHERE session_id = ${session.id} ORDER BY order_index
  `) as unknown as { label: string }[];
  return {
    code: session.code,
    name: session.name,
    date: session.date,
    status: session.status,
    verbes: items.map((it) => ({
      infinitif: it.infinitive,
      temps: it.tense,
      mode: it.grammatical_mode,
    })),
    contraintes: contraintes.map((c) => c.label),
  };
}

// --- Envoi d'une copie (élève) ---
export async function enregistrerCopie(
  code: string,
  copie: CopieEntrante,
): Promise<{ id: string } | null> {
  const [s] = await sql()`SELECT id, status FROM sessions WHERE code = ${code}`;
  if (!s) return null;
  const session = s as { id: string; status: string };
  if (session.status !== "ouverte") return null;
  const contraintes = (await sql()`
    SELECT label FROM session_constraints WHERE session_id = ${session.id} ORDER BY order_index
  `) as unknown as { label: string }[];
  const submissionId = id();
  await transaction(async (tx) => {
    await tx`
      INSERT INTO submissions (id, session_id, student_name, submitted_at)
      VALUES (${submissionId}, ${session.id}, ${copie.prenom}, ${Date.now()})
    `;
    for (let ti = 0; ti < copie.tableaux.length; ti++) {
      const lignes = copie.tableaux[ti].lignes;
      for (let li = 0; li < lignes.length; li++) {
        await tx`
          INSERT INTO answers (id, submission_id, item_order, line_index, pronoun, answer)
          VALUES (${id()}, ${submissionId}, ${ti}, ${li}, ${lignes[li].pronom}, ${lignes[li].forme})
        `;
      }
    }
    await tx`
      INSERT INTO sentences (id, submission_id, sentence_text)
      VALUES (${id()}, ${submissionId}, ${copie.phrase})
    `;
    for (const c of contraintes) {
      await tx`
        INSERT INTO submission_constraints (id, submission_id, label, validated)
        VALUES (${id()}, ${submissionId}, ${c.label}, 0)
      `;
    }
  });
  return { id: submissionId };
}

type LigneSession = {
  infinitive: string;
  tense: string;
  grammatical_mode: string;
  order_index: number;
  formes?: unknown; // JSONB : corrigé figé, absent sur les évaluations anciennes
};
type LigneSubmission = {
  id: string;
  student_name: string;
  submitted_at: number;
  teacher_comment: string;
  forced_note: number | null;
};

async function corriger(
  sub: LigneSubmission,
  items: LigneSession[],
): Promise<CopieCorrigee> {
  const answers = (await sql()`
    SELECT item_order, line_index, pronoun, answer FROM answers WHERE submission_id = ${sub.id}
  `) as unknown as {
    item_order: number;
    line_index: number;
    pronoun: string;
    answer: string;
  }[];
  const [sentence] = await sql()`
    SELECT sentence_text FROM sentences WHERE submission_id = ${sub.id}
  `;
  const cons = (await sql()`
    SELECT label, validated FROM submission_constraints WHERE submission_id = ${sub.id}
  `) as unknown as { label: string; validated: number }[];

  let formesCorrectes = 0;
  const tableaux = items.map((it) => {
    // Le corrigé figé prime ; on ne retombe sur la banque que pour les
    // évaluations créées avant la colonne `formes`.
    const conj =
      conjugaisonFigee(it.tense, it.grammatical_mode, it.formes) ??
      trouverConjugaison(it.infinitive, it.tense, it.grammatical_mode);
    const lignes: LigneCorrigee[] = [];
    for (let li = 0; li < 6; li++) {
      const a = answers.find(
        (x) => x.item_order === it.order_index && x.line_index === li,
      );
      const forme = a?.answer ?? "";
      const attendue = conj ? conj.formes[li] : "";
      const correcte = conj ? formeAcceptee(forme, conj, li) : false;
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
    phrase: (sentence as { sentence_text: string } | undefined)?.sentence_text ?? "",
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
export async function copiesDe(code: string): Promise<CopieCorrigee[]> {
  const [s] = await sql()`SELECT id FROM sessions WHERE code = ${code}`;
  if (!s) return [];
  const sessionId = (s as { id: string }).id;
  const items = (await sql()`
    SELECT infinitive, tense, grammatical_mode, order_index, formes FROM session_items
    WHERE session_id = ${sessionId} ORDER BY order_index
  `) as unknown as LigneSession[];
  const subs = (await sql()`
    SELECT id, student_name, submitted_at, teacher_comment, forced_note FROM submissions
    WHERE session_id = ${sessionId} ORDER BY submitted_at
  `) as unknown as LigneSubmission[];
  return Promise.all(subs.map((sub) => corriger(sub, items)));
}

// --- Corrections du prof ---
export async function definirContraintesValidees(
  submissionId: string,
  labelsValides: string[],
): Promise<void> {
  const rows = (await sql()`
    SELECT id, label FROM submission_constraints WHERE submission_id = ${submissionId}
  `) as unknown as { id: string; label: string }[];
  await transaction(async (tx) => {
    for (const r of rows) {
      await tx`
        UPDATE submission_constraints SET validated = ${labelsValides.includes(r.label) ? 1 : 0}
        WHERE id = ${r.id}
      `;
    }
  });
}

export async function fixerCommentaire(
  submissionId: string,
  texte: string,
): Promise<void> {
  await sql()`UPDATE submissions SET teacher_comment = ${texte} WHERE id = ${submissionId}`;
}

export async function forcerNote(
  submissionId: string,
  note: number | null,
): Promise<void> {
  await sql()`UPDATE submissions SET forced_note = ${note} WHERE id = ${submissionId}`;
}

export async function terminer(code: string): Promise<void> {
  await sql()`UPDATE sessions SET status = 'terminee' WHERE code = ${code}`;
}

// --- Historique par classe ---
export async function evaluationsDeClasse(
  classeId: string,
): Promise<ResumeEvaluation[]> {
  const sessions = (await sql()`
    SELECT id, code, name, date, status, class_id, class_name FROM sessions
    WHERE class_id = ${classeId} ORDER BY created_at DESC
  `) as unknown as {
    id: string;
    code: string;
    name: string;
    date: string;
    status: string;
    class_id: string;
    class_name: string;
  }[];
  return Promise.all(
    sessions.map(async (s) => {
      const items = (await sql()`
        SELECT infinitive, tense, grammatical_mode FROM session_items
        WHERE session_id = ${s.id} ORDER BY order_index
      `) as unknown as {
        infinitive: string;
        tense: string;
        grammatical_mode: string;
      }[];
      const cons = (await sql()`
        SELECT label FROM session_constraints WHERE session_id = ${s.id} ORDER BY order_index
      `) as unknown as { label: string }[];
      const [n] = await sql()`
        SELECT COUNT(*)::int AS n FROM submissions WHERE session_id = ${s.id}
      `;
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
        nbCopies: (n as { n: number }).n,
      };
    }),
  );
}
