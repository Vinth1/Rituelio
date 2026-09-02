"use client";

// Bascule d'onglets de premier niveau de l'espace prof : « Activités » (le
// catalogue, /prof), « Dictées » (la banque de textes, /prof/dictees),
// « Outils » (les outils de classe, /prof/outils) et « Ma classe » (le pilotage
// de l'année, /ma-classe).
// Rendue en haut de /prof et des pages /prof/dictees/*, /prof/outils/* et /ma-classe/*.
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavEspaceProf() {
  const pathname = usePathname() ?? "";
  const estMaClasse = pathname.startsWith("/ma-classe");
  const estDictees = pathname.startsWith("/prof/dictees");
  const estOutils = pathname.startsWith("/prof/outils");
  const estActivites = !estMaClasse && !estDictees && !estOutils;

  const onglet = (actif: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
      actif
        ? "bg-principal text-sur-principal shadow-sm"
        : "text-encre-douce hover:text-encre"
    }`;

  return (
    <div
      role="group"
      aria-label="Sections de l'espace prof"
      className="mb-6 inline-flex items-center gap-1 rounded-full border border-ligne bg-surface p-1"
    >
      <Link
        href="/prof"
        aria-current={estActivites ? "page" : undefined}
        className={onglet(estActivites)}
      >
        Activités
      </Link>
      <Link
        href="/prof/dictees"
        aria-current={estDictees ? "page" : undefined}
        className={onglet(estDictees)}
      >
        Dictées
      </Link>
      <Link
        href="/prof/outils"
        aria-current={estOutils ? "page" : undefined}
        className={onglet(estOutils)}
      >
        Outils
      </Link>
      <Link
        href="/ma-classe"
        aria-current={estMaClasse ? "page" : undefined}
        className={onglet(estMaClasse)}
      >
        Ma classe
      </Link>
    </div>
  );
}
