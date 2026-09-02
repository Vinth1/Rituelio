import type { Metadata } from "next";
import Link from "next/link";
import { OUTILS } from "@/lib/outils";
import { couleurBande } from "@/lib/couleurs";

export const metadata: Metadata = {
  title: "Outils — Rituelio",
  description: "Les outils de classe : roue des prénoms, équipes, groupes, chrono.",
};

// Grille des outils de classe. La garde d'auth est assurée par le layout
// /prof/outils. Cartes calquées sur components/CarteJeu.tsx, en plus simple :
// un seul lien, ni badge ni bouton « Projeter ».
export default function PageOutils() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Outils de classe
        </h1>
        <p className="text-sm text-encre-douce">
          De quoi piloter la séance : tirer un élève, compter les points, former
          des groupes, gérer le temps.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OUTILS.map((outil) => (
          <Link
            key={outil.slug}
            href={`/prof/outils/${outil.slug}`}
            className="group flex flex-col overflow-hidden rounded-carte border border-ligne bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <div
              className={`flex h-[60px] items-center justify-center text-3xl ${couleurBande(outil.couleur)}`}
              aria-hidden="true"
            >
              {outil.icone}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h2 className="font-titre font-semibold text-encre">{outil.titre}</h2>
              <p className="text-sm text-encre-douce">{outil.resume}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
