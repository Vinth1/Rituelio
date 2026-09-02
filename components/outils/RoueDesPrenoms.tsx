"use client";

// Outil « Roue des prénoms » : une vraie roue SVG (un secteur par élève) qui
// tourne et s'arrête sur un élève tiré au sort. Pensée vidéoprojecteur.
// Le gagnant est choisi AVANT l'animation, puis on calcule l'angle qui amène son
// secteur sous le repère : la roue ne « triche » donc jamais à l'arrivée.
// Accessibilité : la rotation est une transition CSS, que le bloc
// prefers-reduced-motion de globals.css réduit déjà à un tirage instantané ;
// le résultat est annoncé dans une zone aria-live.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type Classe, chargerClasses } from "@/lib/classes";
import { teinteRoue } from "@/lib/couleurs";

const TOURS = 4; // tours complets avant l'arrêt
const DUREE_MS = 4000; // durée de la rotation (doit suivre la transition CSS)
const CENTRE = 100;
const RAYON = 95;

// Point du cercle à l'angle `deg`, compté depuis le haut, dans le sens horaire.
function point(deg: number, rayon: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: CENTRE + rayon * Math.cos(rad),
    y: CENTRE + rayon * Math.sin(rad),
  };
}

// Chemin SVG de la part de camembert n° `i` d'une roue de `n` parts.
function secteur(i: number, n: number): string {
  const a0 = (i * 360) / n;
  const a1 = ((i + 1) * 360) / n;
  const p0 = point(a0, RAYON);
  const p1 = point(a1, RAYON);
  const grandArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${CENTRE} ${CENTRE} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${RAYON} ${RAYON} 0 ${grandArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

// Le texte rétrécit quand les parts se resserrent.
function tailleTexte(n: number): number {
  if (n <= 10) return 8;
  if (n <= 18) return 6;
  if (n <= 28) return 4.6;
  return 3.8;
}

// Index tiré au hasard dans [0, longueur[. Hors du composant, comme dans les
// autres jeux : le compilateur React refuse un appel direct à Math.random dans
// le corps d'un composant.
function indexAleatoire(longueur: number): number {
  return Math.floor(Math.random() * longueur);
}

// Les noms longs sont coupés : un secteur ne peut pas tout afficher.
function abreger(nom: string): string {
  return nom.length > 14 ? `${nom.slice(0, 13)}…` : nom;
}

export default function RoueDesPrenoms() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  // Élèves déjà sortis de la roue (mode « sans remise »).
  const [tires, setTires] = useState<string[]>([]);
  const [gagnantId, setGagnantId] = useState<string | null>(null);
  const [sansRemise, setSansRemise] = useState(false);
  const [angle, setAngle] = useState(0); // cumulatif : la roue avance toujours
  const [enRotation, setEnRotation] = useState(false);
  // Gagnant choisi au lancer, révélé seulement à l'arrêt de la roue.
  const gagnantEnAttente = useRef<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Classes : le backend fait foi ; le miroir localStorage sert de repli pour
  // rester utilisable si l'API ne répond pas.
  useEffect(() => {
    let actif = true;
    (async () => {
      let liste: Classe[] = [];
      try {
        const r = await fetch("/api/classes");
        if (r.ok) {
          const data = (await r.json()) as { classes: Classe[] };
          liste = data.classes;
        }
      } catch {
        /* repli ci-dessous */
      }
      if (liste.length === 0) liste = chargerClasses();
      if (!actif) return;
      setClasses(liste);
      setClasseActiveId(liste[0]?.id ?? null);
      setCharge(true);
    })();
    return () => {
      actif = false;
    };
  }, []);

  // Coupe la minuterie de secours si l'outil est quitté pendant une rotation.
  useEffect(() => {
    return () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, []);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const surLaRoue = eleves.filter((el) => !tires.includes(el.id));
  const gagnant = eleves.find((el) => el.id === gagnantId) ?? null;
  const n = surLaRoue.length;

  function reinitialiser() {
    setTires([]);
    setGagnantId(null);
    gagnantEnAttente.current = null;
  }

  function changerClasse(id: string) {
    setClasseActiveId(id);
    reinitialiser();
  }

  // Révèle le gagnant : appelé à la fin de la transition, avec une minuterie de
  // secours si l'événement n'arrive pas.
  function terminerRotation() {
    if (gagnantEnAttente.current === null) return;
    if (minuterie.current) {
      clearTimeout(minuterie.current);
      minuterie.current = null;
    }
    setGagnantId(gagnantEnAttente.current);
    gagnantEnAttente.current = null;
    setEnRotation(false);
  }

  function tourner() {
    if (enRotation) return;
    // Sans remise : le gagnant précédent quitte la roue au lancer suivant
    // (il reste affiché entre-temps, la roue ne saute pas à l'arrivée).
    let liste = surLaRoue;
    if (sansRemise && gagnantId) {
      const sortant = gagnantId;
      liste = liste.filter((el) => el.id !== sortant);
      setTires((prev) => [...prev, sortant]);
    }
    if (liste.length === 0) return;

    const i = indexAleatoire(liste.length);
    // Milieu du secteur gagnant, puis angle qui l'amène sous le repère (0°).
    const milieu = (i * 360) / liste.length + 180 / liste.length;
    const ecart = (((-milieu - angle) % 360) + 360) % 360;

    gagnantEnAttente.current = liste[i].id;
    setGagnantId(null);
    setEnRotation(true);
    setAngle(angle + TOURS * 360 + ecart);
    minuterie.current = setTimeout(terminerRotation, DUREE_MS + 400);
  }

  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  if (!charge) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-6 text-sm text-encre-douce">
        Chargement des classes…
      </p>
    );
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl font-bold text-encre">
          🎡 Roue des prénoms
        </h1>
        {classes.length > 0 && (
          <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
            Classe
            <select
              value={classeActiveId ?? ""}
              onChange={(e) => changerClasse(e.target.value)}
              className="rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom || "Sans nom"} ({c.eleves.length})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {classes.length === 0 || eleves.length === 0 ? (
        <p className="mt-6 rounded-carte border border-dashed border-ligne p-8 text-center text-sm text-encre-douce">
          {classes.length === 0
            ? "Aucune classe pour l’instant."
            : "Cette classe n’a pas encore d’élèves."}{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal-fonce underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Gérer mes classes
          </Link>
        </p>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          {/* La roue */}
          <div className="w-full max-w-[26rem] shrink-0">
            {n === 0 ? (
              <div className="flex aspect-square items-center justify-center rounded-full border-2 border-dashed border-ligne p-8 text-center text-sm text-encre-douce">
                Tout le monde est passé.
              </div>
            ) : (
              <svg
                viewBox="0 0 200 200"
                role="img"
                aria-label={`Roue de ${n} prénom${n > 1 ? "s" : ""}`}
                className="w-full"
              >
                <g
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: "100px 100px",
                    transition: `transform ${DUREE_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`,
                  }}
                  onTransitionEnd={terminerRotation}
                >
                  {n === 1 ? (
                    <circle cx={CENTRE} cy={CENTRE} r={RAYON} fill={teinteRoue(0, 1)} />
                  ) : (
                    surLaRoue.map((el, i) => (
                      <path
                        key={el.id}
                        d={secteur(i, n)}
                        fill={teinteRoue(i, n)}
                        stroke="#ffffff"
                        strokeWidth="0.6"
                      />
                    ))
                  )}
                  {surLaRoue.map((el, i) => (
                    <text
                      key={`t-${el.id}`}
                      transform={`rotate(${(i * 360) / n + 180 / n - 90} 100 100)`}
                      x={CENTRE + RAYON * 0.58}
                      y={CENTRE}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={tailleTexte(n)}
                      fontWeight="700"
                      fill="#ffffff"
                      stroke="#00000066"
                      strokeWidth="0.9"
                      style={{ paintOrder: "stroke" }}
                    >
                      {abreger(el.nom)}
                    </text>
                  ))}
                </g>
                {/* Moyeu fixe */}
                <circle cx={CENTRE} cy={CENTRE} r="14" fill="#ffffff" stroke="#00000022" />
                {/* Repère : c’est le prénom sous cette pointe qui gagne */}
                <path d="M 100 20 L 92 4 L 108 4 Z" fill="#26314f" />
              </svg>
            )}
          </div>

          {/* Commandes + résultat */}
          <div className="flex w-full flex-col items-center gap-4 lg:max-w-xs lg:items-start">
            <div
              aria-live="polite"
              className="min-h-[4.5rem] w-full rounded-carte bg-fond px-4 py-3 text-center lg:text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-encre-douce">
                {enRotation ? "La roue tourne…" : "Élève désigné"}
              </p>
              <p className="font-titre text-3xl font-extrabold text-encre">
                {enRotation ? "…" : (gagnant?.nom ?? "—")}
              </p>
            </div>

            <button
              type="button"
              onClick={tourner}
              disabled={enRotation || n === 0}
              className={btnPrincipal}
            >
              <span aria-hidden="true">🎡</span> Tourner
            </button>

            <label className="flex items-center gap-2 text-sm text-encre-douce">
              <input
                type="checkbox"
                checked={sansRemise}
                onChange={(e) => setSansRemise(e.target.checked)}
                className="h-4 w-4 accent-principal"
              />
              Sans remise (chacun passe une fois)
            </label>

            <p className="text-sm text-encre-douce">
              {n} élève{n > 1 ? "s" : ""} sur la roue
              {tires.length > 0 &&
                ` · ${tires.length} déjà passé${tires.length > 1 ? "s" : ""}`}
            </p>

            <button
              type="button"
              onClick={reinitialiser}
              disabled={enRotation || (tires.length === 0 && !gagnantId)}
              className={btnFantome}
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
