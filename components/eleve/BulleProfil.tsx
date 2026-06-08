// Bulle de profil circulaire : affiche l'initiale du prénom (ou « ? » si vide)
// centrée sur un fond coloré. Présentationnelle (aucun état) ; réutilisée dans
// l'onboarding (grande) et dans l'en-tête de l'espace élève (petite).
import { initialeDe } from "@/lib/profil-eleve";

type Props = {
  prenom: string;
  couleur: string; // valeur hex (style inline, cf. Tailwind v4)
  taille?: "grande" | "petite";
};

export default function BulleProfil({ prenom, couleur, taille = "grande" }: Props) {
  const vide = prenom.trim() === "";
  const dims =
    taille === "grande" ? "h-28 w-28 text-5xl" : "h-11 w-11 text-lg";

  return (
    <span
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-titre font-bold leading-none text-white shadow-inner ring-2 ring-white/40 select-none`}
      style={{ backgroundColor: couleur }}
      aria-hidden="true"
    >
      {/* Léger contraste pour que l'initiale blanche reste lisible sur les
          couleurs claires de la palette. Placeholder « ? » plus discret. */}
      <span
        className={vide ? "opacity-60" : ""}
        style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.35)" }}
      >
        {initialeDe(prenom)}
      </span>
    </span>
  );
}
