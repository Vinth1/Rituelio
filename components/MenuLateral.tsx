// Menu latéral : liste des catégories (rituels) avec le nombre de jeux.
// Le filtrage au clic sera ajouté plus tard (feuille de route, étape 5) ;
// pour l'instant la liste est purement informative et « Tous les jeux »
// est l'entrée active.

import { jeux } from "@/data/jeux";
import { CATEGORIES } from "@/lib/categories";

export default function MenuLateral() {
  const total = jeux.length;

  return (
    <nav aria-label="Catégories de rituels">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Rituels
      </p>

      <ul className="flex flex-col gap-1">
        <li
          aria-current="page"
          className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">🎲</span>
            Tous les jeux
          </span>
          <span className="rounded-full bg-white/20 px-2 text-xs">{total}</span>
        </li>

        {CATEGORIES.map((cat) => {
          const nombre = jeux.filter((j) => j.categorie === cat.slug).length;
          return (
            <li
              key={cat.slug}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{cat.icone}</span>
                {cat.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 text-xs text-slate-500">
                {nombre}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
