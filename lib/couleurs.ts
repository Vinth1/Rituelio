// Correspondance entre la couleur d'accent d'un jeu (champ `couleur` dans
// data/jeux.ts) et des classes Tailwind.
//
// Important (Tailwind v4) : les noms de classes doivent être écrits en toutes
// lettres. On ne peut PAS construire une classe dynamiquement comme
// `bg-${couleur}-100`, car le compilateur ne la détecterait pas.
//
// Accents prévus : amber, teal, blue, coral, pink, green, purple (+ alias
// rose/violet/emerald), avec un défaut neutre. « coral » est rendu en tons
// orange (pas de palette « coral » native dans Tailwind).

// Bande supérieure des cartes : fond clair + texte foncé assorti (et variantes sombres).
const BANDES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200",
  coral: "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-200",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-200",
  green: "bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-200",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-200",
  // alias / compatibilité
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
};
const BANDE_DEFAUT =
  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

// Classes pour la bande colorée d'une carte (fond + texte). Gris neutre si inconnue.
export function couleurBande(couleur: string): string {
  return BANDES[couleur] ?? BANDE_DEFAUT;
}

// Bannière « rituel à la une » : fond vif, pensé pour du texte blanc (gros titre).
const BANNIERES: Record<string, string> = {
  amber: "bg-amber-600 dark:bg-amber-700",
  teal: "bg-teal-600 dark:bg-teal-700",
  blue: "bg-blue-600 dark:bg-blue-700",
  coral: "bg-orange-600 dark:bg-orange-700",
  pink: "bg-pink-600 dark:bg-pink-700",
  green: "bg-green-600 dark:bg-green-700",
  purple: "bg-purple-600 dark:bg-purple-700",
  // alias / compatibilité
  rose: "bg-rose-600 dark:bg-rose-700",
  violet: "bg-violet-600 dark:bg-violet-700",
  emerald: "bg-emerald-600 dark:bg-emerald-700",
};
const BANNIERE_DEFAUT = "bg-slate-600 dark:bg-slate-700";

// Classes de fond pour la grande bannière à la une. Gris neutre si inconnue.
export function couleurBanniere(couleur: string): string {
  return BANNIERES[couleur] ?? BANNIERE_DEFAUT;
}
