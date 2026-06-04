// Une carte de jeu : bande supérieure colorée avec l'icône, puis corps avec
// titre, résumé et badge. Toute la carte est un lien vers la page de détail.
import Link from "next/link";
import type { Jeu } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";
import Badge from "./Badge";

export default function CarteJeu({ jeu }: { jeu: Jeu }) {
  return (
    <Link
      href={`/jeux/${jeu.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
    >
      <div
        className={`flex h-[60px] items-center justify-center text-3xl ${couleurBande(jeu.couleur)}`}
        aria-hidden="true"
      >
        {jeu.icone}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {jeu.titre}
          </h3>
          {jeu.duree && (
            <span className="shrink-0 text-xs text-slate-400">⏱ {jeu.duree}</span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{jeu.resume}</p>
        <div className="mt-auto pt-1">
          <Badge type={jeu.type} />
        </div>
      </div>
    </Link>
  );
}
