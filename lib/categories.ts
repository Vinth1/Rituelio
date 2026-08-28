// Libellés et ordre d'affichage des catégories (rituels).
// `data/jeux.ts` ne stocke que des slugs : on leur associe ici un libellé
// lisible et une icône. Pour ajouter une catégorie : ajouter son slug dans
// `CategorieJeu` (data/jeux.ts) puis une entrée ici.

import type { CategorieJeu, Jeu } from "@/data/jeux";

export type InfoCategorie = {
  slug: CategorieJeu;
  label: string;
  icone: string;
};

export const CATEGORIES: InfoCategorie[] = [
  { slug: "mot-de-la-semaine", label: "Mot de la semaine", icone: "⭐" },
  { slug: "conjugaison", label: "Conjugator", icone: "🔀" },
  { slug: "lexique", label: "Lexique", icone: "📚" },
  { slug: "orthographe", label: "Orthographe", icone: "✏️" },
  { slug: "expression-orale", label: "Expression orale", icone: "🗣️" },
  { slug: "culture-francophone", label: "Quizz Culture", icone: "🧠" },
  { slug: "questions-de-cours", label: "Questions de cours", icone: "🎯" },
  { slug: "outils-de-classe", label: "Outils de classe", icone: "🎡" },
];

// Retourne le libellé lisible d'une catégorie (ou le slug en dernier recours).
export function libelleCategorie(slug: CategorieJeu): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

// Catégories réellement présentes dans la liste de jeux fournie,
// dans l'ordre défini par CATEGORIES. Sert à n'afficher que les onglets utiles.
export function categoriesPresentes(jeux: Jeu[]): InfoCategorie[] {
  const presentes = new Set(jeux.map((j) => j.categorie));
  return CATEGORIES.filter((c) => presentes.has(c.slug));
}
