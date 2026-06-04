// Libellés et ordre d'affichage des catégories (rituels) dans le menu latéral.
// `data/jeux.ts` ne stocke que des slugs : on leur associe ici un libellé
// lisible et une icône. Pour ajouter une catégorie : ajouter son slug dans
// `CategorieJeu` (data/jeux.ts) puis une entrée ici.

import type { CategorieJeu } from "@/data/jeux";

export type InfoCategorie = {
  slug: CategorieJeu;
  label: string;
  icone: string;
};

export const CATEGORIES: InfoCategorie[] = [
  { slug: "mot-de-la-semaine", label: "Mot de la semaine", icone: "⭐" },
  { slug: "conjugaison", label: "Conjugaison", icone: "🔀" },
  { slug: "lexique", label: "Lexique", icone: "📚" },
  { slug: "orthographe", label: "Orthographe", icone: "✏️" },
  { slug: "expression-orale", label: "Expression orale", icone: "🗣️" },
];

// Retourne le libellé lisible d'une catégorie (ou le slug en dernier recours).
export function libelleCategorie(slug: CategorieJeu): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
