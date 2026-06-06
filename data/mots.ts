// Données du jeu « Mot du jour ».
// Pour ajouter / modifier des mots : éditer le tableau `mots` ci-dessous
// (respecter le type Mot). Les mots sont choisis pour leur difficulté de
// lecture (lettres muettes finales, consonnes doublées, graphèmes complexes).
// `note` est un indice de lecture, optionnel (ex. « le -gt final est muet »).

export type Mot = {
  mot: string;
  note?: string; // indice de lecture, affiché en petit sous le mot
};

export const mots: Mot[] = [
  // ---------- Lettres finales muettes ----------
  { mot: "doigt", note: "le -gt final est muet (on dit « doi »)" },
  { mot: "tabac", note: "le -c final est muet (on dit « taba »)" },
  { mot: "respect", note: "le -ct final est muet (on dit « respè »)" },
  { mot: "porc", note: "le -c final est muet (on dit « por »)" },
  { mot: "cerf", note: "le -f final est muet (on dit « cèr »)" },
  { mot: "clef", note: "le -f final est muet (se prononce « clé »)" },
  { mot: "gentil", note: "le -l final est muet (on dit « genti »)" },
  { mot: "outil", note: "le -l final est muet (on dit « outi »)" },
  { mot: "fusil", note: "le -l final est muet (on dit « fusi »)" },

  // ---------- Lettres muettes à l'intérieur ----------
  { mot: "compter", note: "le p ne se prononce pas (« conté »)" },
  { mot: "sculpter", note: "le p ne se prononce pas (« skulté »)" },
  { mot: "baptême", note: "le p ne se prononce pas (« batême »)" },
  { mot: "sept", note: "le p est muet (se prononce « sète »)" },
  { mot: "automne", note: "le m ne se prononce pas (« oto-ne »)" },

  // ---------- Prononciations surprenantes ----------
  { mot: "femme", note: "se prononce « fame » (le e se lit « a »)" },
  { mot: "monsieur", note: "se prononce « meussieu »" },
  { mot: "second", note: "le c se prononce « g » (« segon »)" },
  { mot: "fils", note: "le l est muet, le s se prononce (« fisse »)" },
  { mot: "oignon", note: "se prononce « o-gnon » (le i ne se lit pas)" },
  { mot: "examen", note: "le -en final se prononce « in » (« examin »)" },
  { mot: "pays", note: "se prononce « pé-i »" },

  // ---------- Graphèmes complexes ----------
  { mot: "aquarium", note: "« qu » se prononce « kw » (« akwarium »)" },
  { mot: "chœur", note: "« ch » se prononce « k » (« keur »)" },
  { mot: "yacht", note: "se prononce « yot »" },
  { mot: "rythme", note: "le y et le th (« ritme »)" },
  { mot: "thym", note: "se prononce « tin »" },

  // ---------- Consonnes doublées / -ill- ----------
  { mot: "tranquille", note: "« -ill- » se prononce « il » (« trankil »)" },
  { mot: "ville", note: "se prononce « vil » (pas « vi-ye »)" },
];
