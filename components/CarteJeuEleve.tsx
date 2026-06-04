// Carte de jeu version « élève » : grande, simple, sans infos réservées au prof.
// Mène à la fiche du jeu (en mode élève, qui masque l'aide pédagogique).
import Link from "next/link";
import type { Jeu } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";

export default function CarteJeuEleve({ jeu }: { jeu: Jeu }) {
  return (
    <Link
      href={`/jeux/${jeu.id}?espace=eleve`}
      className="group flex items-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-principal hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-700 dark:bg-slate-800"
    >
      <span
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${couleurBande(jeu.couleur)}`}
        aria-hidden="true"
      >
        {jeu.icone}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{jeu.titre}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{jeu.resume}</span>
      </span>
      <span
        className="ml-auto text-2xl text-slate-300 transition group-hover:text-principal"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}
