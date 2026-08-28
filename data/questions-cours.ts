// Données du jeu « Questions de cours ».
// Deux catégories : Français et Sciences sociales.
//
// Deux formes de question possibles :
// - QCM : renseigner `choix` (3-4 propositions) + `bonneReponse` (INDEX de la
//   bonne proposition dans `choix`, 0 = la première) — comme le Quiz culture.
// - Question ouverte : renseigner seulement `reponse` ; l'élève répond à
//   l'oral et le prof juge (boutons « Bonne / Mauvaise réponse »).
//
// ⚠️ Les questions ci-dessous sont des EXEMPLES pour tester la forme du jeu :
// à remplacer par la vraie liste de questions du cours.

export type CategorieQuestionsCours =
  | "francais"
  | "sciences-sociales"
  | "revolution-francaise";

export type QuestionCours = {
  id: string;
  categorie: CategorieQuestionsCours;
  question: string;
  // Forme QCM…
  choix?: string[]; // 3 à 4 propositions
  bonneReponse?: number; // index de la bonne réponse dans `choix`
  // …ou forme ouverte.
  reponse?: string; // réponse attendue, affichée au prof
  explication?: string; // courte explication affichée après la réponse
};

export type InfoCategorieQuestionsCours = {
  slug: CategorieQuestionsCours;
  label: string;
  description: string;
  icone: string;
  couleur: string; // clé d'accent (voir lib/couleurs.ts)
};

export const CATEGORIES_QUESTIONS_COURS: InfoCategorieQuestionsCours[] = [
  {
    slug: "francais",
    label: "Français",
    description: "Grammaire, conjugaison, lexique",
    icone: "📖",
    couleur: "coral",
  },
  {
    slug: "sciences-sociales",
    label: "Sciences sociales",
    description: "Histoire, géographie, société",
    icone: "🏛️",
    couleur: "blue",
  },
  {
    slug: "revolution-francaise",
    label: "Révolution française",
    description: "De Clovis à 1789 — CM1",
    icone: "🏰",
    couleur: "amber",
  },
];

