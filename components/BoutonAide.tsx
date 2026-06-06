"use client";

// Bulle « ? » placée dans le coin supérieur droit d'une carte de jeu (espace prof).
// Au clic, elle ouvre un panneau en bas de la page avec l'aide pédagogique du jeu
// (objectifs + conseils) — auparavant affichée sur la page du jeu. Ne s'affiche
// que si le jeu a du contenu d'aide.
import { useState } from "react";
import type { Jeu } from "@/data/jeux";

export default function BoutonAide({ jeu }: { jeu: Jeu }) {
  const [ouvert, setOuvert] = useState(false);
  const aDuContenu = (jeu.objectifs?.length ?? 0) > 0 || Boolean(jeu.aide);
  if (!aDuContenu) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={`Aide prof : ${jeu.titre}`}
        title="Plus d'infos / Aide (prof)"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white hover:text-principal focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-700"
      >
        ?
      </button>

      {ouvert && (
        <>
          {/* Fond cliquable pour fermer */}
          <button
            type="button"
            aria-label="Fermer l'aide"
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-900/40"
          />
          {/* Panneau qui s'ouvre en bas de la page */}
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-principal-fonce dark:text-principal">
                  Aide prof — {jeu.titre}
                </h2>
                <button
                  type="button"
                  onClick={() => setOuvert(false)}
                  className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700"
                >
                  Fermer
                </button>
              </div>

              {jeu.objectifs?.length ? (
                <>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Objectifs
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {jeu.objectifs.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {jeu.aide ? (
                <>
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Conseils
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {jeu.aide}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
