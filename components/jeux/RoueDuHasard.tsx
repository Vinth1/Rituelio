"use client";

// Jeu « Roue du hasard » : désigne un élève au sort dans une classe.
// Le prof choisit une classe (gérée dans « Mes classes »), la roue affiche un
// secteur coloré par élève et s'arrête sur l'un d'eux après une animation.
// Option « ne pas répéter » pour ne désigner chaque élève qu'une fois.
// Pensé pour le vidéoprojecteur : grands caractères, fort contraste.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type Classe, type Eleve, chargerClasses } from "@/lib/classes";
import Roue, { DUREE_ROUE_MS, rotationVers } from "./Roue";

export default function RoueDuHasard() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [nePasRepeter, setNePasRepeter] = useState(false);
  const [dejaPasses, setDejaPasses] = useState<string[]>([]);
  // Instantané des élèves affichés sur la roue. Figé entre deux lancers : on ne
  // le met à jour qu'au (re)lancer (et aux changements de classe / option), pas
  // en fin d'animation — sinon retirer le gagnant ferait pivoter les secteurs.
  const [roueEleves, setRoueEleves] = useState<Eleve[]>([]);
  const [rotation, setRotation] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [gagnant, setGagnant] = useState<string | null>(null);
  const minuterieRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement des classes (localStorage, côté client) : initialisé dans un effet
  // pour éviter un décalage d'hydratation — faux positif de set-state-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    const premiere = initiales[0] ?? null;
    setClasseId(premiere?.id ?? null);
    setRoueEleves(premiere?.eleves ?? []);
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Nettoie la minuterie d'animation au démontage.
  useEffect(() => {
    return () => {
      if (minuterieRef.current) clearTimeout(minuterieRef.current);
    };
  }, []);

  const classe = useMemo(
    () => classes.find((c) => c.id === classeId) ?? null,
    [classes, classeId],
  );
  const eleves = useMemo(() => classe?.eleves ?? [], [classe]);
  const restants = useMemo(
    () =>
      nePasRepeter ? eleves.filter((e) => !dejaPasses.includes(e.id)) : eleves,
    [eleves, nePasRepeter, dejaPasses],
  );

  const n = restants.length;

  function changerClasse(id: string) {
    if (minuterieRef.current) clearTimeout(minuterieRef.current);
    setClasseId(id);
    setDejaPasses([]);
    setGagnant(null);
    setEnCours(false);
    const nouvelle = classes.find((c) => c.id === id) ?? null;
    setRoueEleves(nouvelle?.eleves ?? []);
  }

  function recommencer() {
    setDejaPasses([]);
    setGagnant(null);
    setRoueEleves(eleves);
  }

  function basculerNePasRepeter(actif: boolean) {
    setNePasRepeter(actif);
    setGagnant(null);
    setRoueEleves(actif ? eleves.filter((e) => !dejaPasses.includes(e.id)) : eleves);
  }

  function lancer() {
    // Pool des élèves éligibles à ce lancer (exclut les déjà désignés si l'option
    // est active). On fige la roue sur ce pool : secteurs, prénoms et angle visé
    // partagent ainsi la même géométrie, donc l'aiguille pointe bien le gagnant.
    const pool = nePasRepeter
      ? eleves.filter((e) => !dejaPasses.includes(e.id))
      : eleves;
    if (enCours || pool.length === 0) return;
    setRoueEleves(pool);
    const g = Math.floor(Math.random() * pool.length);
    const elu = pool[g];

    setGagnant(null);
    setEnCours(true);
    setRotation(rotationVers(rotation, g, pool.length));
    if (minuterieRef.current) clearTimeout(minuterieRef.current);
    minuterieRef.current = setTimeout(() => {
      setGagnant(elu.nom);
      if (nePasRepeter) setDejaPasses((prev) => [...prev, elu.id]);
      setEnCours(false);
    }, DUREE_ROUE_MS);
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <h2 className="font-titre text-2xl font-bold text-encre">
        🎡 Roue du hasard
      </h2>
      <p className="mt-1 text-sm text-encre-douce">
        Choisis une classe, lance la roue : elle désigne un élève au hasard.
      </p>

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
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          {/* Réglages */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeId ?? ""}
                onChange={(e) => changerClasse(e.target.value)}
                className="rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-encre">
              <input
                type="checkbox"
                checked={nePasRepeter}
                onChange={(e) => basculerNePasRepeter(e.target.checked)}
                className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
              />
              Ne pas répéter
            </label>
          </div>

          {eleves.length === 0 ? (
            <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
              Cette classe n’a pas encore d’élèves. Ajoute-les depuis « Mes
              classes ».
            </p>
          ) : (
            <div className="flex flex-col items-center gap-5">
              {/* Roue + aiguille */}
              <Roue eleves={roueEleves} rotation={rotation} />

              {/* Résultat */}
              <div className="min-h-[3.5rem] text-center" aria-live="polite">
                {gagnant ? (
                  <p className="font-titre text-3xl font-extrabold text-principal sm:text-4xl">
                    🎉 {gagnant}
                  </p>
                ) : (
                  <p className="text-sm text-encre-douce">
                    {enCours
                      ? "La roue tourne…"
                      : "Clique sur « Lancer la roue »."}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={lancer}
                  disabled={enCours || n === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-principal px-7 py-3 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🎡 {enCours ? "…" : "Lancer la roue"}
                </button>
                {nePasRepeter && dejaPasses.length > 0 && (
                  <button
                    type="button"
                    onClick={recommencer}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    ↺ Recommencer
                  </button>
                )}
              </div>

              {nePasRepeter && n === 0 && (
                <p className="rounded-carte border border-dashed border-ligne p-4 text-center text-sm text-encre-douce">
                  Tous les élèves sont passés ! Clique sur « Recommencer ».
                </p>
              )}
              {nePasRepeter && dejaPasses.length > 0 && (
                <p className="text-center text-xs text-encre-douce">
                  Déjà désignés : {dejaPasses.length} / {eleves.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
