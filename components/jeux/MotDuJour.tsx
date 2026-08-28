"use client";

// Jeu jouable « Mot du jour » : pour une classe, attribuer à chaque élève un mot
// difficile à lire ou à écrire (lettres muettes, consonnes doublées, graphèmes
// complexes). Le dé global distribue un mot à tous d'un coup ; un petit dé par
// carte (re)tire un mot pour un seul élève. Le prof choisit le niveau de sa
// classe : le tirage se limite alors aux mots de ce niveau et des niveaux
// inférieurs. Pensé pour le vidéoprojecteur, sans persistance : l'état reste en
// mémoire et repart à zéro au rechargement.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mots, type Mot } from "@/data/mots";
import { type Classe, chargerClasses } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";
import { NIVEAUX, estJusqua, type Niveau } from "@/lib/niveaux";

const ACCENT = "amber"; // accent de couleur du rituel « mot de la semaine »

// Niveau proposé par défaut : le plus élevé, donc toute la banque est ouverte.
const NIVEAU_PAR_DEFAUT: Niveau = NIVEAUX[NIVEAUX.length - 1].slug;

// Tire un mot au hasard dans `banque`, en évitant ceux déjà présents dans
// `dejaUtilises` (ensemble de libellés) tant que la banque le permet. Si tous
// les mots sont déjà pris, on pioche quand même au hasard dans toute la banque.
function tirerMot(dejaUtilises: Set<string>, banque: Mot[]): Mot {
  const disponibles = banque.filter((m) => !dejaUtilises.has(m.mot));
  const source = disponibles.length > 0 ? disponibles : banque;
  return source[Math.floor(Math.random() * source.length)];
}

export default function MotDuJour() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  // Mot attribué à chaque élève, indexé par id d'élève.
  const [attributions, setAttributions] = useState<Record<string, Mot>>({});
  // Niveau de la classe : le tirage s'y limite, niveaux inférieurs inclus.
  const [niveauMax, setNiveauMax] = useState<Niveau>(NIVEAU_PAR_DEFAUT);

  // Chargement des classes depuis le localStorage (côté client uniquement) : initialisé
  // dans un effet pour éviter un décalage d'hydratation (faux positif de set-state-in-effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseActiveId(initiales[0]?.id ?? null);
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const aDesAttributions = eleves.some((el) => attributions[el.id]);

  // Banque de mots réellement piochable, selon le niveau choisi (cumulatif).
  // Changer de niveau ne touche pas aux mots déjà distribués : seuls les
  // tirages suivants utilisent la nouvelle banque.
  const banque = useMemo(
    () => mots.filter((m) => estJusqua(m.niveau, niveauMax)),
    [niveauMax],
  );

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
      return { ...prev, [eleveId]: tirerMot(utilisesAilleurs, banque) };
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
        const mot = tirerMot(utilises, banque);
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
    <div className="rounded-carte border border-ligne bg-surface p-6">
      {/* Barre du haut : titre, sélecteur de classe, actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Mot du jour
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {classes.length > 0 && (
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeActiveId ?? ""}
                onChange={(e) => setClasseActiveId(e.target.value)}
                className="rounded-full border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Niveau : cumulatif — « jusqu'à la 5ᵉ » inclut CM1, CM2 et 6ᵉ. */}
          <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
            Jusqu&apos;au niveau
            <select
              value={niveauMax}
              onChange={(e) => setNiveauMax(e.target.value as Niveau)}
              className="rounded-full border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              {NIVEAUX.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={donnerATous}
            disabled={eleves.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">🎲</span> Donner un mot à tous
          </button>

          <button
            type="button"
            onClick={reinitialiser}
            disabled={!aDesAttributions}
            className="rounded-full px-3 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* États particuliers : chargement, aucune classe, classe vide */}
      {!charge ? (
        <p className="mt-6 text-sm text-encre-douce">Chargement…</p>
      ) : classes.length === 0 ? (
        <p className="mt-6 rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
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
        <p className="mt-6 rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
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
                className="flex flex-col rounded-carte border border-ligne bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-encre">
                    {eleve.nom}
                  </span>
                  <button
                    type="button"
                    onClick={() => tirerPour(eleve.id)}
                    aria-label={`Tirer un mot pour ${eleve.nom}`}
                    className="shrink-0 rounded-full px-2 py-1 text-lg ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    <span aria-hidden="true">🎲</span>
                  </button>
                </div>

                <div
                  className={`mt-3 flex min-h-24 flex-col items-center justify-center rounded-moyen p-3 text-center ${couleurBande(ACCENT)}`}
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
