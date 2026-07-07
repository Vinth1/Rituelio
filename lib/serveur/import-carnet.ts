// Pont « activité notée → carnet de notes » (côté serveur). Envoie le résultat
// d'une évaluation Conjugaison (note /20 déjà calculée) vers le carnet : crée UNE
// tâche (origine "rituelio", traçée par session_code) + les notes des élèves
// appariés, marque les absents, et enregistre le mapping copie→élève sur les
// submissions. Tout ou rien via transaction. Module serveur uniquement.
import { sql, transaction } from "./db";
import { copiesDe } from "./evaluations";
import { elevesDeClasse, matiereComplete } from "./carnet";
import type {
  AttributionImport,
  CopieAImporter,
  Doublon,
  ParamsImport,
  PreparationImport,
  ResultatImport,
} from "@/lib/import-carnet-types";

// Re-export pour les appelants existants (types partagés client/serveur).
export type {
  AttributionImport,
  CopieAImporter,
  Doublon,
  ParamsImport,
  PreparationImport,
  ResultatImport,
};

// Barème d'une évaluation Conjugaison : la note est sur /20 (cf. calculerNote).
export const BAREME_EVAL = 20;

type Echec = { ok: false; erreur: string };

type LigneSession = {
  id: string;
  name: string;
  date: string;
  class_id: string | null;
  class_name: string;
};

// Session d'évaluation appartenant à ce prof (null sinon → l'appelant renvoie 404).
async function sessionDuProf(
  userId: string,
  code: string,
): Promise<LigneSession | null> {
  const [s] = await sql()`
    SELECT id, name, date, class_id, class_name
    FROM sessions WHERE code = ${code} AND user_id = ${userId}
  `;
  return (s as LigneSession | undefined) ?? null;
}

// Tâche déjà importée depuis cette session (dédoublonnage par session_code).
async function importPrecedent(
  userId: string,
  code: string,
): Promise<Doublon | null> {
  const [r] = await sql()`
    SELECT t.id, t.nom, m.nom AS matiere_nom
    FROM taches t JOIN matieres m ON m.id = t.matiere_id
    WHERE t.user_id = ${userId} AND t.session_code = ${code}
    ORDER BY t.created_at LIMIT 1
  `;
  if (!r) return null;
  const row = r as { id: string; nom: string; matiere_nom: string };
  return { tacheId: row.id, nom: row.nom, matiereNom: row.matiere_nom };
}

// Numéro de trimestre (1-3) dont la période contient la date, sinon 1 par défaut.
async function trimestrePourDate(
  userId: string,
  dateISO: string,
): Promise<number> {
  const rows = (await sql()`
    SELECT numero, date_debut, date_fin FROM trimestres
    WHERE user_id = ${userId} AND date_debut <> '' AND date_fin <> ''
      AND date_debut <= ${dateISO} AND date_fin >= ${dateISO}
    ORDER BY numero LIMIT 1
  `) as unknown as { numero: number }[];
  return rows[0]?.numero ?? 1;
}

// Ce dont le formulaire d'envoi a besoin : infos de session, copies + notes,
// trimestre suggéré, et l'éventuel import déjà fait (avertissement anti-doublon).
export async function preparerImport(
  userId: string,
  code: string,
): Promise<PreparationImport | null> {
  const s = await sessionDuProf(userId, code);
  if (!s) return null;
  const copiesCorrigees = await copiesDe(code);
  const copies: CopieAImporter[] = copiesCorrigees.map((c) => ({
    submissionId: c.id,
    prenom: c.prenom,
    note: c.note,
  }));
  return {
    session: {
      code,
      name: s.name,
      date: s.date,
      classeId: s.class_id,
      classeNom: s.class_name,
    },
    copies,
    bareme: BAREME_EVAL,
    trimestreSuggere: await trimestrePourDate(userId, s.date),
    dejaImporte: await importPrecedent(userId, code),
  };
}

