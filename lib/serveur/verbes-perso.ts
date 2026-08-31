// Verbes personnalisés d'un prof (table verbes_perso). Module SERVEUR uniquement
// (dépend de `./db`). Toujours scopé `user_id` : un prof ne voit et ne modifie
// que ses propres verbes.
//
// Un verbe personnalisé est un `EntreeVerbe` comme un autre : le sélecteur, le
// jeu et la création d'évaluation le traitent sans branche spéciale. Seules les
// cases que le prof a CORRIGÉES à la main sont stockées ; le moteur produit le
// reste, si bien qu'un verbe perso profite des corrections apportées au moteur.
import type postgres from "postgres";
import { sql } from "./db";
import {
  TEMPS_COLLEGE,
  cleTempsMode,
  type Auxiliaire,
  type Formes6,
  type Groupe,
} from "@/lib/conjugueur";

export type VerbePerso = {
  id: string;
  infinitif: string;
  groupe: Groupe;
  auxiliaire: Auxiliaire;
  formesCorrigees: Record<string, Formes6>;
};

export type VerbePersoEntrant = {
  infinitif: string;
  groupe: Groupe;
  auxiliaire: Auxiliaire;
  formesCorrigees: Record<string, Formes6>;
};

const GROUPES: Groupe[] = ["1er groupe", "2e groupe", "3e groupe"];
const MAX_INFINITIF = 40;
const MAX_FORME = 80;
// Les clés valides de `formesCorrigees` : celles des temps que le moteur connaît.
const CLES_VALIDES = new Set(TEMPS_COLLEGE.map((tm) => cleTempsMode(tm)));

// La base ne valide pas le contenu du JSONB : on le fait ici, comme pour les
// configs de questions du module Épreuves.
export function lireVerbeEntrant(
  brut: unknown,
): { ok: true; data: VerbePersoEntrant } | { ok: false; erreur: string } {
  if (!brut || typeof brut !== "object") {
    return { ok: false, erreur: "Données invalides" };
  }
  const o = brut as {
    infinitif?: unknown;
    groupe?: unknown;
    auxiliaire?: unknown;
    formesCorrigees?: unknown;
  };

  const infinitif =
    typeof o.infinitif === "string" ? o.infinitif.trim().toLowerCase() : "";
  if (!infinitif) return { ok: false, erreur: "Infinitif manquant" };
  if (infinitif.length > MAX_INFINITIF) {
    return { ok: false, erreur: "Infinitif trop long" };
  }
  if (/\s/.test(infinitif)) {
    return { ok: false, erreur: "L'infinitif ne doit pas contenir d'espace" };
  }
  if (!/(er|ir|re|oir)$/.test(infinitif)) {
    return {
      ok: false,
      erreur: "Un infinitif se termine par -er, -ir, -re ou -oir",
    };
  }

  const groupe = GROUPES.includes(o.groupe as Groupe)
    ? (o.groupe as Groupe)
    : null;
  if (!groupe) return { ok: false, erreur: "Groupe inconnu" };

  const auxiliaire =
    o.auxiliaire === "être" || o.auxiliaire === "avoir" ? o.auxiliaire : null;
  if (!auxiliaire) return { ok: false, erreur: "Auxiliaire inconnu" };

  const formesCorrigees: Record<string, Formes6> = {};
  if (o.formesCorrigees !== undefined) {
    if (typeof o.formesCorrigees !== "object" || o.formesCorrigees === null) {
      return { ok: false, erreur: "Formes corrigées invalides" };
    }
    for (const [cle, valeur] of Object.entries(
      o.formesCorrigees as Record<string, unknown>,
    )) {
      if (!CLES_VALIDES.has(cle)) {
        return { ok: false, erreur: `Temps inconnu : ${cle}` };
      }
      if (!Array.isArray(valeur) || valeur.length !== 6) {
        return { ok: false, erreur: `Il faut 6 formes pour ${cle}` };
      }
      if (
        !valeur.every((f) => typeof f === "string" && f.length <= MAX_FORME)
      ) {
        return { ok: false, erreur: `Formes invalides pour ${cle}` };
      }
      formesCorrigees[cle] = valeur as Formes6;
    }
  }

  return { ok: true, data: { infinitif, groupe, auxiliaire, formesCorrigees } };
}

type LigneVerbe = {
  id: string;
  infinitif: string;
  groupe: string;
  auxiliaire: string;
  formes: unknown;
};

function versVerbe(l: LigneVerbe): VerbePerso {
  const formes =
    l.formes && typeof l.formes === "object"
      ? (l.formes as Record<string, Formes6>)
      : {};
  return {
    id: l.id,
    infinitif: l.infinitif,
    groupe: l.groupe as Groupe,
    auxiliaire: l.auxiliaire as Auxiliaire,
    formesCorrigees: formes,
  };
}

export async function verbesPersoDeProf(userId: string): Promise<VerbePerso[]> {
  const lignes = (await sql()`
    SELECT id, infinitif, groupe, auxiliaire, formes FROM verbes_perso
    WHERE user_id = ${userId} ORDER BY infinitif
  `) as unknown as LigneVerbe[];
  return lignes.map(versVerbe);
}

// Ré-enregistrer le même infinitif met le verbe à jour : le prof peut revenir
// corriger une forme sans créer de doublon.
export async function enregistrerVerbePerso(
  userId: string,
  v: VerbePersoEntrant,
): Promise<VerbePerso> {
  const maintenant = Date.now();
  const [ligne] = await sql()`
    INSERT INTO verbes_perso (id, user_id, infinitif, groupe, auxiliaire, formes, created_at, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${v.infinitif}, ${v.groupe},
            ${v.auxiliaire},
            ${sql().json(v.formesCorrigees as unknown as postgres.JSONValue)},
            ${maintenant}, ${maintenant})
    ON CONFLICT (user_id, infinitif) DO UPDATE
      SET groupe = EXCLUDED.groupe,
          auxiliaire = EXCLUDED.auxiliaire,
          formes = EXCLUDED.formes,
          updated_at = EXCLUDED.updated_at
    RETURNING id, infinitif, groupe, auxiliaire, formes
  `;
  return versVerbe(ligne as unknown as LigneVerbe);
}

// Le filtre porte TOUJOURS sur user_id en plus de l'id : un id deviné ne doit
// pas permettre de supprimer le verbe d'un autre prof.
export async function supprimerVerbePerso(
  userId: string,
  id: string,
): Promise<boolean> {
  const lignes = (await sql()`
    DELETE FROM verbes_perso WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `) as unknown as { id: string }[];
  return lignes.length > 0;
}
