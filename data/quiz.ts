// Données du jeu « Quiz culture ».
// Pour ajouter / modifier des questions : éditer le tableau `questionsQuiz`
// ci-dessous (respecter le type QuestionQuiz). `bonneReponse` est l'INDEX de la
// bonne proposition dans `choix` (0 = la première). Questions originales.

export type CategorieQuiz = "geographie" | "histoire" | "sports" | "chanson";

export type QuestionQuiz = {
  id: string;
  categorie: CategorieQuiz;
  question: string;
  choix: string[]; // 3 à 4 propositions
  bonneReponse: number; // index de la bonne réponse dans `choix`
  explication?: string; // courte explication affichée après la réponse
};

export type InfoCategorieQuiz = {
  slug: CategorieQuiz;
  label: string;
  description: string;
  icone: string;
  couleur: string; // clé d'accent (voir lib/couleurs.ts)
};

export const CATEGORIES_QUIZ: InfoCategorieQuiz[] = [
  { slug: "geographie", label: "Géographie", description: "Capitales et pays francophones", icone: "🌍", couleur: "blue" },
  { slug: "histoire", label: "Histoire", description: "Personnages et dates importantes", icone: "📜", couleur: "amber" },
  { slug: "sports", label: "Sports", description: "Sportifs et équipes célèbres", icone: "⚽", couleur: "green" },
  { slug: "chanson", label: "Chanson", description: "Artistes français et francophones", icone: "🎵", couleur: "purple" },
];

