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
      "Repérer les pièges de prononciation et d'orthographe du français",
    ],
    aide: "Choisis une classe et le niveau (du CM1 à la 4ᵉ : le tirage inclut les niveaux inférieurs), puis distribue un mot à chacun (dé global) ou retire un mot pour un élève. Fais lire chaque mot à voix haute, puis écrire au tableau.",
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
    id: "dictee-du-jour",
    titre: "Dictée du jour",
    categorie: "orthographe",
    type: "jouable",
    resume: "Correction collective, mot à mot",
    icone: "✏️",
    couleur: "blue",
    duree: "20 min",
    composant: "DicteeDuJour",
    profSeulement: true,
    objectifs: [
      "Épeler et justifier l'orthographe des mots d'un texte",
      "Repérer les accords et les pièges d'une dictée",
    ],
    aide: "Dépose d'abord tes textes dans l'onglet « Dictées » de l'espace prof (avec des tags : #imparfait, #adjectifs…). Ici, choisis une classe et une dictée : le texte s'affiche masqué et se révèle mot à mot. Un élève épelle, tu saisis ce que tu entends (la casse et les accents sont tolérés) ou tu tranches d'un clic ✅/❌ ; « Passer » avance sans faire épeler. Pensé pour le vidéoprojecteur.",
  },
  {
    id: "image-mystere",
    titre: "Image mystère",
    categorie: "expression-orale",
    type: "jouable",
    resume: "Une de tes images, tirée au sort",
    icone: "🖼️",
    couleur: "pink",
    duree: "15 min",
    composant: "ImageMystere",
    profSeulement: true,
    objectifs: [
      "Décrire une image à l'oral : premier plan, arrière-plan, détails",
      "Enrichir son vocabulaire et construire des phrases complètes",
      "Passer de la description orale à un court texte écrit",
    ],
    aide: "Dépose tes propres images dans « Gérer mes images » (glisser-déposer) et range-les par thèmes (#ville, #nourriture, #vacances…). Choisis ensuite un thème, tire une image et projette-la : les élèves la décrivent, l'inventent ou en font un point de départ d'écriture. « Sans remise » évite de repasser deux fois la même dans la séance. Attention : les images déposées sont servies par une adresse publique — pas de photo d'élève.",
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
    aide: "Choisis un thème — parmi ceux proposés ou en créant le tien — et un mode (tour simple ou élimination) ; valide chaque mot « Correct » ou « Hors thème » : l'élève suivant est aussitôt tiré au sort. Pensé pour le vidéoprojecteur.",
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
];
