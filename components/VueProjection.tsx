"use client";

// Vue « affichage classe » : plein écran, fort contraste, très grands caractères,
// pensée pour le vidéoprojecteur / TBI. Affiche le déroulé une étape à la fois
// (navigation au clavier : ← → ou Espace) ou tout d'un coup.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Jeu } from "@/data/jeux";

export default function VueProjection({ jeu }: { jeu: Jeu }) {
  const etapes = jeu.deroule ?? [];
  const total = etapes.length;
  const [i, setI] = useState(0);
  const [tout, setTout] = useState(false);

  const suivant = () => setI((x) => Math.min(x + 1, total - 1));
  const precedent = () => setI((x) => Math.max(x - 1, 0));

  // Navigation au clavier (utile au tableau avec une télécommande).
  useEffect(() => {
    if (tout || total === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setI((x) => Math.min(x + 1, total - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setI((x) => Math.max(x - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tout, total]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white">
      {/* Haut : titre + quitter */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl" aria-hidden="true">
            {jeu.icone}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-4xl">{jeu.titre}</h1>
            {jeu.duree && (
              <p className="text-sm text-slate-400 sm:text-base">⏱ {jeu.duree}</p>
            )}
          </div>
        </div>
        <Link
          href={`/jeux/${jeu.id}?espace=prof`}
          className="shrink-0 rounded-full bg-white/10 px-5 py-2.5 text-base font-semibold transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ✕ Quitter
        </Link>
      </header>

      {/* Centre : déroulé */}
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-6 text-center sm:px-16">
        {total === 0 ? (
          <p className="max-w-4xl text-3xl font-bold leading-snug sm:text-5xl">{jeu.resume}</p>
        ) : tout ? (
          <ol className="mx-auto max-w-4xl space-y-5 text-left">
            {etapes.map((e, idx) => (
              <li key={idx} className="flex gap-4 text-2xl font-semibold leading-snug sm:text-3xl">
                <span className="text-principal">{idx + 1}.</span>
                <span>{e}</span>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <p className="mb-6 text-2xl font-bold uppercase tracking-wide text-principal sm:text-3xl">
              Étape {i + 1} / {total}
            </p>
            <p className="max-w-5xl text-4xl font-extrabold leading-snug sm:text-6xl">
              {etapes[i]}
            </p>
          </>
        )}
      </main>

      {/* Bas : navigation */}
      <footer className="flex flex-wrap items-center justify-center gap-3 px-6 py-6 sm:gap-4">
        {total > 0 && !tout && (
          <>
            <button
              type="button"
              onClick={precedent}
              disabled={i === 0}
              className="rounded-2xl bg-white/10 px-6 py-3 text-lg font-bold transition hover:bg-white/20 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ← Précédent
            </button>
            <button
              type="button"
              onClick={suivant}
              disabled={i === total - 1}
              className="rounded-2xl bg-principal px-8 py-3 text-lg font-bold text-white transition hover:bg-principal-fonce disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Suivant →
            </button>
          </>
        )}
        {total > 0 && (
          <button
            type="button"
            onClick={() => setTout((t) => !t)}
            className="rounded-2xl px-5 py-3 text-base font-semibold text-slate-300 ring-1 ring-white/20 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {tout ? "Une étape à la fois" : "Tout afficher"}
          </button>
        )}
      </footer>
    </div>
  );
}
