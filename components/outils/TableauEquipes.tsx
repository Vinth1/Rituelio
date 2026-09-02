"use client";

// Outil « Tableau des équipes » : le prof crée N équipes puis leur donne des
// points à la main pendant l'activité. Pensé vidéoprojecteur (gros scores,
// grosses cibles de clic). Les scores sont gardés dans le localStorage : un
// rechargement en plein cours ne perd rien.
import { useEffect, useState } from "react";
import {
  type Equipe,
  chargerEquipes,
  creerEquipes,
  enregistrerEquipes,
} from "@/lib/equipes";
import { nouvelId } from "@/lib/classes";
import { CLES_ACCENT, couleurBande } from "@/lib/couleurs";

const PAS_POSSIBLES = [1, 2, 5, 10] as const;
const MAX_EQUIPES = 10;

export default function TableauEquipes() {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [charge, setCharge] = useState(false);
  const [nombre, setNombre] = useState(4);
  const [pas, setPas] = useState<number>(1);

  // Reprise de la partie en cours (localStorage, donc côté client seulement) —
  // faux positif de set-state-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setEquipes(chargerEquipes());
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sauvegarde à chaque changement, une fois la reprise faite.
  useEffect(() => {
    if (!charge) return;
    enregistrerEquipes(equipes);
  }, [equipes, charge]);

  const meilleurScore = equipes.reduce((m, e) => Math.max(m, e.score), 0);

  function marquer(id: string, points: number) {
    setEquipes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, score: e.score + points } : e)),
    );
  }

  function renommer(id: string, nom: string) {
    setEquipes((prev) => prev.map((e) => (e.id === id ? { ...e, nom } : e)));
  }

  function supprimer(id: string) {
    setEquipes((prev) => prev.filter((e) => e.id !== id));
  }

  function ajouter() {
    setEquipes((prev) =>
      prev.length >= MAX_EQUIPES
        ? prev
        : [...prev, { id: nouvelId(), nom: `Équipe ${prev.length + 1}`, score: 0 }],
    );
  }

  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  if (!charge) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-6 text-sm text-encre-douce">
        Chargement…
      </p>
    );
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl font-bold text-encre">
          🏆 Tableau des équipes
        </h1>
        {equipes.length > 0 && (
          <div
            role="group"
            aria-label="Points par clic"
            className="flex items-center gap-2 text-sm text-encre-douce"
          >
            Points par clic
            <div className="inline-flex items-center gap-1 rounded-full border border-ligne p-1">
              {PAS_POSSIBLES.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={pas === p}
                  onClick={() => setPas(p)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    pas === p
                      ? "bg-principal text-sur-principal"
                      : "text-encre-douce hover:text-encre"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {equipes.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-carte border border-dashed border-ligne p-10 text-center">
          <p className="text-sm text-encre-douce">
            Combien d’équipes s’affrontent aujourd’hui ?
          </p>
          <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
            Nombre d’équipes
            <input
              type="number"
              min={2}
              max={MAX_EQUIPES}
              value={nombre}
              onChange={(e) => setNombre(Number(e.target.value))}
              className="w-20 rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-center text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setEquipes(creerEquipes(Math.min(MAX_EQUIPES, Math.max(2, nombre))))
            }
            className={btnPrincipal}
          >
            Créer les équipes
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipes.map((eq, i) => {
              const enTete = eq.score > 0 && eq.score === meilleurScore;
              return (
                <article
                  key={eq.id}
                  className={`flex flex-col overflow-hidden rounded-carte border border-ligne bg-surface shadow-sm ${
                    enTete ? "ring-2 ring-principal" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 px-3 py-2 ${couleurBande(
                      CLES_ACCENT[i % CLES_ACCENT.length],
                    )}`}
                  >
                    <span aria-hidden="true">{enTete ? "🏆" : "▪"}</span>
                    <input
                      type="text"
                      value={eq.nom}
                      onChange={(e) => renommer(eq.id, e.target.value)}
                      aria-label={`Nom de l’équipe ${i + 1}`}
                      className="min-w-0 flex-1 rounded-moyen bg-transparent px-1 py-0.5 font-titre font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                    />
                    <button
                      type="button"
                      onClick={() => supprimer(eq.id)}
                      aria-label={`Supprimer ${eq.nom}`}
                      className="shrink-0 rounded-full px-2 text-lg leading-none opacity-60 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => marquer(eq.id, -pas)}
                      aria-label={`Retirer ${pas} point${pas > 1 ? "s" : ""} à ${eq.nom}`}
                      className="h-12 w-12 shrink-0 rounded-full text-2xl font-bold text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                    >
                      −
                    </button>
                    <p className="font-titre text-6xl font-extrabold tabular-nums text-encre">
                      {eq.score}
                    </p>
                    <button
                      type="button"
                      onClick={() => marquer(eq.id, pas)}
                      aria-label={`Ajouter ${pas} point${pas > 1 ? "s" : ""} à ${eq.nom}`}
                      className="h-12 w-12 shrink-0 rounded-full bg-principal text-2xl font-bold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={ajouter}
              disabled={equipes.length >= MAX_EQUIPES}
              className={btnFantome}
            >
              + Ajouter une équipe
            </button>
            <button
              type="button"
              onClick={() =>
                setEquipes((prev) => prev.map((e) => ({ ...e, score: 0 })))
              }
              className={btnFantome}
            >
              ↺ Remettre les scores à zéro
            </button>
            <button
              type="button"
              onClick={() => setEquipes([])}
              className={btnFantome}
            >
              ✕ Nouvelle partie
            </button>
          </div>
        </>
      )}
    </div>
  );
}
