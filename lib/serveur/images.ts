// Banque d'images d'un prof (table images_prof). Module SERVEUR uniquement
// (dépend de `./db`). Toujours scopé `user_id` : un prof ne voit et ne modifie
// que ses propres images. Calqué sur `lib/serveur/dictees.ts`, dont il reprend
// le modèle des tags libres et l'index GIN.
//
// Le fichier lui-même vit ailleurs, voir `./stockage-images.ts`.
import { sql } from "./db";
import { normaliserTags } from "@/lib/dictee";
import { MAX_TITRE, estMimeImage, type ImageProf } from "@/lib/images";

// Le type de sortie vit dans le module pur `lib/images.ts` : les composants
// clients le réutilisent sans tirer ce module serveur dans leur bundle.
export type { ImageProf };

export type ImageEntrante = {
  id: string;
  titre: string;
  tags: string[];
  url: string;
  cle: string;
  mime: string;
  tailleOctets: number;
  largeur: number;
  hauteur: number;
};

export type TagCompte = { tag: string; n: number };

// Métadonnées d'un téléversement, lues dans le FormData. Le fichier lui-même
// est traité à part par la route : ici, on ne valide que ce qui accompagne.
export function lireMetaEntrantes(
  form: FormData,
  mime: string,
):
  | { ok: true; data: { titre: string; tags: string[]; largeur: number; hauteur: number } }
  | { ok: false; erreur: string } {
  if (!estMimeImage(mime)) {
    return { ok: false, erreur: "Format d'image non accepté" };
  }

  const titre = String(form.get("titre") ?? "").trim();
  if (titre.length > MAX_TITRE) return { ok: false, erreur: "Titre trop long" };

  // Les tags voyagent en CSV, comme dans le filtre des dictées.
  const tags = normaliserTags(String(form.get("tags") ?? "").split(","));

  const largeur = Number(form.get("largeur"));
  const hauteur = Number(form.get("hauteur"));
  if (
    !Number.isInteger(largeur) ||
    !Number.isInteger(hauteur) ||
    largeur < 1 ||
    hauteur < 1
  ) {
    return { ok: false, erreur: "Dimensions manquantes" };
  }

  return { ok: true, data: { titre, tags, largeur, hauteur } };
}

// Titre et thèmes d'une image existante (route PATCH).
export function lireModification(
  brut: unknown,
): { ok: true; data: { titre: string; tags: string[] } } | { ok: false; erreur: string } {
  if (!brut || typeof brut !== "object") {
    return { ok: false, erreur: "Données invalides" };
  }
  const o = brut as { titre?: unknown; tags?: unknown };
  const titre = typeof o.titre === "string" ? o.titre.trim() : "";
  if (titre.length > MAX_TITRE) return { ok: false, erreur: "Titre trop long" };
  return { ok: true, data: { titre, tags: normaliserTags(o.tags) } };
}

type LigneImage = {
  id: string;
  titre: string;
  url: string;
  cle: string;
  mime: string;
  taille_octets: number;
  largeur: number;
  hauteur: number;
  tags: string[];
  created_at: number;
};

function versImage(l: LigneImage): ImageProf {
  return {
    id: l.id,
    titre: l.titre,
    url: l.url,
    mime: l.mime,
    tailleOctets: Number(l.taille_octets),
    largeur: l.largeur,
    hauteur: l.hauteur,
    tags: Array.isArray(l.tags) ? l.tags : [],
    deposeeLe: Number(l.created_at),
  };
}

// `tags @> ...` exige TOUS les tags demandés (index GIN) ; le critère est
// neutralisé quand la liste est vide, ce qui évite de composer du SQL à la volée.
export async function imagesDeProf(
  userId: string,
  filtres: { tags?: string[] } = {},
): Promise<ImageProf[]> {
  const tags = normaliserTags(filtres.tags ?? []);
  const lignes = (await sql()`
    SELECT id, titre, url, cle, mime, taille_octets, largeur, hauteur, tags, created_at
    FROM images_prof
    WHERE user_id = ${userId}
      AND (${tags}::text[] = '{}'::text[] OR tags @> ${tags}::text[])
    ORDER BY created_at DESC
  `) as unknown as LigneImage[];
  return lignes.map(versImage);
}

export async function creerImage(
  userId: string,
  i: ImageEntrante,
): Promise<ImageProf> {
  const [ligne] = await sql()`
    INSERT INTO images_prof
      (id, user_id, titre, url, cle, mime, taille_octets, largeur, hauteur, tags, created_at)
    VALUES
      (${i.id}, ${userId}, ${i.titre}, ${i.url}, ${i.cle}, ${i.mime},
       ${i.tailleOctets}, ${i.largeur}, ${i.hauteur}, ${i.tags}::text[], ${Date.now()})
    RETURNING id, titre, url, cle, mime, taille_octets, largeur, hauteur, tags, created_at
  `;
  return versImage(ligne as unknown as LigneImage);
}

// Le filtre porte TOUJOURS sur user_id en plus de l'id : un id deviné ne doit
// pas permettre de lire ou de modifier l'image d'un autre prof.
export async function majImage(
  userId: string,
  id: string,
  m: { titre: string; tags: string[] },
): Promise<ImageProf | null> {
  const lignes = (await sql()`
    UPDATE images_prof
    SET titre = ${m.titre}, tags = ${m.tags}::text[]
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, titre, url, cle, mime, taille_octets, largeur, hauteur, tags, created_at
  `) as unknown as LigneImage[];
  return lignes[0] ? versImage(lignes[0]) : null;
}

// Supprime la ligne et rend de quoi effacer le fichier (`url` et `cle`), ou
// null si l'image n'existe pas — ou n'appartient pas à ce prof.
export async function supprimerImage(
  userId: string,
  id: string,
): Promise<{ url: string; cle: string } | null> {
  const lignes = (await sql()`
    DELETE FROM images_prof WHERE id = ${id} AND user_id = ${userId}
    RETURNING url, cle
  `) as unknown as { url: string; cle: string }[];
  return lignes[0] ?? null;
}

// Clé de stockage d'une image, pour servir le fichier en repli local.
export async function cleDeProf(
  userId: string,
  id: string,
): Promise<{ cle: string; mime: string } | null> {
  const lignes = (await sql()`
    SELECT cle, mime FROM images_prof WHERE id = ${id} AND user_id = ${userId}
  `) as unknown as { cle: string; mime: string }[];
  return lignes[0] ?? null;
}

// Tous les thèmes déjà utilisés par ce prof, les plus fréquents d'abord :
// alimente l'autocomplétion et les pastilles de filtrage.
export async function tagsImagesDeProf(userId: string): Promise<TagCompte[]> {
  const lignes = (await sql()`
    SELECT t AS tag, COUNT(*) AS n
    FROM images_prof, unnest(tags) AS t
    WHERE user_id = ${userId}
    GROUP BY t
    ORDER BY n DESC, t
  `) as unknown as { tag: string; n: number }[];
  return lignes.map((l) => ({ tag: l.tag, n: Number(l.n) }));
}
