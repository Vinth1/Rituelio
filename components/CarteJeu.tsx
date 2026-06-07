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
    <article className="group relative flex flex-col overflow-hidden rounded-carte border border-ligne bg-surface shadow-sm transition hover:shadow-md">
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
            <h3 className="font-titre font-semibold text-encre">{jeu.titre}</h3>
            {jeu.duree && (
              <span className="shrink-0 text-xs text-encre-douce">⏱ {jeu.duree}</span>
            )}
          </div>
          <p className="text-sm text-encre-douce">{jeu.resume}</p>
          <div className="mt-auto pt-1">
            <Badge type={jeu.type} />
          </div>
        </div>
      </Link>

      {/* Bouton « Projeter » → vue plein écran pour le tableau (mode projection) */}
      <div className="border-t border-ligne p-3">
        <Link
          href={`/jeux/${jeu.id}/projeter`}
          className="block w-full rounded-moyen bg-badge px-3 py-1.5 text-center text-sm font-semibold text-badge-encre transition hover:bg-principal hover:text-sur-principal focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          ▶ Projeter
        </Link>
      </div>
    </article>
  );
}
