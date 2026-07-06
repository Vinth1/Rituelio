// Couche d'accès au carnet de notes (côté serveur) : matières, tâches, notes.
// Scopé user_id. Les colonnes NUMERIC (barème, pondération, points) reviennent en
// chaîne via postgres.js → converties en `number` ici. Module serveur uniquement.
import { sql } from "./db";
import { classeAppartientA } from "./classes";
import type { Matiere, NoteEleve, Tache } from "@/lib/carnet";

type Resultat<T> = { ok: true } & T;
type Echec = { ok: false; erreur: string };

// ===== Matières =====
export async function matieresDeClasse(
  userId: string,
  classeId: string,
): Promise<Matiere[]> {
  const rows = (await sql()`
    SELECT id, nom FROM matieres
    WHERE user_id = ${userId} AND classe_id = ${classeId} ORDER BY nom
  `) as unknown as { id: string; nom: string }[];
  return rows.map((r) => ({ id: r.id, nom: r.nom }));
}

export async function creerMatiere(
  userId: string,
  classeId: string,
  nom: string,
): Promise<Resultat<{ matiere: Matiere }> | Echec> {
  if (!(await classeAppartientA(userId, classeId))) {
    return { ok: false, erreur: "Classe inconnue." };
  }
  const propre = nom.trim();
  if (!propre) return { ok: false, erreur: "Nom de matière requis." };
  const id = crypto.randomUUID();
  await sql()`
    INSERT INTO matieres (id, user_id, classe_id, nom)
    VALUES (${id}, ${userId}, ${classeId}, ${propre})
  `;
  return { ok: true, matiere: { id, nom: propre } };
}

export async function supprimerMatiere(userId: string, id: string): Promise<void> {
  await sql()`DELETE FROM matieres WHERE id = ${id} AND user_id = ${userId}`;
}

// Matière + sa classe (nom), scopé prof. Null si inconnue/autre prof (pour l'export).
export async function matiereComplete(
  userId: string,
  matiereId: string,
): Promise<{ id: string; nom: string; classeId: string; classeNom: string } | null> {
  const [r] = await sql()`
    SELECT m.id, m.nom, m.classe_id, c.nom AS classe_nom
    FROM matieres m JOIN classes c ON c.id = m.classe_id
    WHERE m.id = ${matiereId} AND m.user_id = ${userId}
  `;
  if (!r) return null;
  const row = r as {
    id: string;
    nom: string;
    classe_id: string;
    classe_nom: string;
  };
  return {
    id: row.id,
    nom: row.nom,
    classeId: row.classe_id,
    classeNom: row.classe_nom,
  };
}

// Élèves d'une classe du prof (ordre stable).
export async function elevesDeClasse(
  userId: string,
  classeId: string,
): Promise<{ id: string; nom: string }[]> {
  const rows = (await sql()`
    SELECT e.id, e.nom FROM eleves e JOIN classes c ON c.id = e.classe_id
    WHERE e.classe_id = ${classeId} AND c.user_id = ${userId}
    ORDER BY e.ordre, e.nom
  `) as unknown as { id: string; nom: string }[];
  return rows.map((r) => ({ id: r.id, nom: r.nom }));
}

// ===== Ownership helpers =====
async function matiereDuProf(userId: string, matiereId: string): Promise<boolean> {
  const [r] = await sql()`
    SELECT 1 FROM matieres WHERE id = ${matiereId} AND user_id = ${userId}
  `;
  return !!r;
}
async function tacheDuProf(userId: string, tacheId: string): Promise<boolean> {
  const [r] = await sql()`
    SELECT 1 FROM taches WHERE id = ${tacheId} AND user_id = ${userId}
  `;
  return !!r;
}
async function eleveDuProf(userId: string, eleveId: string): Promise<boolean> {
  const [r] = await sql()`
    SELECT 1 FROM eleves e JOIN classes c ON c.id = e.classe_id
    WHERE e.id = ${eleveId} AND c.user_id = ${userId}
  `;
  return !!r;
}

// ===== Tâches =====
type LigneTache = {
  id: string;
  matiere_id: string;
  trimestre: number;
  date_iso: string;
  nom: string;
  bareme: string;
  ponderation: string;
  origine: string | null;
};
function versTache(r: LigneTache): Tache {
  return {
    id: r.id,
    matiereId: r.matiere_id,
    trimestre: r.trimestre,
    dateISO: r.date_iso,
    nom: r.nom,
    bareme: Number(r.bareme),
    ponderation: Number(r.ponderation),
    origine: r.origine,
  };
}

export type EntreeTache = {
  matiereId: string;
  trimestre: number;
  dateISO: string;
  nom: string;
  bareme: number;
  ponderation: number;
};

export async function tachesDe(
  userId: string,
  matiereId: string,
  trimestre: number,
): Promise<Tache[]> {
  const rows = (await sql()`
    SELECT id, matiere_id, trimestre, date_iso, nom, bareme, ponderation, origine
    FROM taches
    WHERE user_id = ${userId} AND matiere_id = ${matiereId} AND trimestre = ${trimestre}
    ORDER BY date_iso, created_at
  `) as unknown as LigneTache[];
  return rows.map(versTache);
}

