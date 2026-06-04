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
  {
    id: "chaine-de-mots",
    titre: "La chaîne des mots",
    categorie: "lexique",
    type: "fiche",
    resume: "Vocabulaire en relais",
    icone: "🔗",
    couleur: "purple",
    duree: "10 min",
    objectifs: [
      "Mobiliser et enrichir le vocabulaire",
      "Repérer les liens de sens entre les mots (familles, synonymes, thèmes)",
    ],
    aide: "Accepter toute association justifiée ; relancer un élève qui bloque avec une question (« à quoi ça te fait penser ? »).",
    materiel: ["Le tableau", "Un mot de départ"],
    deroule: [
      "Écrire un mot de départ au tableau.",
      "Chaque élève propose à tour de rôle un mot lié au précédent.",
      "Justifier en une phrase le lien choisi (synonyme, contraire, même famille, même thème).",
      "Poursuivre la chaîne en faisant le tour de la classe.",
    ],
    variantes: [
      "Imposer un seul type de lien (synonymes uniquement, mots de la même famille…).",
      "Version écrite : chaque groupe construit la plus longue chaîne en 5 minutes.",
    ],
  },
  {
    id: "decris-et-devine",
    titre: "Décris et fais deviner",
    categorie: "expression-orale",
    type: "fiche",
    resume: "Décrire avec précision",
    icone: "🗣️",
    couleur: "coral",
    duree: "15 min",
    objectifs: [
      "S'exprimer à l'oral de façon claire et précise",
      "Mobiliser un vocabulaire descriptif (formes, usages, catégories)",
    ],
    aide: "Interdire le geste et le mot lui-même ; valoriser les descriptions précises plutôt que rapides.",
    materiel: ["Des étiquettes-mots (objets, animaux, métiers…)"],
    deroule: [
      "Un élève tire une étiquette sans la montrer.",
      "Il décrit le mot sans le nommer ni le mimer.",
      "La classe propose des réponses jusqu'à trouver le mot.",
      "L'élève qui a deviné décrit l'étiquette suivante.",
    ],
    variantes: [
      "En binômes : l'un décrit, l'autre dessine ce qu'il comprend.",
      "Limiter chaque description à 30 secondes.",
    ],
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
];
