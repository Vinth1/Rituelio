"use client";

// Fiche élève du module Comportement : balance de points (barème classeur école),
// suggestions d'escalade (seuils atteints — affichage seulement) et historique
// chronologique des faits, avec suppression pour corriger une saisie.
import {
  aujourdhuiISO,
  balance,
  evaluerSeuils,
  infoType,
  type FaitComportement,
} from "@/lib/comportement";
import { couleurBande } from "@/lib/couleurs";

type Eleve = { id: string; nom: string };

// "2026-09-02" → "02/09/2026".
function dateLisible(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export default function FicheEleve({
  eleve,
  faits,
  onAjouter,
  onSupprime,
}: {
  eleve: Eleve;
  faits: FaitComportement[];
  onAjouter: () => void;
  onSupprime: (id: string) => void;
}) {
  const bal = balance(faits);
  const signaux = evaluerSeuils(faits, aujourdhuiISO());

  return (
    <div className="flex flex-col gap-4 rounded-carte border border-ligne bg-surface p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-titre text-xl font-bold text-encre">{eleve.nom}</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              bal > 0
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                : bal < 0
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200"
                  : "bg-fond text-encre-douce ring-1 ring-ligne"
            }`}
            title="Balance de points (barème du classeur école)"
          >
            Balance {bal > 0 ? `+${bal}` : bal}
          </span>
        </div>
        <button
          type="button"
          onClick={onAjouter}
          className="rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          + Fait
        </button>
      </header>

      {signaux.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {signaux.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-moyen bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-100"
            >
              <span aria-hidden="true">⚠</span>
              <span>
                Seuil atteint : {s.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {faits.length === 0 ? (
        <p className="rounded-moyen border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
          Aucun fait enregistré pour cet élève.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {faits.map((f) => {
            const info = infoType(f.type);
            return (
              <li
                key={f.id}
                className="flex flex-wrap items-start gap-3 rounded-moyen border border-ligne p-3"
              >
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${couleurBande(info.couleur)}`}
                >
                  {info.libelle} {info.points > 0 ? `+${info.points}` : info.points}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-encre">{f.raison}</p>
                  {f.details && (
                    <p className="mt-0.5 text-xs text-encre-douce">{f.details}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-encre-douce">
                  {dateLisible(f.dateISO)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Supprimer ce fait ?")) onSupprime(f.id);
                  }}
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  aria-label={`Supprimer le fait du ${dateLisible(f.dateISO)}`}
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
