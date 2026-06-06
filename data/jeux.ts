// Modèle de données du catalogue de jeux.
// À placer dans : data/jeux.ts
// Pour ajouter un jeu : copie un objet existant et adapte ses champs.

export type CategorieJeu =
  | "mot-de-la-semaine"
  | "conjugaison"
  | "lexique"
  | "orthographe"
  | "expression-orale"
  | "culture-francophone";

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
    id: "mot-du-jour",
    titre: "Mot du jour",
    categorie: "mot-de-la-semaine",
    type: "jouable",
    resume: "Un mot difficile par élève",
    icone: "🎲",
    couleur: "amber",
    duree: "5 min",
    composant: "MotDuJour",
    objectifs: [
      "Lire à voix haute des mots difficiles (lettres muettes, consonnes doublées, graphèmes complexes)",
      "Repérer les pièges de prononciation du français",
    ],
    aide: "Choisis une classe, distribue un mot à chacun (dé global) ou retire un mot pour un élève. Fais lire chaque mot à voix haute ; l'indice sous le mot aide à corriger la lecture.",
  },
  {
    id: "quiz-culture",
    titre: "Quiz culture",
    categorie: "culture-francophone",
    type: "jouable",
    resume: "Quiz par thèmes",
    icone: "🧠",
    couleur: "blue",
    duree: "10 min",
    composant: "QuizCulture",
    objectifs: [
      "Mobiliser des connaissances culturelles (géographie, histoire, sports, chanson)",
      "Lire une question, choisir une réponse et se corriger en autonomie",
    ],
    aide: "En autonomie sur un poste, ou en équipe au tableau : laisser lire l'explication après chaque réponse.",
  },
  {
    id: "defi-lecture",
    titre: "Défi lecture",
    categorie: "expression-orale",
    type: "jouable",
    resume: "Lecture à voix haute",
    icone: "🗣️",
    couleur: "coral",
    duree: "10 min",
    composant: "DefiLecture",
    objectifs: [
      "Lire à voix haute des mots difficiles et des virelangues",
      "Soigner sa prononciation et distinguer les sons proches",
    ],
    aide: "Affiche un défi, écoute le modèle, tire un élève au sort puis valide sa lecture (« Réussi » ou « À retravailler »).",
  },
  {
    id: "pendu",
    titre: "Le pendu",
    categorie: "orthographe",
    type: "jouable",
    resume: "Devine le mot lettre par lettre",
    icone: "🪢",
    couleur: "teal",
    duree: "10 min",
    composant: "Pendu",
    objectifs: [
      "Mémoriser l'orthographe des mots",
      "Repérer les lettres qui composent un mot",
    ],
    aide: "Le prof tape un mot caché (ou en pioche un au hasard) ; les élèves proposent des lettres. 6 erreurs maximum avant la défaite.",
  },
  {
    id: "chaine-lexicale",
    titre: "Chaîne lexicale",
    categorie: "lexique",
    type: "jouable",
    resume: "Trouver des mots d'un thème",
    icone: "🔗",
    couleur: "purple",
    duree: "15 min",
    composant: "ChaineLexicale",
    objectifs: [
      "Mobiliser et enrichir le vocabulaire d'un champ lexical",
      "Prendre la parole à tour de rôle",
    ],
    aide: "Choisis un thème et un mode (tour simple ou élimination) ; tire un élève au sort, valide chaque mot « Correct » ou « Hors thème ». Pensé pour le vidéoprojecteur.",
  },
  {
    id: "conjugaison-entrainement",
    titre: "Conjugaison — entraînement",
    categorie: "conjugaison",
    type: "jouable",
    resume: "Deux verbes au tableau",
    icone: "📝",
    couleur: "green",
    duree: "20 min",
    composant: "ConjugaisonEntrainement",
    objectifs: [
      "Conjuguer deux verbes à différents temps",
      "Produire une phrase correcte sous contraintes",
    ],
    aide: "Choisis 2 verbes, une classe et une date. La classe complète les 2 tableaux (pronom + forme), puis rédige une phrase utilisant les deux verbes. « Terminer la séance » l'enregistre dans l'historique de la classe.",
  },
];
