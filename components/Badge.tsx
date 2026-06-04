// Petit badge affiché sur chaque carte pour distinguer un jeu « Fiche »
// (description) d'un jeu « Jouable » (mini-jeu interactif).

import type { Jeu } from "@/data/jeux";

export default function Badge({ type }: { type: Jeu["type"] }) {
  const estJouable = type === "jouable";

  const style = estJouable
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span aria-hidden="true">{estJouable ? "▶" : "📄"}</span>
      {estJouable ? "Jouable" : "Fiche"}
    </span>
  );
}
