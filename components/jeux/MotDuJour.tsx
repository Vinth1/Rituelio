"use client";

// Jeu jouable « Mot du jour » : pour une classe, attribuer à chaque élève un mot
// difficile à lire (lettres muettes, consonnes doublées, graphèmes complexes).
// Le dé global distribue un mot à tous d'un coup ; un petit dé par carte
// (re)tire un mot pour un seul élève. Pensé pour le vidéoprojecteur, sans
// persistance : l'état reste en mémoire et repart à zéro au rechargement.
import { useEffect, useState } from "react";
import Link from "next/link";
import { mots, type Mot } from "@/data/mots";
import { type Classe, chargerClasses } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "amber"; // accent de couleur du rituel « mot de la semaine »

// Tire un mot au hasard dans `mots`, en évitant ceux déjà présents dans
// `dejaUtilises` (ensemble de libellés) tant que la banque le permet. Si tous
// les mots sont déjà pris, on pioche quand même au hasard dans toute la banque.
function tirerMot(dejaUtilises: Set<string>): Mot {
  const disponibles = mots.filter((m) => !dejaUtilises.has(m.mot));
  const source = disponibles.length > 0 ? disponibles : mots;
  return source[Math.floor(Math.random() * source.length)];
}

export default function MotDuJour() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  // Mot attribué à chaque élève, indexé par id d'élève.
  const [attributions, setAttributions] = useState<Record<string, Mot>>({});

  // Chargement des classes depuis le localStorage (côté client uniquement).
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseActiveId(initiales[0]?.id ?? null);
    setCharge(true);
  }, []);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const aDesAttributions = eleves.some((el) => attributions[el.id]);

  // (Re)tire un mot pour un seul élève, en évitant les doublons avec les autres
  // élèves de la classe tant que la banque le permet.
  function tirerPour(eleveId: string) {
    setAttributions((prev) => {
      const utilisesAilleurs = new Set(
        eleves
          .filter((el) => el.id !== eleveId)
          .map((el) => prev[el.id]?.mot)
          .filter((m): m is string => Boolean(m)),
      );
      return { ...prev, [eleveId]: tirerMot(utilisesAilleurs) };
    });
  }

  // Donne un mot à chaque élève de la classe d'un coup, sans doublon tant que la
  // banque de mots est assez grande.
  function donnerATous() {
    if (eleves.length === 0) return;
    setAttributions((prev) => {
      const nouvelles = { ...prev };
      const utilises = new Set<string>();
      for (const el of eleves) {
        const mot = tirerMot(utilises);
        utilises.add(mot.mot);
        nouvelles[el.id] = mot;
      }
      return nouvelles;
    });
  }

  // Vide toutes les attributions.
  function reinitialiser() {
    setAttributions({});
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      {/* Barre du haut : titre, sélecteur de classe, actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Mot du jour
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {classes.length > 0 && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Classe
              <select
                value={classeActiveId ?? ""}
                onChange={(e) => setClasseActiveId(e.target.value)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={donnerATous}
            disabled={eleves.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">🎲</span> Donner un mot à tous
          </button>

          <button
            type="button"
            onClick={reinitialiser}
            disabled={!aDesAttributions}
            className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:ring-slate-600 dark:hover:bg-slate-700"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* États particuliers : chargement, aucune classe, classe vide */}
      {!charge ? (
        <p className="mt-6 text-sm text-slate-400">Chargement…</p>
      ) : classes.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucune classe pour le moment. Crée une classe et ses élèves depuis la
          page{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            « Mes classes »
          </Link>
          .
        </p>
      ) : eleves.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Cette classe ne contient encore aucun élève. Ajoute des élèves depuis
          la page{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            « Mes classes »
          </Link>
          .
        </p>
      ) : (
        /* Grille : une carte par élève */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {eleves.map((eleve) => {
            const mot = attributions[eleve.id];
            return (
              <div
                key={eleve.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                    {eleve.nom}
                  </span>
                  <button
                    type="button"
                    onClick={() => tirerPour(eleve.id)}
                    aria-label={`Tirer un mot pour ${eleve.nom}`}
                    className="shrink-0 rounded-full px-2 py-1 text-lg ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:ring-slate-600 dark:hover:bg-slate-800"
                  >
                    <span aria-hidden="true">🎲</span>
                  </button>
                </div>

                <div
                  className={`mt-3 flex min-h-24 flex-col items-center justify-center rounded-xl p-3 text-center ${couleurBande(ACCENT)}`}
                >
                  {mot ? (
                    <span className="text-2xl font-bold leading-tight">
                      {mot.mot}
                    </span>
                  ) : (
                    <span className="text-3xl font-bold opacity-50">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
