"use client";

// Jeu « Roue des verbes » : trois roues côte à côte — un sujet, un verbe, un
// temps — lancées ensemble d'un seul bouton. Chaque roue se relance aussi
// toute seule, ce qui sert quand le hasard retombe sur la même chose ou qu'un
// tirage ne convient pas à la classe.
//
// La banque de verbes compte plus de 300 entrées : on ne peut pas toutes les
// afficher. À chaque lancer, la roue est REGARNIE de huit candidats tirés au
// sort, le gagnant compris ; l'échantillon change donc au départ de la
// rotation, jamais à l'arrivée.
//
// Le tirage, les réglages et la phrase de correction vivent dans
// `lib/roue-des-verbes.ts` (module pur, testé) ; ici, il n'y a que l'interface.
import { useCallback, useEffect, useRef, useState } from "react";
import Roue, { DUREE_MS, angleVers, type ItemRoue } from "@/components/Roue";
import { couleurBande } from "@/lib/couleurs";
import { cleTempsMode, type EntreeVerbe } from "@/lib/conjugueur";
import { GENRES_SUJET, type GenreSujet, type Sujet } from "@/data/sujets";
import {
  GROUPES,
  REGLAGES_DEFAUT,
  TEMPS_ROUE,
  chargerReglages,
  cleSujet,
  cleTemps,
  cleVerbe,
  echantillonner,
  enregistrerReglages,
  libelleCourtTemps,
  phraseReponse,
  piocher,
  sujetsPossibles,
  tempsPossibles,
  verbesPossibles,
  type ReglagesRoue,
  type TempsMode,
} from "@/lib/roue-des-verbes";

const ACCENT = "green";
const TAILLE_ROUE = 8; // secteurs affichés par roue

// ---------------------------------------------------------------------------
// Une roue : son échantillon affiché, son angle, son gagnant en attente
// ---------------------------------------------------------------------------

type Axe<T> = {
  items: ItemRoue[];
  angle: number;
  enRotation: boolean;
  valeur: T | null;
  garnir: (candidats: T[]) => void;
  lancer: (candidats: T[], exclu?: string) => void;
  terminer: () => void;
};

