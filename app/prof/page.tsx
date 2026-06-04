import Link from "next/link";
import { jeux } from "@/data/jeux";
import BasculeEspace from "@/components/BasculeEspace";
import Catalogue from "@/components/Catalogue";

// Espace prof : l'interface ludique complète (onglets + tuile à la une + grille),
// réutilisée telle quelle. Accès à la gestion des classes.
export default function EspaceProf() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BasculeEspace />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Espace prof</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choisis un rituel à préparer ou à projeter.
          </p>
        </div>
        <Link
          href="/classe"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          👥 Mes classes
        </Link>
      </div>

      <Catalogue jeux={jeux} />
    </div>
  );
}
