// Couche d'accès aux faits de comportement (côté serveur). Scopé user_id.
// PR 6 : uniquement l'enregistrement des faits (consequence_id reste NULL ;
// le lien vers une conséquence viendra en PR 7). Module serveur uniquement.
import { sql } from "./db";
import { classeAppartientA } from "./classes";
import { estTypeFait, type FaitComportement, type TypeFait } from "@/lib/comportement";

type Echec = { ok: false; erreur: string };

type LigneFait = {
  id: string;
  eleve_id: string;
  classe_id: string;
  date_iso: string;
  type: string;
  raison: string;
  details: string | null;
  consequence_id: string | null;
};

function versFait(r: LigneFait): FaitComportement {
  return {
    id: r.id,
    eleveId: r.eleve_id,
    classeId: r.classe_id,
    dateISO: r.date_iso,
    type: r.type as TypeFait,
    raison: r.raison,
    details: r.details ?? undefined,
    consequenceId: r.consequence_id ?? undefined,
  };
}

// Vrai si l'élève existe, appartient à cette classe ET la classe est au prof.
async function eleveDansClasse(
  userId: string,
  eleveId: string,
  classeId: string,
): Promise<boolean> {
  const [r] = await sql()`
    SELECT 1 FROM eleves e JOIN classes c ON c.id = e.classe_id
    WHERE e.id = ${eleveId} AND e.classe_id = ${classeId} AND c.user_id = ${userId}
  `;
  return !!r;
}

// Tous les faits d'une classe du prof, du plus récent au plus ancien.
export async function faitsDeClasse(
  userId: string,
  classeId: string,
): Promise<FaitComportement[]> {
  if (!(await classeAppartientA(userId, classeId))) return [];
  const rows = (await sql()`
    SELECT id, eleve_id, classe_id, date_iso, type, raison, details, consequence_id
    FROM faits_comportement
    WHERE user_id = ${userId} AND classe_id = ${classeId}
    ORDER BY date_iso DESC, created_at DESC
  `) as unknown as LigneFait[];
  return rows.map(versFait);
}

export type EntreeFait = {
  eleveId: string;
  classeId: string;
  dateISO: string;
  type: TypeFait;
  raison: string;
  details: string;
};

export async function creerFait(
  userId: string,
  data: EntreeFait,
): Promise<{ ok: true; fait: FaitComportement } | Echec> {
  if (!(await eleveDansClasse(userId, data.eleveId, data.classeId))) {
    return { ok: false, erreur: "Élève ou classe inconnu." };
  }
  const id = crypto.randomUUID();
  const [row] = await sql()`
    INSERT INTO faits_comportement
      (id, user_id, eleve_id, classe_id, date_iso, type, raison, details, consequence_id, created_at)
    VALUES (${id}, ${userId}, ${data.eleveId}, ${data.classeId}, ${data.dateISO},
            ${data.type}, ${data.raison}, ${data.details || null}, NULL, ${Date.now()})
    RETURNING id, eleve_id, classe_id, date_iso, type, raison, details, consequence_id
  `;
  return { ok: true, fait: versFait(row as unknown as LigneFait) };
}

export async function supprimerFait(userId: string, id: string): Promise<void> {
  await sql()`DELETE FROM faits_comportement WHERE id = ${id} AND user_id = ${userId}`;
}

// ===== Validation du corps de requête =====
export function lireEntreeFait(
  body: unknown,
): { ok: true; data: EntreeFait } | { ok: false; erreur: string } {
  const b = body as {
    eleveId?: unknown;
    classeId?: unknown;
    dateISO?: unknown;
    type?: unknown;
    raison?: unknown;
    details?: unknown;
  } | null;
  if (!b) return { ok: false, erreur: "Corps invalide." };
  if (typeof b.eleveId !== "string" || !b.eleveId) {
    return { ok: false, erreur: "Élève requis." };
  }
  if (typeof b.classeId !== "string" || !b.classeId) {
    return { ok: false, erreur: "Classe requise." };
  }
  if (typeof b.dateISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.dateISO)) {
    return { ok: false, erreur: "Date invalide." };
  }
  if (!estTypeFait(b.type)) {
    return { ok: false, erreur: "Type de fait invalide." };
  }
  if (typeof b.raison !== "string" || !b.raison.trim()) {
    return { ok: false, erreur: "Raison requise." };
  }
  const details = typeof b.details === "string" ? b.details.trim() : "";
  return {
    ok: true,
    data: {
      eleveId: b.eleveId,
      classeId: b.classeId,
      dateISO: b.dateISO,
      type: b.type,
      raison: b.raison.trim(),
      details,
    },
  };
}
