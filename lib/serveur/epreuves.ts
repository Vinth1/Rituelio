// Couche d'accès au module « Évaluations » générique (côté serveur) : CRUD des
// épreuves (modèles réutilisables). La base ne valide pas le JSONB, donc chaque
// question est validée à l'écriture via le registre PUR des types
// (`lib/epreuves/questions`) — on stocke la config NETTOYÉE. Cloisonnement :
// toutes les requêtes filtrent par `user_id`. Module serveur uniquement.
import type postgres from "postgres";
import { sql, transaction } from "./db";
import { typeQuestion } from "@/lib/epreuves/questions/registre";
import type {
  Epreuve,
  EpreuveEntrante,
  ResumeEpreuve,
} from "@/lib/epreuves/modele";

function id(): string {
  return crypto.randomUUID();
}

// --- Création : une épreuve vierge, éditée ensuite ---
export async function creerEpreuve(
  userId: string,
  titre: string,
): Promise<{ id: string }> {
  const epreuveId = id();
  const maintenant = Date.now();
  await sql()`
    INSERT INTO epreuves (id, user_id, titre, description, melange_questions, created_at, updated_at)
    VALUES (${epreuveId}, ${userId}, ${titre}, '', false, ${maintenant}, ${maintenant})
  `;
  return { id: epreuveId };
}

// --- Liste (résumés) des épreuves du prof ---
export async function listerEpreuves(userId: string): Promise<ResumeEpreuve[]> {
  const rows = (await sql()`
    SELECT e.id, e.titre, e.updated_at,
           (SELECT COUNT(*)::int FROM epreuve_questions q WHERE q.epreuve_id = e.id) AS nb
    FROM epreuves e
    WHERE e.user_id = ${userId}
    ORDER BY e.updated_at DESC
  `) as unknown as {
    id: string;
    titre: string;
    updated_at: number;
    nb: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    titre: r.titre,
    nbQuestions: r.nb,
    majLe: r.updated_at,
  }));
}

// --- Épreuve complète (garde le cloisonnement : id ET user_id) ---
export async function epreuveComplete(
  userId: string,
  epreuveId: string,
): Promise<Epreuve | null> {
  const [e] = await sql()`
    SELECT id, titre, description, melange_questions, created_at, updated_at
    FROM epreuves WHERE id = ${epreuveId} AND user_id = ${userId}
  `;
  if (!e) return null;
  const ep = e as {
    id: string;
    titre: string;
    description: string;
    melange_questions: boolean;
    created_at: number;
    updated_at: number;
  };
  const questions = (await sql()`
    SELECT id, type, enonce, points, config, ordre
    FROM epreuve_questions WHERE epreuve_id = ${epreuveId} ORDER BY ordre
  `) as unknown as {
    id: string;
    type: string;
    enonce: string;
    points: string; // NUMERIC → renvoyé en chaîne par postgres.js
    config: unknown; // JSONB → déjà désérialisé
    ordre: number;
  }[];
  return {
    id: ep.id,
    titre: ep.titre,
    description: ep.description,
    melangeQuestions: ep.melange_questions,
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      enonce: q.enonce,
      points: Number(q.points),
      config: q.config,
      ordre: q.ordre,
    })),
    creeLe: ep.created_at,
    majLe: ep.updated_at,
  };
}

// --- Mise à jour : remplace le contenu (titre + questions) ---
// Retour : null = introuvable/pas au prof ; {ok:false} = validation échouée.
export async function majEpreuve(
  userId: string,
  epreuveId: string,
  data: EpreuveEntrante,
): Promise<{ ok: true } | { ok: false; erreur: string } | null> {
  const [existe] = await sql()`
    SELECT 1 FROM epreuves WHERE id = ${epreuveId} AND user_id = ${userId}
  `;
  if (!existe) return null;

  // Valide chaque question via son plugin ; on ne stocke que la config nettoyée.
  const preparees: {
    id: string;
    type: string;
    enonce: string;
    points: number;
    config: unknown;
  }[] = [];
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    const def = typeQuestion(q.type);
    if (!def) {
      return { ok: false, erreur: `Question ${i + 1} : type inconnu « ${q.type} ».` };
    }
    const v = def.valideConfig(q.config);
    if (!v.ok) return { ok: false, erreur: `Question ${i + 1} : ${v.erreur}` };
    const points = Number.isFinite(q.points) && q.points >= 0 ? q.points : 1;
    preparees.push({
      id: id(),
      type: q.type,
      enonce: String(q.enonce ?? ""),
      points,
      config: v.config,
    });
  }

  await transaction(async (tx) => {
    await tx`
      UPDATE epreuves
      SET titre = ${data.titre}, description = ${data.description},
          melange_questions = ${data.melangeQuestions}, updated_at = ${Date.now()}
      WHERE id = ${epreuveId}
    `;
    // Remplacement total des questions (aucune FK externe ne les référence : les
    // passations en figent une COPIE au lancement — cf. cadrage). Les médias
    // éventuels d'une question tombent en cascade ; leur gestion arrivera dans
    // une PR ultérieure.
    await tx`DELETE FROM epreuve_questions WHERE epreuve_id = ${epreuveId}`;
    for (let i = 0; i < preparees.length; i++) {
      const q = preparees[i];
      await tx`
        INSERT INTO epreuve_questions (id, epreuve_id, type, enonce, points, config, ordre, created_at)
        VALUES (${q.id}, ${epreuveId}, ${q.type}, ${q.enonce}, ${q.points},
                ${tx.json(q.config as postgres.JSONValue)}, ${i}, ${Date.now()})
      `;
    }
  });
  return { ok: true };
}

// --- Suppression (cascade : questions + médias) ---
export async function supprimerEpreuve(
  userId: string,
  epreuveId: string,
): Promise<void> {
  await sql()`DELETE FROM epreuves WHERE id = ${epreuveId} AND user_id = ${userId}`;
}
