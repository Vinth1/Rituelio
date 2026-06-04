// Une carte de jeu dans la grille : icône, titre, résumé, durée et badge.
// (Le clic vers la fiche détaillée / le mini-jeu sera ajouté plus tard.)

import type { Jeu } from "@/data/jeux";
import { classeAccent } from "@/lib/couleurs";
import Badge from "./Badge";

export default function CarteJeu({ jeu }: { jeu: Jeu }) {
  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${classeAccent(jeu.couleur)}`}
          aria-hidden="true"
        >
          {jeu.icone}
        </span>
        {jeu.duree && (
          <span className="text-xs font-medium text-slate-400">
            ⏱ {jeu.duree}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-800">{jeu.titre}</h3>
        <p className="text-sm text-slate-500">{jeu.resume}</p>
      </div>

      <div className="mt-auto pt-2">
        <Badge type={jeu.type} />
      </div>
    </article>
  );
}
