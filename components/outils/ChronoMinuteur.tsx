"use client";

// Outil « Chrono & minuteur » : deux modes dans un seul écran, en gros
// caractères pour la projection. Le temps est ancré sur Date.now() (départ +
// durée accumulée aux pauses) plutôt que compté tick par tick : l'affichage ne
// dérive donc pas, même si le navigateur ralentit les minuteries.
// Le bip de fin est synthétisé (aucun fichier audio) et n'est armé qu'après un
// clic sur « Démarrer », ce qu'exigent les règles de lecture automatique.
import { useEffect, useRef, useState } from "react";

type Mode = "chrono" | "minuteur";

const TICK_MS = 50; // rafraîchissement de l'affichage
const PRESETS_MIN = [1, 2, 5, 10, 15] as const;
const RAYON = 45;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

function deuxChiffres(n: number): string {
  return n.toString().padStart(2, "0");
}

// « 07:23 », « 1:04:09 », et un dixième en plus pour le chronomètre.
function formater(ms: number, avecDixieme: boolean): string {
  const total = Math.max(0, ms);
  const heures = Math.floor(total / 3_600_000);
  const minutes = Math.floor(total / 60_000) % 60;
  const secondes = Math.floor(total / 1000) % 60;
  const base =
    heures > 0
      ? `${heures}:${deuxChiffres(minutes)}:${deuxChiffres(secondes)}`
      : `${deuxChiffres(minutes)}:${deuxChiffres(secondes)}`;
  return avecDixieme ? `${base},${Math.floor(total / 100) % 10}` : base;
}

// Trois brèves notes de fin. Silencieux si l'API audio n'est pas disponible.
function bip() {
  try {
    const ctx = new AudioContext();
    const debut = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const depart = debut + i * 0.25;
      const osc = ctx.createOscillator();
      const volume = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      volume.gain.setValueAtTime(0.0001, depart);
      volume.gain.exponentialRampToValueAtTime(0.3, depart + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, depart + 0.2);
      osc.connect(volume).connect(ctx.destination);
      osc.start(depart);
      osc.stop(depart + 0.22);
    }
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* pas de son : l'outil reste utilisable */
  }
}

