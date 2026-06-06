// Données du jeu « Chaîne lexicale ».
// Pour ajouter / modifier des thèmes : éditer le tableau `champsLexicaux`
// ci-dessous (respecter le type ChampLexical). `exemples` est facultatif : il
// sert d'aide à la préparation (mots typiques du champ lexical).

export type ChampLexical = {
  id: string; // slug unique
  theme: string; // libellé affiché en grand
  exemples?: string[]; // quelques mots typiques (aide à la préparation)
};

export const champsLexicaux: ChampLexical[] = [
  {
    id: "animaux",
    theme: "Les animaux",
    exemples: ["chat", "éléphant", "tortue", "aigle", "dauphin"],
  },
  {
    id: "cuisine",
    theme: "La cuisine",
    exemples: ["casserole", "four", "couteau", "recette", "épice"],
  },
  {
    id: "emotions",
    theme: "Les émotions",
    exemples: ["joie", "colère", "peur", "tristesse", "surprise"],
  },
  {
    id: "ecole",
    theme: "L'école",
    exemples: ["cartable", "tableau", "récréation", "cahier", "maîtresse"],
  },
  {
    id: "transports",
    theme: "Les transports",
    exemples: ["voiture", "avion", "bateau", "vélo", "tramway"],
  },
  {
    id: "nature",
    theme: "La nature",
    exemples: ["forêt", "rivière", "montagne", "fleur", "nuage"],
  },
  {
    id: "vetements",
    theme: "Les vêtements",
    exemples: ["manteau", "écharpe", "chaussure", "pantalon", "chapeau"],
  },
  {
    id: "metiers",
    theme: "Les métiers",
    exemples: ["boulanger", "médecin", "pompier", "agriculteur", "ingénieur"],
  },
  {
    id: "sports",
    theme: "Les sports",
    exemples: ["football", "natation", "judo", "escalade", "tennis"],
  },
  {
    id: "musique",
    theme: "La musique",
    exemples: ["guitare", "piano", "mélodie", "chanteur", "rythme"],
  },
];
