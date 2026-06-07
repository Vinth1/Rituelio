"use client";

// Barre de navigation entre espaces : retour à l'accueil + bascule prof / élève.
// Affichée en haut des pages /prof et /eleve.
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BasculeEspace() {
  const pathname = usePathname() ?? "";
  const estEleve = pathname.startsWith("/eleve");

  const pastille = (actif: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
      actif
        ? "bg-principal text-sur-principal shadow-sm"
        : "text-encre-douce hover:text-encre"
    }`;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-encre-douce transition hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
      >
        <span aria-hidden="true">←</span> Accueil
      </Link>
      {/* En espace élève, on ne propose pas de revenir au mode prof :
          l'élève n'a que le retour à l'accueil. */}
      {!estEleve && (
        <div
          role="group"
          aria-label="Changer d'espace"
          className="inline-flex items-center gap-1 rounded-full border border-ligne bg-surface p-1"
        >
          <Link href="/prof" aria-current="page" className={pastille(true)}>
            Espace prof
          </Link>
          <Link href="/eleve" className={pastille(false)}>
            Espace élève
          </Link>
        </div>
      )}
    </div>
  );
}
