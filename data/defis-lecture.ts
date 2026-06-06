// Données du jeu « Défi lecture ».
// Pour ajouter / modifier des défis : éditer le tableau `defis` ci-dessous
// (respecter le type DefiLecture). Un défi est un mot difficile OU un virelangue
// à lire à voix haute. `son` indique le son ciblé (ex. « [ʃ] / [s] ») et `note`
// donne un indice de lecture. Les deux sont optionnels.

export type DefiLecture = {
  texte: string; // un mot difficile ou un virelangue à lire à voix haute
  son?: string; // son ciblé, ex. « [ʃ] / [s] »
  note?: string; // indice de lecture
};

export const defis: DefiLecture[] = [
  // ---------- Virelangues : sons proches ----------
  {
    texte: "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
    son: "[ʃ] / [s]",
    note: "bien distinguer le « ch » et le « s »",
  },
  {
    texte: "Un chasseur sachant chasser doit savoir chasser sans son chien.",
    son: "[ʃ] / [s]",
  },
  {
    texte: "Si six scies scient six cyprès, six cents scies scient six cents cyprès.",
    son: "[s]",
  },
  {
    texte: "Suis-je bien chez ce cher Serge ?",
    son: "[ʃ] / [ʒ] / [s]",
    note: "trois sifflantes à ne pas confondre",
  },
  {
    texte: "Cinq chiens chassent six chats.",
    son: "[ʃ] / [s]",
  },
  {
    texte: "Poisson sans boisson, c'est poison.",
    son: "[s] / [z]",
    note: "un seul « s » entre voyelles se lit « z »",
  },
  {
    texte: "Le ver vert va vers le verre vert.",
    son: "[v] / [ʁ]",
    note: "quatre homophones : ver, vert, vers, verre",
  },

  // ---------- Virelangues : occlusives et nasales ----------
  {
    texte: "Ton thé t'a-t-il ôté ta toux ?",
    son: "[t]",
    note: "le « th » se prononce comme un simple « t »",
  },
  {
    texte: "Didon dîna, dit-on, du dos d'un dodu dindon.",
    son: "[d] / nasales",
  },
  {
    texte: "Trois petites truites cuites, trois petites truites crues.",
    son: "[t] / [r]",
  },
  {
    texte: "Natacha n'attacha pas son chat Pacha qui s'échappa.",
    son: "[ʃ] / [a]",
  },
  {
    texte: "Un dragon gradé dégrade un gradé dragon.",
    son: "[g] / [r]",
  },

  // ---------- Mots difficiles ----------
  {
    texte: "chrysanthème",
    son: "[k]",
    note: "« ch » se prononce « k » (« krizantème »)",
  },
  {
    texte: "écureuil",
    son: "[œj]",
    note: "le « -euil » final, comme dans « fauteuil »",
  },
  {
    texte: "grenouille",
    son: "[uj]",
    note: "le « -ouille » final",
  },
  {
    texte: "serrurerie",
    son: "[ʁ]",
    note: "trois « r » qui s'enchaînent",
  },
  {
    texte: "hippopotame",
    son: "[p]",
    note: "deux « p » à bien articuler",
  },
  {
    texte: "yaourt",
    son: "hiatus",
    note: "deux voyelles qui se suivent (« ya-ourt »)",
  },
];
