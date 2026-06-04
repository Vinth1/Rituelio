// Grande bannière « rituel à la une » : met en avant un jeu, avec un bouton
// « Lancer » qui mène (pour l'instant) vers sa page de détail.
import Link from "next/link";
import type { Jeu } from "@/data/jeux";
import { couleurBanniere } from "@/lib/couleurs";

export default function TuileALaUne({ jeu }: { jeu: Jeu }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl p-6 text-white shadow-sm sm:p-8 ${couleurBanniere(jeu.couleur)}`}
    >
      <span className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
        Rituel à la une
      </span>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">
            {jeu.icone}
          </span>
          <h2 className="text-2xl font-bold drop-shadow-sm sm:text-3xl">
            {jeu.titre}
          </h2>
        </div>

        <Link
          href={`/jeux/${jeu.id}`}
          className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 font-semibold text-slate-900 shadow transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:self-auto"
        >
          <span aria-hidden="true">▶</span> Lancer
        </Link>
      </div>
    </section>
  );
}
