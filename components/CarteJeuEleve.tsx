// Carte de jeu version « élève » : grande, simple, sans infos réservées au prof.
// Mène à la fiche du jeu (en mode élève, qui masque l'aide pédagogique).
import Link from "next/link";
import type { Jeu } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";

export default function CarteJeuEleve({ jeu }: { jeu: Jeu }) {
  return (
    <Link
      href={`/jeux/${jeu.id}?espace=eleve`}
      className="group flex items-center gap-4 rounded-carte border-2 border-ligne bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-principal hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
    >
      <span
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-carte text-3xl ${couleurBande(jeu.couleur)}`}
        aria-hidden="true"
      >
        {jeu.icone}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-titre text-lg font-bold text-encre">{jeu.titre}</span>
        <span className="text-sm text-encre-douce">{jeu.resume}</span>
      </span>
      <span
        className="ml-auto text-2xl text-encre-douce transition group-hover:text-principal"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}
