// Correspondance entre la couleur d'accent d'un jeu (champ `couleur` dans
// data/jeux.ts) et des classes Tailwind.
//
// Important (Tailwind v4) : les noms de classes doivent être écrits en toutes
// lettres. On ne peut PAS construire une classe dynamiquement comme
// `bg-${couleur}-100`, car le compilateur ne la détecterait pas.

export const ACCENTS: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

// Classes pour la pastille d'icône d'une carte (fond + texte colorés).
// Retombe sur un gris neutre si la couleur est inconnue.
export function classeAccent(couleur: string): string {
  return ACCENTS[couleur] ?? "bg-slate-100 text-slate-700";
}
