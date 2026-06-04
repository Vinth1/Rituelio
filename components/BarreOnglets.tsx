"use client";

// Rangée d'onglets-pastilles pour filtrer la grille par rituel :
// une pastille « Tous » + une pastille par catégorie présente.
import type { CategorieJeu } from "@/data/jeux";
import type { InfoCategorie } from "@/lib/categories";

export type FiltreCategorie = CategorieJeu | "tous";

type Props = {
  categories: InfoCategorie[];
  active: FiltreCategorie;
  onChange: (filtre: FiltreCategorie) => void;
};

export default function BarreOnglets({ categories, active, onChange }: Props) {
  const onglets: { cle: FiltreCategorie; label: string; icone: string }[] = [
    { cle: "tous", label: "Tous", icone: "🎲" },
    ...categories.map((c) => ({ cle: c.slug, label: c.label, icone: c.icone })),
  ];

  return (
    <div role="group" aria-label="Filtrer par rituel" className="flex flex-wrap gap-2">
      {onglets.map((o) => {
        const actif = o.cle === active;
        return (
          <button
            key={o.cle}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(o.cle)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              actif
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            <span aria-hidden="true">{o.icone}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
