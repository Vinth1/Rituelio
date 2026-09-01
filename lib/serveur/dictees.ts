// Dictées d'un prof (table dictees). Module SERVEUR uniquement (dépend de
// `./db`). Toujours scopé `user_id` : un prof ne voit et ne modifie que ses
// propres dictées.
//
// Le texte est stocké brut, tel que le prof l'a saisi : le découpage en mots
// est fait à l'affichage par `lib/dictee.ts`, si bien qu'une amélioration du
// découpage profite aux dictées déjà déposées.
import { sql } from "./db";
import { normaliserTags } from "@/lib/dictee";

export type Dictee = {
  id: string;
  titre: string;
  texte: string;
  tags: string[];
  modifieeLe: number;
};

export type DicteeEntrante = {
  titre: string;
  texte: string;
  tags: string[];
};

export type TagCompte = { tag: string; n: number };

const MAX_TITRE = 120;
const MAX_TEXTE = 20000;

export function lireDicteeEntrante(
  brut: unknown,
): { ok: true; data: DicteeEntrante } | { ok: false; erreur: string } {
  if (!brut || typeof brut !== "object") {
    return { ok: false, erreur: "Données invalides" };
  }
  const o = brut as { titre?: unknown; texte?: unknown; tags?: unknown };

  const titre = typeof o.titre === "string" ? o.titre.trim() : "";
  if (!titre) return { ok: false, erreur: "Titre manquant" };
  if (titre.length > MAX_TITRE) return { ok: false, erreur: "Titre trop long" };

  const texte = typeof o.texte === "string" ? o.texte.trim() : "";
  if (texte.length > MAX_TEXTE) {
    return { ok: false, erreur: "Texte trop long" };
  }

  // `normaliserTags` borne déjà le nombre et la longueur des tags, et écarte
  // les entrées qui ne sont pas des chaînes.
  return { ok: true, data: { titre, texte, tags: normaliserTags(o.tags) } };
}

type LigneDictee = {
  id: string;
  titre: string;
  texte: string;
  tags: string[];
  updated_at: number;
};

function versDictee(l: LigneDictee): Dictee {
  return {
    id: l.id,
    titre: l.titre,
    texte: l.texte,
    tags: Array.isArray(l.tags) ? l.tags : [],
    modifieeLe: l.updated_at,
  };
}

// Filtre en une seule requête : `tags @> ...` exige TOUS les tags demandés
// (index GIN), `q` cherche dans le titre. Les deux critères sont neutralisés
// quand ils sont vides, ce qui évite de composer du SQL à la volée.
export async function dicteesDeProf(
  userId: string,
  filtres: { tags?: string[]; q?: string } = {},
): Promise<Dictee[]> {
  const tags = normaliserTags(filtres.tags ?? []);
  const q = (filtres.q ?? "").trim() || null;
  const lignes = (await sql()`
    SELECT id, titre, texte, tags, updated_at FROM dictees
    WHERE user_id = ${userId}
      AND (${tags}::text[] = '{}'::text[] OR tags @> ${tags}::text[])
      AND (${q}::text IS NULL OR titre ILIKE '%' || ${q} || '%')
    ORDER BY updated_at DESC
  `) as unknown as LigneDictee[];
  return lignes.map(versDictee);
}

export async function dicteeDeProf(
  userId: string,
  id: string,
): Promise<Dictee | null> {
  const lignes = (await sql()`
    SELECT id, titre, texte, tags, updated_at FROM dictees
    WHERE id = ${id} AND user_id = ${userId}
  `) as unknown as LigneDictee[];
  return lignes[0] ? versDictee(lignes[0]) : null;
}

export async function creerDictee(
  userId: string,
  d: DicteeEntrante,
): Promise<Dictee> {
  const maintenant = Date.now();
  const [ligne] = await sql()`
    INSERT INTO dictees (id, user_id, titre, texte, tags, created_at, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${d.titre}, ${d.texte},
            ${d.tags}::text[], ${maintenant}, ${maintenant})
    RETURNING id, titre, texte, tags, updated_at
  `;
  return versDictee(ligne as unknown as LigneDictee);
}

// Le filtre porte TOUJOURS sur user_id en plus de l'id : un id deviné ne doit
// pas permettre de lire ou de modifier la dictée d'un autre prof.
export async function majDictee(
  userId: string,
  id: string,
  d: DicteeEntrante,
): Promise<Dictee | null> {
  const lignes = (await sql()`
    UPDATE dictees
    SET titre = ${d.titre}, texte = ${d.texte}, tags = ${d.tags}::text[],
        updated_at = ${Date.now()}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, titre, texte, tags, updated_at
  `) as unknown as LigneDictee[];
  return lignes[0] ? versDictee(lignes[0]) : null;
}

export async function supprimerDictee(
  userId: string,
  id: string,
): Promise<boolean> {
  const lignes = (await sql()`
    DELETE FROM dictees WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `) as unknown as { id: string }[];
  return lignes.length > 0;
}

// Tous les tags déjà utilisés par ce prof, les plus fréquents d'abord :
// alimente l'autocomplétion et les pastilles de recherche.
export async function tagsDeProf(userId: string): Promise<TagCompte[]> {
  const lignes = (await sql()`
    SELECT t AS tag, COUNT(*) AS n
    FROM dictees, unnest(tags) AS t
    WHERE user_id = ${userId}
    GROUP BY t
    ORDER BY n DESC, t
  `) as unknown as { tag: string; n: number }[];
  return lignes.map((l) => ({ tag: l.tag, n: Number(l.n) }));
}
