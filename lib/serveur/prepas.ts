// Couche d'accès aux prépas de cours (côté serveur). Scopé user_id. Une prépa est
// identifiée par (créneau, date concrète) — upsert sur l'index unique.
import { sql } from "./db";
import type { PrepaCours, StatutPrepa } from "@/lib/prepa";
import { STATUTS } from "@/lib/prepa";

export type EntreePrepa = {
  creneauId: string;
  dateISO: string;
  titre: string;
  objectifs: string;
  deroule: string;
  materiel: string;
  activitesRituelio: string[];
  statut: StatutPrepa;
  notesApres: string;
};

type LignePrepa = {
  id: string;
  creneau_id: string;
  date_iso: string;
  titre: string;
  objectifs: string | null;
  deroule: string | null;
  materiel: string | null;
  activites_rituelio: string[];
  statut: StatutPrepa;
  notes_apres: string | null;
};

function versPrepa(r: LignePrepa): PrepaCours {
  return {
    id: r.id,
    creneauId: r.creneau_id,
    dateISO: r.date_iso,
    titre: r.titre,
    objectifs: r.objectifs ?? "",
    deroule: r.deroule ?? "",
    materiel: r.materiel ?? "",
    activitesRituelio: r.activites_rituelio ?? [],
    statut: r.statut,
    notesApres: r.notes_apres ?? "",
  };
}

// Prépas du prof dont la date concrète est dans [du, au] (bornes ISO incluses).
export async function prepasEntreDates(
  userId: string,
  du: string,
  au: string,
): Promise<PrepaCours[]> {
  const rows = (await sql()`
    SELECT id, creneau_id, date_iso, titre, objectifs, deroule, materiel,
           activites_rituelio, statut, notes_apres
    FROM prepas_cours
    WHERE user_id = ${userId} AND date_iso >= ${du} AND date_iso <= ${au}
    ORDER BY date_iso
  `) as unknown as LignePrepa[];
  return rows.map(versPrepa);
}

async function creneauDuProf(userId: string, creneauId: string): Promise<boolean> {
  const [r] = await sql()`
    SELECT 1 FROM creneaux WHERE id = ${creneauId} AND user_id = ${userId}
  `;
  return !!r;
}

// Crée ou met à jour la prépa du couple (créneau, date). Renvoie la prépa enregistrée.
export async function enregistrerPrepa(
  userId: string,
  data: EntreePrepa,
): Promise<{ ok: true; prepa: PrepaCours } | { ok: false; erreur: string }> {
  if (!(await creneauDuProf(userId, data.creneauId))) {
    return { ok: false, erreur: "Créneau inconnu." };
  }
  if (!data.titre.trim()) return { ok: false, erreur: "Le titre est requis." };
  const [row] = await sql()`
    INSERT INTO prepas_cours
      (id, user_id, creneau_id, date_iso, titre, objectifs, deroule, materiel,
       activites_rituelio, statut, notes_apres)
    VALUES
      (${crypto.randomUUID()}, ${userId}, ${data.creneauId}, ${data.dateISO},
       ${data.titre}, ${data.objectifs}, ${data.deroule}, ${data.materiel},
       ${data.activitesRituelio}, ${data.statut}, ${data.notesApres})
    ON CONFLICT (user_id, creneau_id, date_iso) DO UPDATE SET
      titre = EXCLUDED.titre, objectifs = EXCLUDED.objectifs,
      deroule = EXCLUDED.deroule, materiel = EXCLUDED.materiel,
      activites_rituelio = EXCLUDED.activites_rituelio,
      statut = EXCLUDED.statut, notes_apres = EXCLUDED.notes_apres
    RETURNING id, creneau_id, date_iso, titre, objectifs, deroule, materiel,
              activites_rituelio, statut, notes_apres
  `;
  return { ok: true, prepa: versPrepa(row as unknown as LignePrepa) };
}

export async function supprimerPrepa(userId: string, id: string): Promise<void> {
  await sql()`DELETE FROM prepas_cours WHERE id = ${id} AND user_id = ${userId}`;
}

// Valide et normalise le corps d'une requête (PUT) en EntreePrepa.
export function lireEntreePrepa(
  body: unknown,
): { ok: true; data: EntreePrepa } | { ok: false; erreur: string } {
  const b = body as {
    creneauId?: unknown;
    dateISO?: unknown;
    titre?: unknown;
    objectifs?: unknown;
    deroule?: unknown;
    materiel?: unknown;
    activitesRituelio?: unknown;
    statut?: unknown;
    notesApres?: unknown;
  } | null;
  if (!b) return { ok: false, erreur: "Corps invalide." };
  if (typeof b.creneauId !== "string" || !b.creneauId) {
    return { ok: false, erreur: "Créneau requis." };
  }
  if (typeof b.dateISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.dateISO)) {
    return { ok: false, erreur: "Date invalide." };
  }
  if (typeof b.titre !== "string" || !b.titre.trim()) {
    return { ok: false, erreur: "Titre requis." };
  }
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const statut = STATUTS.includes(b.statut as StatutPrepa)
    ? (b.statut as StatutPrepa)
    : "a-preparer";
  const activitesRituelio = Array.isArray(b.activitesRituelio)
    ? b.activitesRituelio.filter((x): x is string => typeof x === "string")
    : [];
  return {
    ok: true,
    data: {
      creneauId: b.creneauId,
      dateISO: b.dateISO,
      titre: b.titre.trim(),
      objectifs: str(b.objectifs),
      deroule: str(b.deroule),
      materiel: str(b.materiel),
      activitesRituelio,
      statut,
      notesApres: str(b.notesApres),
    },
  };
}