function useAxe<T>(cle: (t: T) => string, libelle: (t: T) => string): Axe<T> {
  const [items, setItems] = useState<ItemRoue[]>([]);
  const [angle, setAngle] = useState(0);
  const [enRotation, setEnRotation] = useState(false);
  // Gagnant choisi au lancer, révélé seulement à l'arrêt de la roue.
  const [valeur, setValeur] = useState<T | null>(null);
  const attente = useRef<T | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coupe la minuterie de secours si le jeu est quitté pendant une rotation.
  useEffect(() => {
    return () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, []);

  const versItems = useCallback(
    (liste: T[]): ItemRoue[] =>
      liste.map((t) => ({ id: cle(t), libelle: libelle(t) })),
    [cle, libelle],
  );

  // Révèle le gagnant : appelé à la fin de la transition, avec une minuterie de
  // secours si l'événement n'arrive pas.
  const terminer = useCallback(() => {
    if (attente.current === null) return;
    if (minuterie.current) {
      clearTimeout(minuterie.current);
      minuterie.current = null;
    }
    setValeur(attente.current);
    attente.current = null;
    setEnRotation(false);
  }, []);

  // Remplit la roue sans la faire tourner (au chargement, ou quand un réglage
  // change les candidats).
  const garnir = useCallback(
    (candidats: T[]) => {
      setItems(versItems(echantillonner(candidats, cle, TAILLE_ROUE)));
    },
    [cle, versItems],
  );

  const lancer = useCallback(
    (candidats: T[], exclu?: string) => {
      const gagnant = piocher(candidats, cle, exclu);
      if (!gagnant) return;
      const echantillon = echantillonner(candidats, cle, TAILLE_ROUE, gagnant);
      const index = echantillon.findIndex((t) => cle(t) === cle(gagnant));
      setItems(versItems(echantillon));
      setValeur(null);
      attente.current = gagnant;
      setEnRotation(true);
      setAngle((a) => angleVers(index, echantillon.length, a));
      minuterie.current = setTimeout(terminer, DUREE_MS + 400);
    },
    [cle, terminer, versItems],
  );

  return { items, angle, enRotation, valeur, garnir, lancer, terminer };
}

// ---------------------------------------------------------------------------

const btnPrincipal =
  "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
const btnFantome =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

const libelleSujet = (s: Sujet) => s.libelle;
const libelleVerbe = (v: EntreeVerbe) => v.infinitif;

export default function RoueDesVerbes() {
  const [reglages, setReglages] = useState<ReglagesRoue>(REGLAGES_DEFAUT);
  const [charge, setCharge] = useState(false);
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [reponseVisible, setReponseVisible] = useState(false);

  const axeSujet = useAxe<Sujet>(cleSujet, libelleSujet);
  const axeVerbe = useAxe<EntreeVerbe>(cleVerbe, libelleVerbe);
  const axeTemps = useAxe<TempsMode>(cleTemps, libelleCourtTemps);

  // Les réglages ne sont lus qu'après le montage : le localStorage n'existe pas
  // au rendu serveur, et les valeurs par défaut évitent tout écart d'hydratation
  // — faux positif de set-state-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setReglages(chargerReglages());
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sujets = sujetsPossibles(reglages);
  const verbes = verbesPossibles(reglages);
  const temps = tempsPossibles(reglages);
  const roueVide = sujets.length === 0 || verbes.length === 0 || temps.length === 0;

  const { garnir: garnirSujet } = axeSujet;
  const { garnir: garnirVerbe } = axeVerbe;
  const { garnir: garnirTemps } = axeTemps;

  // Regarnit les roues à l'arrêt quand les réglages changent, pour que
  // l'affichage colle toujours à ce qui peut sortir.
  useEffect(() => {
    if (!charge) return;
    garnirSujet(sujetsPossibles(reglages));
    garnirVerbe(verbesPossibles(reglages));
    garnirTemps(tempsPossibles(reglages));
  }, [charge, reglages, garnirSujet, garnirVerbe, garnirTemps]);

  const enRotation =
    axeSujet.enRotation || axeVerbe.enRotation || axeTemps.enRotation;
  const tirage =
    axeSujet.valeur && axeVerbe.valeur && axeTemps.valeur
      ? {
          sujet: axeSujet.valeur,
          verbe: axeVerbe.valeur,
          temps: axeTemps.valeur,
        }
      : null;
  const reponse = tirage ? phraseReponse(tirage) : null;

  function lancerTout() {
    if (enRotation || roueVide) return;
    setReponseVisible(false);
    axeSujet.lancer(sujets, axeSujet.valeur?.id);
    axeVerbe.lancer(verbes, axeVerbe.valeur?.infinitif);
    axeTemps.lancer(
      temps,
      axeTemps.valeur ? cleTempsMode(axeTemps.valeur) : undefined,
    );
  }

  function majReglages(suite: ReglagesRoue) {
    setReglages(suite);
    enregistrerReglages(suite);
  }

  // Coche / décoche une valeur dans l'une des trois listes de réglages.
  function basculer<T extends string>(liste: T[], valeur: T): T[] {
    return liste.includes(valeur)
      ? liste.filter((v) => v !== valeur)
      : [...liste, valeur];
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-carte px-4 py-3 ${couleurBande(ACCENT)}`}
      >
        <h2 className="font-titre text-2xl font-bold">🎡 Roue des verbes</h2>
        <button
          type="button"
          onClick={() => setReglagesOuverts((o) => !o)}
          aria-expanded={reglagesOuverts}
          className="rounded-full px-3 py-1 text-sm font-semibold underline transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          ⚙ Réglages
        </button>
      </div>

      {reglagesOuverts && (
        <div className="mt-4 grid gap-5 rounded-carte bg-fond p-4 sm:grid-cols-3">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
              Temps
            </legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {TEMPS_ROUE.map((tm) => {
                const cle = cleTempsMode(tm);
                return (
                  <label
                    key={cle}
                    className="flex items-center gap-2 text-sm text-encre"
                  >
                    <input
                      type="checkbox"
                      checked={reglages.temps.includes(cle)}
                      onChange={() =>
                        majReglages({
                          ...reglages,
                          temps: basculer(reglages.temps, cle),
                        })
                      }
                      disabled={enRotation}
                      className="h-4 w-4 accent-principal"
                    />
                    {libelleCourtTemps(tm)}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
              Sujets
            </legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {GENRES_SUJET.map(({ genre, label }) => (
                <label
                  key={genre}
                  className="flex items-center gap-2 text-sm text-encre"
                >
                  <input
                    type="checkbox"
                    checked={reglages.genres.includes(genre)}
                    onChange={() =>
                      majReglages({
                        ...reglages,
                        genres: basculer<GenreSujet>(reglages.genres, genre),
                      })
                    }
                    disabled={enRotation}
                    className="h-4 w-4 accent-principal"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
              Verbes
            </legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {GROUPES.map((groupe) => (
                <label
                  key={groupe}
                  className="flex items-center gap-2 text-sm text-encre"
                >
                  <input
                    type="checkbox"
                    checked={reglages.groupes.includes(groupe)}
                    onChange={() =>
                      majReglages({
                        ...reglages,
                        groupes: basculer(reglages.groupes, groupe),
                      })
                    }
                    disabled={enRotation}
                    className="h-4 w-4 accent-principal"
                  />
                  {groupe}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {roueVide && (
        <p
          role="alert"
          className="mt-4 rounded-carte border border-dashed border-ligne p-4 text-center text-sm text-encre-douce"
        >
          Une roue est vide : coche au moins un temps, un type de sujet et un
          groupe de verbes dans les réglages.
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <BlocRoue
          titre="Sujet"
          axe={axeSujet}
          maxCar={17}
          onRelancer={() => {
            setReponseVisible(false);
            axeSujet.lancer(sujets, axeSujet.valeur?.id);
          }}
          desactive={enRotation || sujets.length === 0}
        />
        <BlocRoue
          titre="Verbe"
          axe={axeVerbe}
          maxCar={14}
          onRelancer={() => {
            setReponseVisible(false);
            axeVerbe.lancer(verbes, axeVerbe.valeur?.infinitif);
          }}
          desactive={enRotation || verbes.length === 0}
        />
        <BlocRoue
          titre="Temps"
          axe={axeTemps}
          maxCar={17}
          onRelancer={() => {
            setReponseVisible(false);
            axeTemps.lancer(
              temps,
              axeTemps.valeur ? cleTempsMode(axeTemps.valeur) : undefined,
            );
          }}
          desactive={enRotation || temps.length === 0}
        />
      </div>

      <div
        aria-live="polite"
        className="mt-6 rounded-carte bg-fond px-4 py-4 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
          {enRotation ? "Les roues tournent…" : "À conjuguer"}
        </p>
        <p className="font-titre text-2xl font-extrabold text-encre sm:text-3xl">
          {enRotation || !tirage
            ? "…"
            : `${tirage.sujet.libelle} · ${tirage.verbe.infinitif} · ${libelleCourtTemps(tirage.temps)}`}
        </p>
        {reponseVisible && reponse && (
          <p className="mt-2 font-titre text-xl font-bold text-principal-fonce sm:text-2xl">
            « {reponse} »
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={lancerTout}
          disabled={enRotation || roueVide}
          className={btnPrincipal}
        >
          <span aria-hidden="true">🎡</span> Lancer les trois roues
        </button>
        <button
          type="button"
          onClick={() => setReponseVisible((v) => !v)}
          disabled={enRotation || !reponse}
          className={btnFantome}
        >
          <span aria-hidden="true">👁</span>{" "}
          {reponseVisible ? "Cacher la réponse" : "Voir la réponse"}
        </button>
      </div>
    </div>
  );
}

// Une roue avec son étiquette et son bouton de relance individuelle.
function BlocRoue<T>({
  titre,
  axe,
  maxCar,
  onRelancer,
  desactive,
}: {
  titre: string;
  axe: Axe<T>;
  maxCar: number;
  onRelancer: () => void;
  desactive: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
        {titre}
      </p>
      <div className="w-full max-w-[15rem]">
        {axe.items.length === 0 ? (
          <div className="flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
            Roue vide
          </div>
        ) : (
          <Roue
            items={axe.items}
            angle={axe.angle}
            onFin={axe.terminer}
            label={`Roue « ${titre} »`}
            maxCar={maxCar}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRelancer}
        disabled={desactive}
        className={btnFantome}
      >
        ↺ Relancer
      </button>
    </div>
  );
}