export const questionsQuiz: QuestionQuiz[] = [
  // ---------- Géographie ----------
  { id: "geo-1", categorie: "geographie", question: "Quelle est la capitale de la France ?", choix: ["Lyon", "Paris", "Marseille"], bonneReponse: 1 },
  { id: "geo-2", categorie: "geographie", question: "Quelle est la capitale du Sénégal ?", choix: ["Abidjan", "Bamako", "Dakar"], bonneReponse: 2 },
  { id: "geo-3", categorie: "geographie", question: "Dans quel pays se trouve la ville de Genève ?", choix: ["La Suisse", "La France", "La Belgique"], bonneReponse: 0 },
  { id: "geo-4", categorie: "geographie", question: "Quelle est la capitale de la Belgique ?", choix: ["Anvers", "Bruxelles", "Liège"], bonneReponse: 1 },
  { id: "geo-5", categorie: "geographie", question: "Quel fleuve traverse Paris ?", choix: ["La Loire", "Le Rhône", "La Seine"], bonneReponse: 2 },
  { id: "geo-6", categorie: "geographie", question: "Quelle est la capitale du Canada ?", choix: ["Toronto", "Montréal", "Ottawa", "Québec"], bonneReponse: 2, explication: "Ottawa est la capitale ; Toronto et Montréal sont plus peuplées." },
  { id: "geo-7", categorie: "geographie", question: "Sur quel continent se trouve le Maroc ?", choix: ["L'Afrique", "L'Europe", "L'Asie"], bonneReponse: 0 },
  { id: "geo-8", categorie: "geographie", question: "Quelle est la capitale officielle de la Côte d'Ivoire ?", choix: ["Abidjan", "Yamoussoukro", "Dakar"], bonneReponse: 1, explication: "Yamoussoukro est la capitale officielle ; Abidjan est la capitale économique." },

  // ---------- Histoire ----------
  { id: "hist-1", categorie: "histoire", question: "En quelle année a eu lieu la prise de la Bastille ?", choix: ["1789", "1799", "1815"], bonneReponse: 0 },
  { id: "hist-2", categorie: "histoire", question: "Quel roi de France était surnommé « le Roi-Soleil » ?", choix: ["Louis XVI", "Louis XIV", "Henri IV"], bonneReponse: 1 },
  { id: "hist-3", categorie: "histoire", question: "En quelle année s'est terminée la Seconde Guerre mondiale en Europe ?", choix: ["1918", "1945", "1939"], bonneReponse: 1 },
  { id: "hist-4", categorie: "histoire", question: "Quel empereur français fut vaincu à Waterloo en 1815 ?", choix: ["Charlemagne", "Napoléon Ier", "Louis XVI"], bonneReponse: 1 },
  { id: "hist-5", categorie: "histoire", question: "En quelle année les femmes ont-elles voté pour la première fois en France ?", choix: ["1945", "1789", "1968"], bonneReponse: 0, explication: "Le droit de vote leur est accordé en 1944 ; le premier vote a lieu en 1945." },
  { id: "hist-6", categorie: "histoire", question: "Qui fut le premier président de la Ve République ?", choix: ["François Mitterrand", "Charles de Gaulle", "Jacques Chirac"], bonneReponse: 1 },
  { id: "hist-7", categorie: "histoire", question: "Quel jour célèbre-t-on la fête nationale française ?", choix: ["Le 14 juillet", "Le 1er mai", "Le 11 novembre"], bonneReponse: 0 },
  { id: "hist-8", categorie: "histoire", question: "Pendant quelle guerre a vécu Jeanne d'Arc ?", choix: ["La guerre de Cent Ans", "La Première Guerre mondiale", "Les guerres napoléoniennes"], bonneReponse: 0 },

  // ---------- Sports ----------
  { id: "sport-1", categorie: "sports", question: "Combien de joueurs composent une équipe de football sur le terrain ?", choix: ["9", "11", "7"], bonneReponse: 1 },
  { id: "sport-2", categorie: "sports", question: "Dans quel sport Teddy Riner est-il champion ?", choix: ["La natation", "La boxe", "Le judo"], bonneReponse: 2 },
  { id: "sport-3", categorie: "sports", question: "Après 1998, en quelle année la France a-t-elle de nouveau gagné la Coupe du monde de football ?", choix: ["2006", "2014", "2018"], bonneReponse: 2 },
  { id: "sport-4", categorie: "sports", question: "Le Tour de France est une grande course de…", choix: ["cyclisme", "course à pied", "natation"], bonneReponse: 0 },
  { id: "sport-5", categorie: "sports", question: "Combien de temps dure un match de football (temps réglementaire) ?", choix: ["60 minutes", "90 minutes", "120 minutes"], bonneReponse: 1 },
  { id: "sport-6", categorie: "sports", question: "Dans quelle ville se déroule le tournoi de tennis de Roland-Garros ?", choix: ["Paris", "Lyon", "Nice"], bonneReponse: 0 },
  { id: "sport-7", categorie: "sports", question: "Combien d'anneaux compte le drapeau olympique ?", choix: ["4", "5", "6"], bonneReponse: 1 },
  { id: "sport-8", categorie: "sports", question: "Combien de joueurs une équipe de basket-ball aligne-t-elle sur le terrain ?", choix: ["5", "6", "7"], bonneReponse: 0 },

  // ---------- Chanson ----------
  { id: "chan-1", categorie: "chanson", question: "Qui chante « La Vie en rose » ?", choix: ["Dalida", "Édith Piaf", "Mireille Mathieu"], bonneReponse: 1 },
  { id: "chan-2", categorie: "chanson", question: "Qui a écrit et chanté « Ne me quitte pas » ?", choix: ["Charles Aznavour", "Georges Brassens", "Jacques Brel"], bonneReponse: 2 },
  { id: "chan-3", categorie: "chanson", question: "De quel pays l'artiste Stromae est-il originaire ?", choix: ["La Belgique", "La France", "La Suisse"], bonneReponse: 0 },
  { id: "chan-4", categorie: "chanson", question: "Qui interprète la chanson « Je veux » ?", choix: ["Indila", "Zaz", "Vanessa Paradis"], bonneReponse: 1 },
  { id: "chan-5", categorie: "chanson", question: "De quelle région du monde la chanteuse Céline Dion est-elle originaire ?", choix: ["Le Québec", "La Provence", "La Bretagne"], bonneReponse: 0 },
  { id: "chan-6", categorie: "chanson", question: "Qui a popularisé la chanson « Aux Champs-Élysées » ?", choix: ["Claude François", "Joe Dassin", "Michel Sardou"], bonneReponse: 1 },
  { id: "chan-7", categorie: "chanson", question: "Quel instrument est typique de la chanson « musette » ?", choix: ["L'accordéon", "La guitare électrique", "La batterie"], bonneReponse: 0 },
  { id: "chan-8", categorie: "chanson", question: "De quel pays la chanteuse Angèle est-elle originaire ?", choix: ["La Belgique", "La France", "Le Canada"], bonneReponse: 0 },
];

// Questions d'une catégorie donnée.
export function questionsDe(categorie: CategorieQuiz): QuestionQuiz[] {
  return questionsQuiz.filter((q) => q.categorie === categorie);
}
