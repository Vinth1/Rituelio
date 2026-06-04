// Barre de titre affichée en haut de toutes les pages : logo « rituelio »
// (retour à l'accueil) + bouton de thème. La navigation prof/élève et l'accès
// aux classes vivent dans les espaces eux-mêmes.
import Link from "next/link";
import Logo from "./Logo";
import BoutonTheme from "./BoutonTheme";

export default function EnTete() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          aria-label="Rituelio — accueil"
        >
          <Logo />
        </Link>
        <BoutonTheme />
      </div>
    </header>
  );
}