export async function creerTache(
  userId: string,
  data: EntreeTache,
): Promise<Resultat<{ tache: Tache }> | Echec> {
  if (!(await matiereDuProf(userId, data.matiereId))) {
    return { ok: false, erreur: "Matière inconnue." };
  }
  const id = crypto.randomUUID();
  const [row] = await sql()`
    INSERT INTO taches (id, user_id, matiere_id, trimestre, date_iso, nom, bareme, ponderation, origine, created_at)
    VALUES (${id}, ${userId}, ${data.matiereId}, ${data.trimestre}, ${data.dateISO},
            ${data.nom}, ${data.bareme}, ${data.ponderation}, 'manuel', ${Date.now()})
    RETURNING id, matiere_id, trimestre, date_iso, nom, bareme, ponderation, origine
  `;
  return { ok: true, tache: versTache(row as unknown as LigneTache) };
}

export async function modifierTache(
  userId: string,
  id: string,
  data: EntreeTache,
): Promise<Resultat<{ tache: Tache }> | Echec> {
  if (!(await tacheDuProf(userId, id))) {
    return { ok: false, erreur: "Tâche introuvable." };
  }
  const [row] = await sql()`
    UPDATE taches SET
      trimestre = ${data.trimestre}, date_iso = ${data.dateISO}, nom = ${data.nom},
      bareme = ${data.bareme}, ponderation = ${data.ponderation}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, matiere_id, trimestre, date_iso, nom, bareme, ponderation, origine
  `;
  return { ok: true, tache: versTache(row as unknown as LigneTache) };
}

export async function supprimerTache(userId: string, id: string): Promise<void> {
  await sql()`DELETE FROM taches WHERE id = ${id} AND user_id = ${userId}`;
}

// ===== Notes =====
type LigneNote = {
  tache_id: string;
  eleve_id: string;
  points: string | null;
  commentaire: string | null;
};
function versNote(r: LigneNote): NoteEleve {
  return {
    tacheId: r.tache_id,
    eleveId: r.eleve_id,
    points: r.points === null ? null : Number(r.points),
    commentaire: r.commentaire ?? "",
  };
}

export async function notesDeTaches(
  userId: string,
  tacheIds: string[],
): Promise<NoteEleve[]> {
  if (tacheIds.length === 0) return [];
  const rows = (await sql()`
    SELECT n.tache_id, n.eleve_id, n.points, n.commentaire
    FROM notes_eleves n JOIN taches t ON t.id = n.tache_id
    WHERE t.user_id = ${userId} AND n.tache_id = ANY(${tacheIds})
  `) as unknown as LigneNote[];
  return rows.map(versNote);
}

// Vue carnet : les tâches d'un (matière, trimestre) + les notes associées.
export async function carnetDe(
  userId: string,
  matiereId: string,
  trimestre: number,
): Promise<{ taches: Tache[]; notes: NoteEleve[] }> {
  if (!(await matiereDuProf(userId, matiereId))) return { taches: [], notes: [] };
  const taches = await tachesDe(userId, matiereId, trimestre);
  const notes = await notesDeTaches(
    userId,
    taches.map((t) => t.id),
  );
  return { taches, notes };
}

// Upsert d'une note. `points` null + commentaire vide → supprime la note (cellule
// vidée). points null + commentaire "absent" → note d'absence (exclue du calcul).
export async function enregistrerNote(
  userId: string,
  tacheId: string,
  eleveId: string,
  points: number | null,
  commentaire: string,
): Promise<{ ok: true } | Echec> {
  if (!(await tacheDuProf(userId, tacheId))) {
    return { ok: false, erreur: "Tâche inconnue." };
  }
  if (!(await eleveDuProf(userId, eleveId))) {
    return { ok: false, erreur: "Élève inconnu." };
  }
  const com = commentaire.trim();
  if (points === null && !com) {
    await sql()`
      DELETE FROM notes_eleves WHERE tache_id = ${tacheId} AND eleve_id = ${eleveId}
    `;
    return { ok: true };
  }
  await sql()`
    INSERT INTO notes_eleves (tache_id, eleve_id, points, commentaire)
    VALUES (${tacheId}, ${eleveId}, ${points}, ${com || null})
    ON CONFLICT (tache_id, eleve_id) DO UPDATE SET
      points = EXCLUDED.points, commentaire = EXCLUDED.commentaire
  `;
  return { ok: true };
}

// ===== Validation des corps de requête =====
export function lireEntreeTache(
  body: unknown,
): { ok: true; data: EntreeTache } | { ok: false; erreur: string } {
  const b = body as {
    matiereId?: unknown;
    trimestre?: unknown;
    dateISO?: unknown;
    nom?: unknown;
    bareme?: unknown;
    ponderation?: unknown;
  } | null;
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
  if (typeof b.bareme !== "number" || !(b.bareme > 0)) {
    return { ok: false, erreur: "Barème invalide." };
  }
  if (typeof b.ponderation !== "number" || !(b.ponderation >= 0)) {
    return { ok: false, erreur: "Pondération invalide." };
  }
  return {
    ok: true,
    data: {
      matiereId: b.matiereId,
      trimestre: b.trimestre,
      dateISO: b.dateISO,
      nom: b.nom.trim(),
      bareme: b.bareme,
      ponderation: b.ponderation,
    },
  };
}
