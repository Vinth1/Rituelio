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
        ? "bg-principal text-white shadow-sm"
        : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
    }`;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span aria-hidden="true">←</span> Accueil
      </Link>
      <div
        role="group"
        aria-label="Changer d'espace"
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800"
      >
        <Link href="/prof" aria-current={!estEleve ? "page" : undefined} className={pastille(!estEleve)}>
          Espace prof
        </Link>
        <Link href="/eleve" aria-current={estEleve ? "page" : undefined} className={pastille(estEleve)}>
          Espace élève
        </Link>
      </div>
    </div>
  );
}
