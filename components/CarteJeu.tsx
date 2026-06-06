// Carte de jeu (espace prof) : le corps mène à la fiche du jeu, et un bouton
// « Projeter » (placeholder pour l'instant — voir Jalon 6) est séparé du lien
// pour ne pas imbriquer deux éléments cliquables.
import Link from "next/link";
import type { Jeu } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";
import Badge from "./Badge";
import BoutonAide from "./BoutonAide";

export default function CarteJeu({ jeu }: { jeu: Jeu }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <BoutonAide jeu={jeu} />
      <Link
        href={`/jeux/${jeu.id}?espace=prof`}
        className="flex flex-1 flex-col transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal group-hover:-translate-y-0.5"
      >
        <div
          className={`flex h-[60px] items-center justify-center text-3xl ${couleurBande(jeu.couleur)}`}
          aria-hidden="true"
        >
          {jeu.icone}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{jeu.titre}</h3>
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

      {/* Bouton « Projeter » → vue plein écran pour le tableau (mode projection) */}
      <div className="border-t border-slate-100 p-3 dark:border-slate-700">
        <Link
          href={`/jeux/${jeu.id}/projeter`}
          className="block w-full rounded-lg bg-principal-clair px-3 py-1.5 text-center text-sm font-semibold text-principal-fonce transition hover:bg-principal hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:bg-principal/15 dark:text-principal"
        >
          ▶ Projeter
        </Link>
      </div>
    </article>
  );
}
