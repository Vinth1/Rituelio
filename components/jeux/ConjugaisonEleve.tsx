"use client";

// Écran « Conjugaison » côté élève : un hub à onglets. Pour l'instant un seul
// onglet, « Rejoindre une évaluation » (rejoindre une évaluation de conjugaison
// avec le code donné par le prof). La barre d'onglets est prête à accueillir
// d'autres activités élève plus tard (ex. un entraînement en autonomie).
import { useState } from "react";
import RejoindreEvaluation from "@/components/evaluation/RejoindreEvaluation";

type Onglet = "rejoindre";

const ONGLETS: { id: Onglet; label: string; icone: string }[] = [
  { id: "rejoindre", label: "Rejoindre une évaluation", icone: "📝" },
];

export default function ConjugaisonEleve() {
  const [onglet, setOnglet] = useState<Onglet>("rejoindre");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-titre text-2xl font-bold text-encre sm:text-3xl">
          Conjugaison
        </h1>
        <p className="mt-1 text-encre-douce">Choisis une activité.</p>
      </div>

      {/* Barre d'onglets (prête pour d'autres activités plus tard). */}
      <div
        role="tablist"
        aria-label="Activités de conjugaison"
        className="inline-flex flex-wrap gap-1 self-start rounded-full bg-fond p-1"
      >
        {ONGLETS.map((o) => {
          const actif = o.id === onglet;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setOnglet(o.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                actif
                  ? "bg-surface text-principal shadow-sm"
                  : "text-encre-douce hover:text-encre"
              }`}
            >
              <span aria-hidden="true">{o.icone}</span> {o.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {onglet === "rejoindre" && <RejoindreEvaluation />}
      </div>
    </div>
  );
}
