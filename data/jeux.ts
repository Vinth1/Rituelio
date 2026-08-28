// Modèle de données du catalogue de jeux.
// À placer dans : data/jeux.ts
// Pour ajouter un jeu : copie un objet existant et adapte ses champs.

export type CategorieJeu =
  | "mot-de-la-semaine"
  | "conjugaison"
  | "lexique"
  | "orthographe"
  | "expression-orale"
  | "culture-francophone"
  | "questions-de-cours"
  | "outils-de-classe";

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

  // --- Accès ---
  profSeulement?: boolean;    // si vrai : réservé à l'espace prof (caché côté élève)
  eleveSeulement?: boolean;   // si vrai : réservé à l'espace élève (caché côté prof)
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
    profSeulement: true,
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
    profSeulement: true,
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
    profSeulement: true,
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
    resume: "Deux verbes à conjuguer",
    icone: "📝",
    couleur: "green",
    duree: "20 min",
    composant: "ConjugaisonEntrainement",
    profSeulement: true,
  },
  {
    id: "conjugaison",
    titre: "Conjugaison",
    categorie: "conjugaison",
    type: "jouable",
    resume: "Rejoins une évaluation avec ton code",
    icone: "📝",
    couleur: "green",
    composant: "ConjugaisonEleve",
    eleveSeulement: true,
  },
  {
    id: "questions-de-cours",
    titre: "Questions de cours",
    categorie: "questions-de-cours",
    type: "jouable",
    resume: "Interrogation orale à la roue",
    icone: "🎯",
    couleur: "violet",
    duree: "15 min",
    composant: "QuestionsDeCours",
    profSeulement: true,
    objectifs: [
      "Réactiver les connaissances du cours (français, sciences sociales)",
      "Interroger toute la classe équitablement grâce à la roue du hasard",
    ],
    aide: "Choisis une classe (gérée dans « Mes classes ») et une catégorie, puis lance le questionnaire : la pioche désigne un élève pour chaque question, sans réinterroger personne tant que toute la classe n'est pas passée. Le questionnaire s'arrête avec « Terminer » ou automatiquement quand chacun a répondu au même nombre de questions ; le tableau des scores s'affiche alors (ex. 1/2 = 1 bonne réponse sur 2 questions posées).",
  },
  {
    id: "roue-du-hasard",
    titre: "Roue du hasard",
    categorie: "outils-de-classe",
    type: "jouable",
    resume: "Désigne un élève au sort",
    icone: "🎡",
    couleur: "pink",
    composant: "RoueDuHasard",
    profSeulement: true,
    objectifs: [
      "Désigner un élève de façon équitable et ludique",
      "Faire participer toute la classe (option « ne pas répéter »)",
    ],
    aide: "Choisis une classe (gérée dans « Mes classes ») et lance la roue pour désigner un élève. Coche « ne pas répéter » pour passer toute la classe sans doublon, puis « Recommencer » pour repartir de zéro.",
  },
];
