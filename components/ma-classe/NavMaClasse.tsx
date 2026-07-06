"use client";

// Sous-navigation de la catégorie « Ma classe » : tableau de bord + modules.
// Les modules autres que le tableau de bord et les réglages sont pour l'instant
// des placeholders (« bientôt »).
import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/ma-classe", libelle: "Tableau de bord" },
  { href: "/ma-classe/emploi-du-temps", libelle: "Emploi du temps" },
  { href: "/ma-classe/prepa", libelle: "Prépa" },
  { href: "/ma-classe/notes", libelle: "Notes" },
  { href: "/ma-classe/comportement", libelle: "Comportement" },
  { href: "/ma-classe/reglages", libelle: "Réglages" },
] as const;

export default function NavMaClasse() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Ma classe" className="mb-6 flex flex-wrap gap-2">
      {LIENS.map((lien) => {
        const actif =
          lien.href === "/ma-classe"
            ? pathname === "/ma-classe"
            : pathname.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={actif ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
              actif
                ? "bg-principal text-sur-principal shadow-sm"
                : "bg-surface text-encre-douce ring-1 ring-ligne hover:bg-fond"
            }`}
          >
            {lien.libelle}
          </Link>
        );
      })}
    </nav>
  );
}
