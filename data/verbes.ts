// Banque de verbes du jeu « Conjugaison — entraînement ».
// Pour ajouter un verbe : copier un objet `Verbe` et adapter ses champs.
// `formes` contient les 6 personnes dans l'ordre : je, tu, il/elle/on, nous,
// vous, ils/elles. Pour un temps composé, stocker la forme complète attendue
// SANS le pronom (ex. « ai parlé » pour « j'ai parlé »).

export type Conjugaison = {
  temps: string; // ex. "présent", "imparfait", "futur simple", "passé composé"
  mode: string; // ex. "indicatif"
  formes: [string, string, string, string, string, string];
};

export type Verbe = {
  infinitif: string;
  groupe: string; // "1er groupe", "2e groupe", "3e groupe", "auxiliaire"
  conjugaisons: Conjugaison[];
};

export const verbes: Verbe[] = [
  {
    infinitif: "parler",
    groupe: "1er groupe",
    conjugaisons: [
      {
        temps: "présent",
        mode: "indicatif",
        formes: ["parle", "parles", "parle", "parlons", "parlez", "parlent"],
      },
      {
        temps: "imparfait",
        mode: "indicatif",
        formes: [
          "parlais",
          "parlais",
          "parlait",
          "parlions",
          "parliez",
          "parlaient",
        ],
      },
      {
        temps: "futur simple",
        mode: "indicatif",
        formes: [
          "parlerai",
          "parleras",
          "parlera",
          "parlerons",
          "parlerez",
          "parleront",
        ],
      },
      {
        temps: "passé composé",
        mode: "indicatif",
        formes: [
          "ai parlé",
          "as parlé",
          "a parlé",
          "avons parlé",
          "avez parlé",
          "ont parlé",
        ],
      },
    ],
  },
  {
    infinitif: "finir",
    groupe: "2e groupe",
    conjugaisons: [
      {
        temps: "présent",
        mode: "indicatif",
        formes: ["finis", "finis", "finit", "finissons", "finissez", "finissent"],
      },
      {
        temps: "imparfait",
        mode: "indicatif",
        formes: [
          "finissais",
          "finissais",
          "finissait",
          "finissions",
          "finissiez",
          "finissaient",
        ],
      },
      {
        temps: "futur simple",
        mode: "indicatif",
        formes: ["finirai", "finiras", "finira", "finirons", "finirez", "finiront"],
      },
    ],
  },
  {
    infinitif: "être",
    groupe: "auxiliaire",
    conjugaisons: [
      {
        temps: "présent",
        mode: "indicatif",
        formes: ["suis", "es", "est", "sommes", "êtes", "sont"],
      },
      {
        temps: "imparfait",
        mode: "indicatif",
        formes: ["étais", "étais", "était", "étions", "étiez", "étaient"],
      },
      {
        temps: "futur simple",
        mode: "indicatif",
        formes: ["serai", "seras", "sera", "serons", "serez", "seront"],
      },
    ],
  },
  {
    infinitif: "avoir",
    groupe: "auxiliaire",
    conjugaisons: [
      {
        temps: "présent",
        mode: "indicatif",
        formes: ["ai", "as", "a", "avons", "avez", "ont"],
      },
      {
        temps: "imparfait",
        mode: "indicatif",
        formes: ["avais", "avais", "avait", "avions", "aviez", "avaient"],
      },
      {
        temps: "futur simple",
        mode: "indicatif",
        formes: ["aurai", "auras", "aura", "aurons", "aurez", "auront"],
      },
    ],
  },
  {
    infinitif: "aller",
    groupe: "3e groupe",
    conjugaisons: [
      {
        temps: "présent",
        mode: "indicatif",
        formes: ["vais", "vas", "va", "allons", "allez", "vont"],
      },
      {
        temps: "imparfait",
        mode: "indicatif",
        formes: ["allais", "allais", "allait", "allions", "alliez", "allaient"],
      },
      {
        temps: "futur simple",
        mode: "indicatif",
        formes: ["irai", "iras", "ira", "irons", "irez", "iront"],
      },
      {
        temps: "passé composé",
        mode: "indicatif",
        formes: [
          "suis allé",
          "es allé",
          "est allé",
          "sommes allés",
          "êtes allés",
          "sont allés",
        ],
      },
    ],
  },
];
