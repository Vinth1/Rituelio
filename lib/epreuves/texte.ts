// Normalisation des réponses texte, PARTAGÉE par les types de question à
// correction textuelle (réponse courte, plus tard texte à trous). Module pur
// (aucune dépendance) : même logique côté serveur et côté client.
//
// Généralise `normaliser()` de `lib/conjugaison.ts`, mais SANS supprimer tous
// les espaces : ici on réduit seulement les espaces multiples à un seul (les
// réponses en plusieurs mots comptent, ex. « cheval de Troie »). La casse et
// les accents sont optionnels : les accents sont pédagogiquement significatifs
// (« élève » ≠ « eleve »), d'où un réglage par question.

export type OptionsNormalisation = {
  ignorerAccents?: boolean; // défaut false : « é » ≠ « e »
  ignorerCasse?: boolean; // défaut false : « A » ≠ « a »
};

export function normaliserReponse(
  s: string,
  opts: OptionsNormalisation = {},
): string {
  // trim + espaces internes réduits à un seul.
  let t = (s ?? "").trim().replace(/\s+/g, " ");
  if (opts.ignorerCasse) t = t.toLowerCase();
  // Décompose puis retire les diacritiques combinants (même approche que
  // `lib/conjugaison.ts`).
  if (opts.ignorerAccents) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return t;
}
