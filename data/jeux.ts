// Modèle de données du catalogue de jeux.
// À placer dans : data/jeux.ts
// Pour ajouter un jeu : copie un objet existant et adapte ses champs.

export type CategorieJeu =
  | "mot-de-la-semaine"
  | "conjugaison"
  | "lexique"
  | "orthographe"
  | "expression-orale";

export type Jeu = {
  id: string;                 // slug unique, ex : "morpion-des-verbes"
  titre: string;
  categorie: CategorieJeu;
  type: "fiche" | "jouable";
  resume: string;             // phrase courte affichée sur la carte
  icone: string;              // nom d'icône ou emoji pour la carte
  couleur: string;            // accent de la carte, ex : "amber" | "teal" | "blue"
  duree?: string;             // ex : "10 min"

  // --- Onglet « Plus d'infos / Aide » (commun aux deux types) ---
  objectifs?: string[];       // compétences visées
  aide?: string;              // conseils de mise en oeuvre en classe

  // --- Jeux de type "fiche" ---
  materiel?: string[];
  deroule?: string[];         // étapes du jeu
  variantes?: string[];

  // --- Jeux de type "jouable" ---
  composant?: string;         // nom du composant React, ex : "MorpionDesVerbes"
};

export const jeux: Jeu[] = [
  {
    id: "mot-de-la-semaine",
    titre: "Le mot de la semaine",
    categorie: "mot-de-la-semaine",
    type: "fiche",
    resume: "Rituel hebdomadaire",
    icone: "⭐",
    couleur: "amber",
    duree: "10 min",
    objectifs: [
      "Enrichir le vocabulaire",
      "Travailler le sens, l'origine et l'orthographe d'un mot",
    ],
    aide: "Afficher le mot le lundi, le réutiliser toute la semaine.",
    materiel: ["Un mot choisi", "Le tableau ou un affichage"],
    deroule: [
      "Présenter le mot de la semaine.",
      "Faire deviner son sens par les élèves.",
      "Donner la définition, l'origine et un exemple.",
      "Inviter à le réemployer durant la semaine.",
    ],
    variantes: ["Mot proposé à tour de rôle par un élève chaque semaine."],
  },
  {
    id: "morpion-des-verbes",
    titre: "Le morpion des verbes",
    categorie: "conjugaison",
    type: "jouable",
    resume: "Conjugaison à deux",
    icone: "❌",
    couleur: "teal",
    duree: "5 min",
    composant: "MorpionDesVerbes",
    objectifs: ["Mémoriser les conjugaisons", "Réagir vite"],
    aide: "Idéal en duel au tableau ou par binômes.",
  },
  {
    id: "dictee-negociee",
    titre: "La dictée négociée",
    categorie: "orthographe",
    type: "fiche",
    resume: "Orthographe collective",
    icone: "✏️",
    couleur: "blue",
    duree: "20 min",
    objectifs: [
      "Justifier ses choix orthographiques",
      "Argumenter en groupe",
    ],
    aide: "Phrase courte mais riche en pièges (accords, homophones).",
    materiel: ["Une phrase préparée", "Une feuille par groupe"],
    deroule: [
      "Dicter la phrase ; chacun écrit seul.",
      "En petits groupes, comparer et se mettre d'accord sur une version.",
      "Mise en commun et correction argumentée au tableau.",
    ],
    variantes: ["Dictée négociée à deux pour aller plus vite."],
  },
];
