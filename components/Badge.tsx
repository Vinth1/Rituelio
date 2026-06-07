// Petit badge affiché sur chaque carte pour distinguer un jeu « Fiche »
// (description) d'un jeu « Jouable » (mini-jeu interactif).

import type { Jeu } from "@/data/jeux";

export default function Badge({ type }: { type: Jeu["type"] }) {
  const estJouable = type === "jouable";

  // « Jouable » utilise l'accent badge du thème ; « Fiche » reste neutre (fond doux).
  const style = estJouable
    ? "bg-badge text-badge-encre"
    : "bg-fond text-encre-douce";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span aria-hidden="true">{estJouable ? "▶" : "📄"}</span>
      {estJouable ? "Jouable" : "Fiche"}
    </span>
  );
}
