// Couche d'accès aux créneaux de l'emploi du temps (côté serveur). Scopé user_id.
// Valide l'appartenance de la classe et interdit les chevauchements le même jour.
import { sql } from "./db";
import { classeAppartientA } from "./classes";
import { chevauche, enMinutes } from "@/lib/emploi-du-temps";

export type CreneauDB = {
  id: string;
  classeId: string;
  matiere: string;
  jour: number;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
};

// Données d'entrée (création / modification), déjà normalisées par la route.
export type EntreeCreneau = {
  classeId: string;
  matiere: string;
  jour: number;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
};

type Resultat = { ok: true; id: string } | { ok: false; erreur: string };

// Valide et normalise le corps d'une requête (POST/PUT) en EntreeCreneau.
export function lireEntreeCreneau(
  body: unknown,
): { ok: true; data: EntreeCreneau } | { ok: false; erreur: string } {
  const b = body as {
    classeId?: unknown;
    matiere?: unknown;
    jour?: unknown;
    heureDebut?: unknown;
    heureFin?: unknown;
    salle?: unknown;
  } | null;
  if (!b) return { ok: false, erreur: "Corps invalide." };
  if (typeof b.classeId !== "string" || !b.classeId) {
    return { ok: false, erreur: "Classe requise." };
  }
  if (typeof b.jour !== "number" || ![1, 2, 3, 4, 5].includes(b.jour)) {
    return { ok: false, erreur: "Jour invalide." };
  }
  if (typeof b.heureDebut !== "string" || typeof b.heureFin !== "string") {
    return { ok: false, erreur: "Heures requises." };
  }
  const salle = typeof b.salle === "string" ? b.salle.trim() : "";
  return {
    ok: true,
    data: {
      classeId: b.classeId,
      matiere: typeof b.matiere === "string" ? b.matiere.trim() : "",
      jour: b.jour,
      heureDebut: b.heureDebut.trim(),
      heureFin: b.heureFin.trim(),
      salle: salle || null,
    },
  };
}

export async function creneauxDeProf(userId: string): Promise<CreneauDB[]> {
  const rows = (await sql()`
    SELECT id, classe_id, matiere, jour, heure_debut, heure_fin, salle
    FROM creneaux WHERE user_id = ${userId} ORDER BY jour, heure_debut
  `) as unknown as {
    id: string;
    classe_id: string;
    matiere: string;
    jour: number;
    heure_debut: string;
    heure_fin: string;
    salle: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    classeId: r.classe_id,
    matiere: r.matiere,
    jour: r.jour,
    heureDebut: r.heure_debut,
    heureFin: r.heure_fin,
    salle: r.salle,
  }));
}

// Renvoie un message d'erreur, ou null si le créneau est valide (heures cohérentes
// et sans chevauchement avec un autre créneau du même jour).
async function verifier(
  userId: string,
  data: EntreeCreneau,
  exclureId: string | null,
): Promise<string | null> {
  const hd = enMinutes(data.heureDebut);
  const hf = enMinutes(data.heureFin);
  if (Number.isNaN(hd) || Number.isNaN(hf)) return "Heures invalides.";
  if (hd >= hf) return "L'heure de fin doit être après l'heure de début.";
  const autres = (await sql()`
    SELECT heure_debut, heure_fin FROM creneaux
    WHERE user_id = ${userId} AND jour = ${data.jour} AND id != ${exclureId ?? ""}
  `) as unknown as { heure_debut: string; heure_fin: string }[];
  for (const a of autres) {
    if (chevauche(data.heureDebut, data.heureFin, a.heure_debut, a.heure_fin)) {
      return "Ce créneau en chevauche un autre le même jour.";
    }
  }
  return null;
}

export async function creerCreneau(
  userId: string,
  data: EntreeCreneau,
): Promise<Resultat> {
  if (!(await classeAppartientA(userId, data.classeId))) {
    return { ok: false, erreur: "Classe inconnue." };
  }
  const erreur = await verifier(userId, data, null);
  if (erreur) return { ok: false, erreur };
  const id = crypto.randomUUID();
  await sql()`
    INSERT INTO creneaux (id, user_id, classe_id, matiere, jour, heure_debut, heure_fin, salle)
    VALUES (${id}, ${userId}, ${data.classeId}, ${data.matiere}, ${data.jour},
            ${data.heureDebut}, ${data.heureFin}, ${data.salle})
  `;
  return { ok: true, id };
}

export async function modifierCreneau(
  userId: string,
  id: string,
  data: EntreeCreneau,
): Promise<Resultat> {
  const [exist] = await sql()`
    SELECT 1 FROM creneaux WHERE id = ${id} AND user_id = ${userId}
  `;
  if (!exist) return { ok: false, erreur: "Créneau introuvable." };
  if (!(await classeAppartientA(userId, data.classeId))) {
    return { ok: false, erreur: "Classe inconnue." };
  }
  const erreur = await verifier(userId, data, id);
  if (erreur) return { ok: false, erreur };
  await sql()`
    UPDATE creneaux SET
      classe_id = ${data.classeId}, matiere = ${data.matiere}, jour = ${data.jour},
      heure_debut = ${data.heureDebut}, heure_fin = ${data.heureFin}, salle = ${data.salle}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  return { ok: true, id };
}

export async function supprimerCreneau(userId: string, id: string): Promise<void> {
  await sql()`DELETE FROM creneaux WHERE id = ${id} AND user_id = ${userId}`;
}