// ===== Import proprement dit =====
export async function importerEvalVersCarnet(
  userId: string,
  code: string,
  p: ParamsImport,
): Promise<ResultatImport> {
  const s = await sessionDuProf(userId, code);
  if (!s) return { ok: false, erreur: "Évaluation introuvable." };

  const matiere = await matiereComplete(userId, p.matiereId);
  if (!matiere) return { ok: false, erreur: "Matière inconnue." };

  // Les notes se rattachent aux élèves de la classe de la matière choisie.
  const roster = await elevesDeClasse(userId, matiere.classeId);
  const rosterIds = new Set(roster.map((e) => e.id));

  // Notes de référence (recalculées côté serveur — source de vérité).
  const copies = await copiesDe(code);
  const parSubmission = new Map(copies.map((c) => [c.id, c]));

  // Validation des attributions.
  const elevesVus = new Set<string>();
  const submissionsVues = new Set<string>();
  for (const a of p.attributions) {
    if (!parSubmission.has(a.submissionId)) {
      return { ok: false, erreur: "Copie inconnue dans cette évaluation." };
    }
    if (!rosterIds.has(a.eleveId)) {
      return { ok: false, erreur: "Un élève choisi n'appartient pas à la classe." };
    }
    if (submissionsVues.has(a.submissionId)) {
      return { ok: false, erreur: "Une copie est attribuée deux fois." };
    }
    if (elevesVus.has(a.eleveId)) {
      return { ok: false, erreur: "Deux copies visent le même élève." };
    }
    submissionsVues.add(a.submissionId);
    elevesVus.add(a.eleveId);
  }

  // Absents : dans le roster, non déjà notés via une copie, dédoublonnés.
  const absents = [...new Set(p.absents)].filter(
    (id) => rosterIds.has(id) && !elevesVus.has(id),
  );

  // Anti-doublon : même session déjà importée → on prévient (sauf forçage).
  if (!p.forcer) {
    const doublon = await importPrecedent(userId, code);
    if (doublon) {
      return { ok: false, erreur: "Cette évaluation a déjà été importée.", doublon };
    }
  }

  const tacheId = crypto.randomUUID();
  await transaction(async (tx) => {
    await tx`
      INSERT INTO taches
        (id, user_id, matiere_id, trimestre, date_iso, nom, bareme, ponderation,
         origine, session_code, created_at)
      VALUES
        (${tacheId}, ${userId}, ${p.matiereId}, ${p.trimestre}, ${p.dateISO},
         ${p.nom}, ${BAREME_EVAL}, ${p.ponderation}, 'rituelio', ${code}, ${Date.now()})
    `;
    for (const a of p.attributions) {
      const note = parSubmission.get(a.submissionId)!.note;
      await tx`
        INSERT INTO notes_eleves (tache_id, eleve_id, points, commentaire)
        VALUES (${tacheId}, ${a.eleveId}, ${note}, NULL)
        ON CONFLICT (tache_id, eleve_id) DO UPDATE
          SET points = EXCLUDED.points, commentaire = EXCLUDED.commentaire
      `;
      // Mémorise l'appariement copie ↔ élève officiel sur la submission.
      await tx`
        UPDATE submissions SET eleve_id = ${a.eleveId}
        WHERE id = ${a.submissionId} AND session_id = ${s.id}
      `;
    }
    for (const eleveId of absents) {
      await tx`
        INSERT INTO notes_eleves (tache_id, eleve_id, points, commentaire)
        VALUES (${tacheId}, ${eleveId}, NULL, 'absent')
        ON CONFLICT (tache_id, eleve_id) DO UPDATE
          SET points = EXCLUDED.points, commentaire = EXCLUDED.commentaire
      `;
    }
  });

  return {
    ok: true,
    tacheId,
    nbNotes: p.attributions.length,
    nbAbsents: absents.length,
  };
}

// Validation/normalisation du corps de la requête POST (route API).
export function lireParamsImport(
  body: unknown,
): { ok: true; data: ParamsImport } | Echec {
  const b = body as Record<string, unknown> | null;
  if (!b) return { ok: false, erreur: "Corps invalide." };
  if (typeof b.matiereId !== "string" || !b.matiereId) {
    return { ok: false, erreur: "Matière requise." };
  }
  if (typeof b.trimestre !== "number" || ![1, 2, 3].includes(b.trimestre)) {
    return { ok: false, erreur: "Trimestre invalide." };
  }
  if (typeof b.dateISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.dateISO)) {
    return { ok: false, erreur: "Date invalide." };
  }
  if (typeof b.nom !== "string" || !b.nom.trim()) {
    return { ok: false, erreur: "Nom de tâche requis." };
  }
  if (typeof b.ponderation !== "number" || !(b.ponderation >= 0)) {
    return { ok: false, erreur: "Pondération invalide." };
  }
  if (!Array.isArray(b.attributions)) {
    return { ok: false, erreur: "Appariement manquant." };
  }
  const attributions: AttributionImport[] = [];
  for (const a of b.attributions) {
    const x = a as { submissionId?: unknown; eleveId?: unknown } | null;
    if (typeof x?.submissionId !== "string" || typeof x?.eleveId !== "string") {
      return { ok: false, erreur: "Appariement invalide." };
    }
    if (x.submissionId && x.eleveId) {
      attributions.push({ submissionId: x.submissionId, eleveId: x.eleveId });
    }
  }
  const absents = Array.isArray(b.absents)
    ? b.absents.filter((x): x is string => typeof x === "string" && !!x)
    : [];
  return {
    ok: true,
    data: {
      matiereId: b.matiereId,
      trimestre: b.trimestre,
      dateISO: b.dateISO,
      nom: b.nom.trim(),
      ponderation: b.ponderation,
      attributions,
      absents,
      forcer: b.forcer === true,
    },
  };
}