export default function ChronoMinuteur() {
  const [mode, setMode] = useState<Mode>("chrono");
  const [ecoule, setEcoule] = useState(0); // ms depuis le premier départ
  const [enMarche, setEnMarche] = useState(false);
  const [tours, setTours] = useState<number[]>([]);
  const [duree, setDuree] = useState(5 * 60_000); // minuteur : durée visée
  const [fini, setFini] = useState(false);
  const [son, setSon] = useState(true);
  // Date du dernier départ, et temps déjà couru avant lui (cumul des pauses).
  const depart = useRef<number | null>(null);
  const accumule = useRef(0);

  // Une seule minuterie, active seulement quand ça tourne. La relancer (bascule
  // du son, changement de durée) est sans effet sur le temps : il est recalculé
  // depuis `depart`, pas incrémenté.
  useEffect(() => {
    if (!enMarche) return;
    const id = setInterval(() => {
      const debut = depart.current;
      if (debut === null) return;
      const total = accumule.current + (Date.now() - debut);
      if (mode === "minuteur" && total >= duree) {
        accumule.current = duree;
        depart.current = null;
        setEcoule(duree);
        setEnMarche(false);
        setFini(true);
        if (son) bip();
        return;
      }
      setEcoule(total);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [enMarche, mode, duree, son]);

  function demarrer() {
    if (enMarche) return;
    if (mode === "minuteur" && (duree <= 0 || accumule.current >= duree)) return;
    depart.current = Date.now();
    setFini(false);
    setEnMarche(true);
  }

  function pause() {
    if (!enMarche || depart.current === null) return;
    accumule.current += Date.now() - depart.current;
    depart.current = null;
    setEcoule(accumule.current);
    setEnMarche(false);
  }

  function remettreAZero() {
    accumule.current = 0;
    depart.current = null;
    setEcoule(0);
    setEnMarche(false);
    setFini(false);
    setTours([]);
  }

  function changerMode(nouveau: Mode) {
    if (nouveau === mode) return;
    remettreAZero();
    setMode(nouveau);
  }

  function reglerDuree(ms: number) {
    remettreAZero();
    setDuree(Math.max(1000, ms));
  }

  const restant = Math.max(0, duree - ecoule);
  const urgent = mode === "minuteur" && enMarche && restant <= 10_000;
  const affichage =
    mode === "chrono" ? formater(ecoule, true) : formater(restant, false);
  const progression = duree > 0 ? restant / duree : 0;

  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-6 py-3 text-lg font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-5 py-3 text-base font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl font-bold text-encre">
          ⏱️ Chrono &amp; minuteur
        </h1>
        <div
          role="group"
          aria-label="Mode"
          className="inline-flex items-center gap-1 rounded-full border border-ligne bg-surface p-1"
        >
          {(
            [
              { cle: "chrono", label: "Chronomètre" },
              { cle: "minuteur", label: "Minuteur" },
            ] as const
          ).map((m) => (
            <button
              key={m.cle}
              type="button"
              aria-pressed={mode === m.cle}
              onClick={() => changerMode(m.cle)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                mode === m.cle
                  ? "bg-principal text-sur-principal shadow-sm"
                  : "text-encre-douce hover:text-encre"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Réglage de la durée (minuteur seulement) */}
      {mode === "minuteur" && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-encre-douce">Durée</span>
          {PRESETS_MIN.map((min) => (
            <button
              key={min}
              type="button"
              aria-pressed={duree === min * 60_000}
              onClick={() => reglerDuree(min * 60_000)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                duree === min * 60_000
                  ? "bg-principal text-sur-principal shadow-sm"
                  : "bg-surface text-encre ring-1 ring-ligne hover:bg-fond"
              }`}
            >
              {min} min
            </button>
          ))}
          <label className="ml-2 flex items-center gap-2 text-sm text-encre-douce">
            min
            <input
              type="number"
              min={0}
              max={180}
              value={Math.floor(duree / 60_000)}
              onChange={(e) =>
                reglerDuree(Number(e.target.value) * 60_000 + (duree % 60_000))
              }
              className="w-16 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-center text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-encre-douce">
            s
            <input
              type="number"
              min={0}
              max={59}
              value={Math.floor(duree / 1000) % 60}
              onChange={(e) =>
                reglerDuree(
                  Math.floor(duree / 60_000) * 60_000 + Number(e.target.value) * 1000,
                )
              }
              className="w-16 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-center text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
          </label>
        </div>
      )}

      {/* Affichage */}
      <div className="mt-6 flex flex-col items-center gap-6">
        {/* Assez grand pour la projection, assez court pour que les boutons
            restent visibles sans faire défiler la page. */}
        <div className="relative flex w-full max-w-[18rem] items-center justify-center">
          {mode === "minuteur" && (
            <svg viewBox="0 0 100 100" className="w-full -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={RAYON}
                fill="none"
                strokeWidth="6"
                className="stroke-ligne"
              />
              <circle
                cx="50"
                cy="50"
                r={RAYON}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCONFERENCE}
                strokeDashoffset={CIRCONFERENCE * (1 - progression)}
                className={urgent ? "stroke-rose-500" : "stroke-principal"}
              />
            </svg>
          )}
          <p
            aria-live="off"
            className={`font-titre font-extrabold tabular-nums ${
              mode === "minuteur"
                ? "absolute text-5xl sm:text-6xl"
                : "text-6xl sm:text-7xl"
            } ${urgent || fini ? "text-rose-600 dark:text-rose-400" : "text-encre"}`}
          >
            {affichage}
          </p>
        </div>

        {fini && (
          <p
            aria-live="polite"
            className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-bold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200"
          >
            ⏰ Temps écoulé !
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {enMarche ? (
            <button type="button" onClick={pause} className={btnPrincipal}>
              ⏸ Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={demarrer}
              disabled={mode === "minuteur" && restant === 0}
              className={btnPrincipal}
            >
              ▶ {ecoule > 0 ? "Reprendre" : "Démarrer"}
            </button>
          )}
          {mode === "chrono" && (
            <button
              type="button"
              onClick={() => setTours((prev) => [...prev, ecoule])}
              disabled={!enMarche}
              className={btnFantome}
            >
              ⚑ Tour
            </button>
          )}
          <button
            type="button"
            onClick={remettreAZero}
            disabled={ecoule === 0 && tours.length === 0 && !fini}
            className={btnFantome}
          >
            ↺ Remettre à zéro
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input
            type="checkbox"
            checked={son}
            onChange={(e) => setSon(e.target.checked)}
            className="h-4 w-4 accent-principal"
          />
          Bip de fin (minuteur)
        </label>
      </div>

      {/* Tours du chronomètre */}
      {mode === "chrono" && tours.length > 0 && (
        <ol className="mx-auto mt-6 flex max-w-sm flex-col gap-1">
          {tours.map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-moyen bg-fond px-3 py-1.5 text-sm text-encre"
            >
              <span className="text-encre-douce">Tour {i + 1}</span>
              <span className="tabular-nums">{formater(t, true)}</span>
              <span className="tabular-nums text-encre-douce">
                +{formater(t - (tours[i - 1] ?? 0), true)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