export const questionsCours: QuestionCours[] = [
  // ---------- Français (exemples à remplacer) ----------
  {
    id: "fr-1",
    categorie: "francais",
    question: "Quelle est la nature du mot « rapidement » ?",
    choix: ["Un adjectif", "Un adverbe", "Un nom"],
    bonneReponse: 1,
  },
  {
    id: "fr-2",
    categorie: "francais",
    question: "Conjugue le verbe « finir » à la 1re personne du pluriel au présent.",
    reponse: "Nous finissons",
  },
  {
    id: "fr-3",
    categorie: "francais",
    question: "Quel est le contraire de « courageux » ?",
    choix: ["Peureux", "Joyeux", "Curieux"],
    bonneReponse: 0,
  },
  {
    id: "fr-4",
    categorie: "francais",
    question: "Quel est l'infinitif du verbe dans « ils prennent » ?",
    reponse: "Prendre",
  },

  // ---------- Sciences sociales (exemples à remplacer) ----------
  {
    id: "ss-1",
    categorie: "sciences-sociales",
    question: "Sur quel continent se trouve l'Égypte ?",
    choix: ["L'Asie", "L'Afrique", "L'Europe"],
    bonneReponse: 1,
  },
  {
    id: "ss-2",
    categorie: "sciences-sociales",
    question: "Cite un fleuve qui traverse la France.",
    reponse: "La Seine, la Loire, le Rhône, la Garonne…",
  },
  {
    id: "ss-3",
    categorie: "sciences-sociales",
    question: "Comment appelle-t-on une carte qui représente le relief ?",
    choix: ["Une carte politique", "Une carte topographique", "Une carte routière"],
    bonneReponse: 1,
  },
  {
    id: "ss-4",
    categorie: "sciences-sociales",
    question: "En quelle année a commencé la Première Guerre mondiale ?",
    reponse: "1914",
  },

  // ---------- Révolution française (CM1) ----------
  // La numérotation suit la liste d'origine (groupes ⭐ par difficulté).

  // ⭐ Questions très simples
  {
    id: "rf-1",
    categorie: "revolution-francaise",
    question: "Comment s'appelait le roi des Francs qui a agrandi son royaume ?",
    choix: ["Charlemagne", "Louis XVI", "Clovis", "Napoléon"],
    bonneReponse: 2,
  },
  {
    id: "rf-2",
    categorie: "revolution-francaise",
    question: "Quel peuple habitait le nord de la Gaule ?",
    choix: ["Les Romains", "Les Francs", "Les Grecs", "Les Vikings"],
    bonneReponse: 1,
  },
  {
    id: "rf-3",
    categorie: "revolution-francaise",
    question: "Comment s'appelle le roi surnommé le « Roi Soleil » ?",
    choix: ["Louis XVI", "Henri IV", "Louis XIV", "François Ier"],
    bonneReponse: 2,
  },
  {
    id: "rf-4",
    categorie: "revolution-francaise",
    question: "Dans quel pays se déroule la Révolution française ?",
    choix: ["Espagne", "Angleterre", "France", "Italie"],
    bonneReponse: 2,
  },
  {
    id: "rf-5",
    categorie: "revolution-francaise",
    question: "Quel bâtiment les Parisiens ont-ils attaqué le 14 juillet 1789 ?",
    choix: ["Le Louvre", "Notre-Dame", "La Bastille", "Versailles"],
    bonneReponse: 2,
  },
  {
    id: "rf-6",
    categorie: "revolution-francaise",
    question: "Qui dirigeait le royaume avant la Révolution ?",
    choix: ["Le peuple", "Le roi", "Le maire", "Les soldats"],
    bonneReponse: 1,
  },
  {
    id: "rf-7",
    categorie: "revolution-francaise",
    question: "Comment appelle-t-on le système où le roi décide tout seul ?",
    choix: ["République", "Monarchie absolue", "Démocratie", "Empire"],
    bonneReponse: 1,
  },
  {
    id: "rf-8",
    categorie: "revolution-francaise",
    question: "Quel mot signifie un avantage réservé à certaines personnes ?",
    choix: ["Liberté", "Loi", "Privilège", "Impôt"],
    bonneReponse: 2,
  },
  {
    id: "rf-9",
    categorie: "revolution-francaise",
    question: "Qui avait le plus de pouvoir avant la Révolution ?",
    choix: ["Le peuple", "Les paysans", "Les femmes", "Le roi"],
    bonneReponse: 3,
  },
  {
    id: "rf-10",
    categorie: "revolution-francaise",
    question: "Comment s'appelait le roi pendant la Révolution ?",
    choix: ["Louis XIV", "Louis XVI", "Clovis", "Napoléon"],
    bonneReponse: 1,
  },
  {
    id: "rf-11",
    categorie: "revolution-francaise",
    question: "Comment s'appelait la reine de France ?",
    choix: ["Anne de Bretagne", "Marie-Antoinette", "Jeanne d'Arc", "Joséphine"],
    bonneReponse: 1,
  },
  {
    id: "rf-12",
    categorie: "revolution-francaise",
    question: "Que faisait-on à la Bastille avant la Révolution ?",
    choix: ["On y enseignait", "C'était une prison", "On y vivait", "On y commerçait"],
    bonneReponse: 1,
  },
  {
    id: "rf-13",
    categorie: "revolution-francaise",
    question: "Quel objet portaient souvent les rois sur la tête ?",
    choix: ["Un casque", "Une couronne", "Un béret", "Une capuche"],
    bonneReponse: 1,
  },
  {
    id: "rf-14",
    categorie: "revolution-francaise",
    question: "Quel est le jour de la fête nationale française ?",
    choix: ["1er janvier", "25 décembre", "14 juillet", "11 novembre"],
    bonneReponse: 2,
  },
  {
    id: "rf-15",
    categorie: "revolution-francaise",
    question: "Il se passe quoi le 14 juillet ?",
    choix: [
      "La naissance de Napoléon",
      "La fin de la guerre",
      "La prise de la Bastille",
      "Le couronnement du roi",
    ],
    bonneReponse: 2,
  },

  // ⭐⭐ Niveau moyen
  {
    id: "rf-16",
    categorie: "revolution-francaise",
    question: "Quels sont les trois groupes de la société française avant la Révolution ?",
    choix: [
      "Riches, pauvres, soldats",
      "Noblesse, clergé, tiers état",
      "Paysans, commerçants, rois",
      "Français, Anglais, Espagnols",
    ],
    bonneReponse: 1,
  },
  {
    id: "rf-17",
    categorie: "revolution-francaise",
    question: "Pourquoi beaucoup de Français étaient-ils mécontents en 1789 ?",
    choix: [
      "L'Allemagne a déclaré la guerre à la France",
      "Le prix du pétrole a beaucoup augmenté",
      "À cause des impôts et de la pauvreté",
      "Les vacances étaient trop courtes",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-18",
    categorie: "revolution-francaise",
    question: "Que sont les États généraux ?",
    choix: ["Une armée", "Une prison", "Une réunion", "Un château"],
    bonneReponse: 2,
  },
  {
    id: "rf-19",
    categorie: "revolution-francaise",
    question: "Qui représentait le peuple aux États généraux ?",
    choix: ["Le roi", "Les nobles", "Le clergé", "Le tiers état"],
    bonneReponse: 3,
  },
  {
    id: "rf-20",
    categorie: "revolution-francaise",
    question: "Que signifie « monarchie constitutionnelle » ?",
    choix: [
      "Le roi décide seul",
      "Il n'y a plus de roi",
      "Une assemblée contrôle le roi",
      "Les soldats dirigent le pays",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-21",
    categorie: "revolution-francaise",
    question: "Pourquoi Louis XVI a-t-il réuni les États généraux ?",
    choix: [
      "Pour organiser une fête",
      "Pour déclarer la guerre",
      "Pour résoudre les problèmes du royaume",
      "Pour construire Versailles",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-22",
    categorie: "revolution-francaise",
    question: "Qui écrivait de nouvelles idées au XVIIIe siècle ?",
    choix: ["Les soldats", "Les philosophes", "Les paysans", "Les marins"],
    bonneReponse: 1,
  },
  {
    id: "rf-23",
    categorie: "revolution-francaise",
    question: "Lequel est un philosophe des Lumières ?",
    choix: ["Victor Hugo", "Voltaire", "Molière", "Jules Verne"],
    bonneReponse: 1,
  },
  {
    id: "rf-24",
    categorie: "revolution-francaise",
    question: "Que voulaient les philosophes ?",
    choix: [
      "Plus de guerres",
      "Plus de privilèges",
      "Plus de liberté et d'égalité",
      "Plus d'impôts",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-25",
    categorie: "revolution-francaise",
    question: "Qui ne payait pas certains impôts ?",
    choix: [
      "Les paysans",
      "Les nobles et le clergé",
      "Les artisans",
      "Les commerçants",
    ],
    bonneReponse: 1,
  },

  // ⭐⭐⭐ Révolution française
  {
    id: "rf-26",
    categorie: "revolution-francaise",
    question: "Pourquoi la prise de la Bastille est-elle importante ?",
    choix: [
      "Elle était très belle",
      "Elle contenait un trésor",
      "Elle symbolise la victoire du peuple",
      "Elle appartenait au roi",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-27",
    categorie: "revolution-francaise",
    question: "Pourquoi les Parisiens ont-ils attaqué la Bastille ?",
    choix: [
      "Pour y vivre",
      "Pour trouver des armes",
      "Pour rencontrer le roi",
      "Pour acheter du pain",
    ],
    bonneReponse: 1,
  },
  {
    id: "rf-28",
    categorie: "revolution-francaise",
    question: "Comment appelle-t-on la peur qui se répand dans les campagnes ?",
    choix: ["La Grande Guerre", "La Grande Peur", "La Grande Marche", "La Grande Fête"],
    bonneReponse: 1,
  },
  {
    id: "rf-29",
    categorie: "revolution-francaise",
    question: "Pourquoi des paysans attaquent-ils des châteaux ?",
    choix: [
      "Pour faire la fête",
      "Pour rencontrer le roi",
      "Parce qu'ils ont peur des nobles",
      "Pour chercher de l'or",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-32",
    categorie: "revolution-francaise",
    question: "Que change la Déclaration des droits de l'Homme ?",
    choix: [
      "Le roi gagne du pouvoir",
      "Les citoyens obtiennent plus de droits",
      "Les nobles deviennent plus riches",
      "Les impôts augmentent",
    ],
    bonneReponse: 1,
  },
  {
    id: "rf-33",
    categorie: "revolution-francaise",
    question: "Que devient le peuple après la Déclaration ?",
    choix: ["Des soldats", "Des nobles", "Des citoyens", "Des rois"],
    bonneReponse: 2,
  },
  {
    id: "rf-34",
    categorie: "revolution-francaise",
    question: "Quelle valeur importante apparaît dans la Déclaration ?",
    choix: ["La richesse", "L'égalité", "La guerre", "La noblesse"],
    bonneReponse: 1,
  },
  {
    id: "rf-35",
    categorie: "revolution-francaise",
    question: "Le pouvoir doit appartenir à qui selon les révolutionnaires ?",
    choix: ["Au roi", "Aux nobles", "Au peuple", "Aux soldats"],
    bonneReponse: 2,
  },

  // ⭐⭐ Culture générale
  {
    id: "rf-36",
    categorie: "revolution-francaise",
    question: "Qu'est-il arrivé à Louis XVI ?",
    choix: [
      "Il est devenu empereur",
      "Il s'est enfui",
      "Il a été exécuté",
      "Il a gagné la Révolution",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-37",
    categorie: "revolution-francaise",
    question: "Avec quel instrument a-t-on exécuté Louis XVI ?",
    choix: ["Une épée", "Une lance", "La guillotine", "Une hache"],
    bonneReponse: 2,
  },
  {
    id: "rf-38",
    categorie: "revolution-francaise",
    question: "La reine Marie-Antoinette a-t-elle été exécutée ?",
    choix: [
      "Non",
      "Oui",
      "Elle s'est enfuie",
      "Elle est devenue reine d'Angleterre",
    ],
    bonneReponse: 1,
  },
  {
    id: "rf-39",
    categorie: "revolution-francaise",
    question: "Où vivaient les rois de France ?",
    choix: ["Au Louvre", "Au château de Versailles", "À la Bastille", "À Paris"],
    bonneReponse: 1,
  },
  {
    id: "rf-40",
    categorie: "revolution-francaise",
    question: "Le roi Louis XVI a-t-il gagné ou perdu la Révolution ?",
    choix: ["Gagné", "Match nul", "Perdu", "Il n'y a pas participé"],
    bonneReponse: 2,
  },
  {
    id: "rf-41",
    categorie: "revolution-francaise",
    question: "Les paysans étaient généralement…",
    choix: ["Très riches", "Plutôt pauvres", "Tous nobles", "Tous soldats"],
    bonneReponse: 1,
  },
  {
    id: "rf-42",
    categorie: "revolution-francaise",
    question: "Quel est le symbole de la Révolution parmi ceux-ci ?",
    choix: ["La couronne", "Le bonnet phrygien", "Le sceptre", "Le trône"],
    bonneReponse: 1,
  },
  {
    id: "rf-43",
    categorie: "revolution-francaise",
    question: "Quelles sont les couleurs du drapeau français ?",
    choix: [
      "Rouge, vert, blanc",
      "Bleu, jaune, rouge",
      "Bleu, blanc, rouge",
      "Noir, blanc, rouge",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-44",
    categorie: "revolution-francaise",
    question: "Quelle est la devise de la France ?",
    choix: [
      "Travail, Famille, Patrie",
      "Honneur, Courage, Force",
      "Liberté, Égalité, Fraternité",
      "Paix, Travail, Respect",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-45",
    categorie: "revolution-francaise",
    question: "Quel château est associé aux rois de France ?",
    choix: ["Chambord", "Fontainebleau", "Versailles", "Blois"],
    bonneReponse: 2,
  },

  // ⭐⭐ Questions pièges amusantes
  {
    id: "rf-46",
    categorie: "revolution-francaise",
    question: "Qui est mort en premier ?",
    choix: ["Louis XIV", "Louis XVI", "Napoléon Bonaparte", "Emmanuel Macron"],
    bonneReponse: 0,
    explication:
      "Louis XIV est mort en 1715, avant Louis XVI (1793) et Napoléon (1821).",
  },
  {
    id: "rf-47",
    categorie: "revolution-francaise",
    question: "La Bastille était surtout…",
    choix: ["Une école", "Une église", "Une prison", "Un marché"],
    bonneReponse: 2,
  },
  {
    id: "rf-48",
    categorie: "revolution-francaise",
    question: "Le roi habitait principalement…",
    choix: ["Marseille", "Versailles", "Lyon", "Lille"],
    bonneReponse: 1,
  },
  {
    id: "rf-49",
    categorie: "revolution-francaise",
    question: "Le peuple voulait surtout…",
    choix: ["Plus d'impôts", "Plus de liberté", "Plus de rois", "Plus de guerres"],
    bonneReponse: 1,
  },
  {
    id: "rf-50",
    categorie: "revolution-francaise",
    question: "Les nobles payaient-ils autant d'impôts que le peuple ?",
    choix: ["Oui", "Non", "Seulement les femmes", "Seulement les soldats"],
    bonneReponse: 1,
  },
  {
    id: "rf-51",
    categorie: "revolution-francaise",
    question: "Une révolution signifie…",
    choix: [
      "Rien ne change",
      "On change seulement le drapeau",
      "Beaucoup de choses changent",
      "On change seulement de roi",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-52",
    categorie: "revolution-francaise",
    question: "Qui avait le plus de pouvoir avant la Révolution ?",
    choix: ["Les paysans", "Le roi", "Les enfants", "Les commerçants"],
    bonneReponse: 1,
  },
  {
    id: "rf-53",
    categorie: "revolution-francaise",
    question: "Pourquoi le bonnet phrygien est-il célèbre ?",
    choix: [
      "Il protège de la pluie",
      "Il est porté par les rois",
      "Il symbolise la liberté",
      "Il est obligatoire à l'école",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-54",
    categorie: "revolution-francaise",
    question: "Le peuple voulait conserver les privilèges ?",
    choix: ["Oui", "Non", "Seulement certains", "Seulement les nobles"],
    bonneReponse: 1,
  },
  {
    id: "rf-55",
    categorie: "revolution-francaise",
    question: "Quel événement est célébré le 14 juillet ?",
    choix: [
      "La naissance de Louis XVI",
      "Le début de l'école",
      "La prise de la Bastille",
      "Le mariage du roi",
    ],
    bonneReponse: 2,
  },

  // ⭐⭐⭐ Réflexion
  {
    id: "rf-57",
    categorie: "revolution-francaise",
    question: "Pourquoi la liberté d'expression est-elle importante ?",
    choix: [
      "Pour parler plus fort",
      "Pour gagner de l'argent",
      "Pour pouvoir donner son avis",
      "Pour devenir célèbre",
    ],
    bonneReponse: 2,
  },
  {
    id: "rf-60",
    categorie: "revolution-francaise",
    question: "Pourquoi célèbre-t-on encore la Révolution française aujourd'hui ?",
    choix: [
      "Pour se souvenir des châteaux",
      "Pour se souvenir des guerres",
      "Pour rappeler les libertés et les droits obtenus",
      "Pour se souvenir des impôts",
    ],
    bonneReponse: 2,
  },
];

// Questions d'une catégorie donnée.
export function questionsCoursDe(categorie: CategorieQuestionsCours): QuestionCours[] {
  return questionsCours.filter((q) => q.categorie === categorie);
}
