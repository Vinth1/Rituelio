// Barre de titre affichée en haut de toutes les pages : logo « rituelio »
// (retour à l'accueil) + bouton de thème. Si un prof est connecté : un bouton
// profil (avatar + pseudo, vers /profil) et « Se déconnecter ».
import Link from "next/link";
import Logo from "./Logo";
import BoutonTheme from "./BoutonTheme";
import BoutonDeconnexion from "./BoutonDeconnexion";
import { profConnecte } from "@/lib/serveur/session-prof";

export default async function EnTete() {
  const prof = await profConnecte();
  return (
    <header className="sticky top-0 z-10 border-b border-ligne bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded-moyen focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          aria-label="Rituelio — accueil"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {prof && (
            <>
              <Link
                href="/profil"
                aria-label={`Profil de ${prof.identifiant}`}
                className="inline-flex items-center gap-2 rounded-full border border-ligne bg-surface px-2.5 py-1.5 text-sm font-medium text-encre transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 text-principal"
                  role="img"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" fill="currentColor" />
                  <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6Z" fill="currentColor" />
                </svg>
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {prof.identifiant}
                </span>
              </Link>
              <BoutonDeconnexion />
            </>
          )}
          <BoutonTheme />
        </div>
      </div>
    </header>
  );
}
