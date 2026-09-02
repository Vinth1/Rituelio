// Liste des outils de classe de l'onglet « Outils » (espace prof).
// Même principe que `lib/categories.ts` : une source unique décrit chaque outil
// (slug = segment d'URL sous /prof/outils, libellé, icône, accent de couleur),
// que la grille de /prof/outils parcourt pour afficher ses cartes.
// Pour ajouter un outil : une entrée ici + la page app/prof/outils/<slug>/page.tsx.

export type InfoOutil = {
  slug: string;
  titre: string;
  icone: string;
  resume: string;
  couleur: string; // accent reconnu par lib/couleurs.ts
};

export const OUTILS: InfoOutil[] = [
  {
    slug: "roue",
    titre: "Roue des prénoms",
    icone: "🎡",
    resume: "Désigner un élève au hasard",
    couleur: "amber",
  },
  {
    slug: "scores",
    titre: "Tableau des équipes",
    icone: "🏆",
    resume: "Compter les points de chaque équipe",
    couleur: "blue",
  },
  {
    slug: "groupes",
    titre: "Générateur de groupes",
    icone: "👥",
    resume: "Binômes, trinômes… tirés au sort",
    couleur: "purple",
  },
  {
    slug: "minuteur",
    titre: "Chrono & minuteur",
    icone: "⏱️",
    resume: "Chronométrer ou décompter un temps",
    couleur: "teal",
  },
];
