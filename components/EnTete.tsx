// Barre de titre affichée en haut de toutes les pages :
// logo + nom « Rituelio » (lien vers l'accueil), accès « Classes » et bouton de thème.
import Link from "next/link";
import BoutonTheme from "./BoutonTheme";

export default function EnTete() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg shadow-sm"
              aria-hidden="true"
            >
              🎲
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Rituelio
            </span>
          </Link>
          <nav>
            <Link
              href="/classe"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Classes
            </Link>
          </nav>
        </div>
        <BoutonTheme />
      </div>
    </header>
  );
}
