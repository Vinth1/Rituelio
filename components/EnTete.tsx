// Barre de titre affichée en haut de toutes les pages :
// logo « rituelio », accès « Classes » et bouton de thème.
import Link from "next/link";
import Logo from "./Logo";
import BoutonTheme from "./BoutonTheme";

export default function EnTete() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <Logo />
          </Link>
          <nav>
            <Link
              href="/classe"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-300 dark:hover:bg-slate-800"
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
