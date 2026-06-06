"use client";

// Jeu jouable « Chaîne lexicale » (mode projection). Le prof choisit une classe,
// un thème (champ lexical) et un mode. Tour à tour, un élève tiré au hasard donne
// un mot du thème ; le prof le valide « Correct » (vert) ou « Hors thème » (rouge).
// Deux modes :
//  - Tour simple : chacun passe une fois ; à la fin, on compte les mots trouvés.
//  - Élimination : un mot hors thème élimine l'élève ; le dernier en lice gagne.
// Comparaison des doublons insensible à la casse et aux accents. État en mémoire.
import { useEffect, useState } from "react";
import Link from "next/link";
import { champsLexicaux } from "@/data/champs-lexicaux";
import { type Classe, chargerClasses } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "purple"; // accent de couleur du rituel « lexique »

type Phase = "lancement" | "jeu" | "fin";
type Statut = "correct" | "horsTheme";
type MotChaine = { mot: string; statut: Statut; eleveId: string; doublon: boolean };

// Retire les accents et met en majuscule, pour repérer les doublons (« Été » et
// « ete » comptent comme le même mot).
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

function piocherAuHasard<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)];
}

export default function ChaineLexicale() {
  // Réglages (écran de lancement)
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [themeId, setThemeId] = useState(champsLexicaux[0].id);
  const [modeElimination, setModeElimination] = useState(false);

  // Partie en cours
  const [phase, setPhase] = useState<Phase>("lancement");
  const [eleveCourantId, setEleveCourantId] = useState<string | null>(null);
  const [mots, setMots] = useState<MotChaine[]>([]);
  const [passes, setPasses] = useState<string[]>([]); // tour simple : élèves déjà désignés
  const [elimines, setElimines] = useState<string[]>([]); // élimination : élèves sortis
  const [saisie, setSaisie] = useState("");

  // Chargement des classes depuis le localStorage (côté client uniquement).
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseActiveId(initiales[0]?.id ?? null);
    setCharge(true);
  }, []);

  // --- Dérivés ---
  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const theme = champsLexicaux.find((t) => t.id === themeId) ?? champsLexicaux[0];
  const eleveCourant = eleves.find((e) => e.id === eleveCourantId) ?? null;
  const enLice = eleves.filter((e) => !elimines.includes(e.id));
  const nbCorrects = mots.filter((m) => m.statut === "correct").length;
  const saisieDoublon =
    saisie.trim() !== "" &&
    mots.some((m) => normaliser(m.mot) === normaliser(saisie));

  function motsCorrectsDe(eleveId: string): number {
    return mots.filter((m) => m.eleveId === eleveId && m.statut === "correct")
      .length;
  }

  // --- Actions ---
  function lancer() {
    if (eleves.length === 0) return;
    setMots([]);
    setElimines([]);
    setSaisie("");
    const premier = piocherAuHasard(eleves);
    setEleveCourantId(premier.id);
    setPasses([premier.id]);
    setPhase("jeu");
  }

  function eleveSuivant() {
    if (modeElimination) {
      if (enLice.length <= 1) {
        setPhase("fin");
        return;
      }
      const candidats = enLice.filter((e) => e.id !== eleveCourantId);
      setEleveCourantId(piocherAuHasard(candidats.length ? candidats : enLice).id);
    } else {
      const restants = eleves.filter((e) => !passes.includes(e.id));
      if (restants.length === 0) {
        setPhase("fin");
        return;
      }
      const choix = piocherAuHasard(restants);
      setEleveCourantId(choix.id);
      setPasses((p) => [...p, choix.id]);
    }
  }

  function valider(statut: Statut) {
    const mot = saisie.trim();
    if (!mot || !eleveCourantId) return;
    const doublon = mots.some((m) => normaliser(m.mot) === normaliser(mot));
    setMots((prev) => [...prev, { mot, statut, eleveId: eleveCourantId, doublon }]);
    setSaisie("");
    // En mode élimination, un mot hors thème élimine l'élève courant.
    if (modeElimination && statut === "horsTheme") {
      const nouveauxElimines = [...elimines, eleveCourantId];
      setElimines(nouveauxElimines);
      setEleveCourantId(null);
      const restants = eleves.filter((e) => !nouveauxElimines.includes(e.id));
      if (restants.length <= 1) setPhase("fin");
    }
  }

  function reinitialiser() {
    setMots([]);
    setElimines([]);
    setSaisie("");
    if (eleves.length > 0) {
      const premier = piocherAuHasard(eleves);
      setEleveCourantId(premier.id);
      setPasses([premier.id]);
    } else {
      setEleveCourantId(null);
      setPasses([]);
    }
    setPhase("jeu");
  }

  // Styles de boutons partagés.
  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700";

  // ---------- Écran : lancement ----------
  if (phase === "lancement") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Chaîne lexicale
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choisis une classe, un thème, puis lance la partie.
        </p>

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
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Classe
              <select
                value={classeActiveId ?? ""}
                onChange={(e) => setClasseActiveId(e.target.value)}
                className="max-w-sm rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Thème
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="max-w-sm rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {champsLexicaux.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.theme}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={modeElimination}
                onChange={(e) => setModeElimination(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-principal focus:ring-principal"
              />
              Mode élimination
            </label>

            {eleves.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Cette classe ne contient encore aucun élève. Ajoute des élèves
                depuis la page{" "}
                <Link
                  href="/classe"
                  className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  « Mes classes »
                </Link>
                .
              </p>
            ) : (
              <button
                type="button"
                onClick={lancer}
                className={`${btnPrincipal} self-start`}
              >
                Lancer la partie
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran : fin ----------
  if (phase === "fin") {
    const vainqueur =
      enLice.length > 0
        ? enLice.reduce((meilleur, e) =>
            motsCorrectsDe(e.id) > motsCorrectsDe(meilleur.id) ? e : meilleur,
          )
        : null;
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        {modeElimination ? (
          <>
            <p className="text-xl font-semibold text-slate-500 dark:text-slate-400">
              Vainqueur
            </p>
            <p className="my-3 text-5xl font-extrabold text-principal">
              {vainqueur ? vainqueur.nom : "—"}
            </p>
            {vainqueur && (
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {motsCorrectsDe(vainqueur.id)} mot(s) correct(s) donné(s)
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Tout le monde est passé
            </p>
            <p className="my-3 text-6xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {nbCorrects}
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              mots du champ lexical trouvés
            </p>
          </>
        )}
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={() => setPhase("lancement")} className={btnPrincipal}>
            Nouvelle partie
          </button>
        </div>
      </div>
    );
  }

  // ---------- Écran : jeu ----------
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      {/* Thème */}
      <div className={`rounded-2xl px-5 py-4 text-center ${couleurBande(ACCENT)}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Thème
        </p>
        <p className="text-3xl font-extrabold sm:text-4xl">{theme.theme}</p>
      </div>

      {/* Au tour de + élève suivant */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Au tour de :{" "}
          {eleveCourant ? (
            <span className="text-principal">{eleveCourant.nom}</span>
          ) : (
            <span className="text-slate-400">à toi de tirer</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {modeElimination && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              En lice : {enLice.length}
            </span>
          )}
          <button type="button" onClick={eleveSuivant} className={btnPrincipal}>
            <span aria-hidden="true">🎲</span> Élève suivant
          </button>
        </div>
      </div>

      {/* Saisie + validation */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          valider("correct");
        }}
        className="mt-4 flex flex-wrap gap-2"
      >
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          disabled={!eleveCourant}
          placeholder="Mot proposé par l'élève"
          aria-label="Mot proposé par l'élève"
          className="min-w-48 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={!eleveCourant || !saisie.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">✓</span> Correct
        </button>
        <button
          type="button"
          onClick={() => valider("horsTheme")}
          disabled={!eleveCourant || !saisie.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-base font-bold text-white shadow-sm transition hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">✗</span> Hors thème
        </button>
      </form>
      {saisieDoublon && (
        <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
          <span aria-hidden="true">⚠</span> « {saisie.trim()} » a déjà été proposé.
        </p>
      )}

      {/* La chaîne + compteur */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          La chaîne
        </span>
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          Mots corrects : {nbCorrects}
        </span>
      </div>
      {mots.length === 0 ? (
        <p className="mt-2 rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucun mot pour le moment.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {mots.map((m, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xl font-semibold ${
                m.statut === "correct"
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-700"
                  : "bg-rose-100 text-rose-800 ring-1 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-700"
              } ${m.doublon ? "ring-2 ring-amber-400" : ""}`}
            >
              {m.mot}
              {m.doublon && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  déjà dit
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <button type="button" onClick={reinitialiser} className={btnFantome}>
          Réinitialiser
        </button>
        <button type="button" onClick={() => setPhase("fin")} className={btnFantome}>
          Terminer la partie
        </button>
      </div>
    </div>
  );
}
