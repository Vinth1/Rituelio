"use client";

// Jeu jouable « Chaîne lexicale » (mode projection). Le prof choisit une classe,
// un thème (champ lexical, livré ou créé par lui) et un mode. Tour à tour, un
// élève tiré au hasard donne un mot du thème ; le prof le valide « Correct »
// (vert) ou « Hors thème » (rouge), et l'élève suivant est tiré automatiquement.
// Deux modes :
//  - Tour simple : chacun passe une fois ; à la fin, on compte les mots trouvés.
//  - Élimination : un mot hors thème élimine l'élève ; le dernier en lice gagne.
// Comparaison des doublons insensible à la casse et aux accents. État en mémoire,
// sauf les thèmes personnalisés (localStorage, cf. lib/champs-perso.ts).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type ChampLexical, champsLexicaux } from "@/data/champs-lexicaux";
import { chargerChampsPerso, enregistrerChampsPerso } from "@/lib/champs-perso";
import { type Classe, type Eleve, chargerClasses, nouvelId } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "purple"; // accent de couleur du rituel « lexique »
// Valeur réservée du menu « Thème » : ouvre le champ de création d'un thème perso.
const OPTION_NOUVEAU = "__perso";

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

// Tire le prochain élève à partir d'un état passé explicitement, et non du state
// React : `valider` enchaîne juste après un setState, où `elimines` serait encore
// périmé (l'élève qu'on vient d'éliminer pourrait être retiré au sort). Renvoie
// l'élève tiré, la liste des « déjà passés » à jour, et si la partie est finie.
function tirerSuivant(args: {
  eleves: Eleve[];
  elimines: string[];
  passes: string[];
  courantId: string | null;
  modeElimination: boolean;
}): { id: string | null; passes: string[]; fin: boolean } {
  const { eleves, elimines, passes, courantId, modeElimination } = args;
  if (modeElimination) {
    const enLice = eleves.filter((e) => !elimines.includes(e.id));
    if (enLice.length <= 1) return { id: null, passes, fin: true };
    const candidats = enLice.filter((e) => e.id !== courantId);
    const choix = piocherAuHasard(candidats.length ? candidats : enLice);
    return { id: choix.id, passes, fin: false };
  }
  const restants = eleves.filter((e) => !passes.includes(e.id));
  if (restants.length === 0) return { id: null, passes, fin: true };
  const choix = piocherAuHasard(restants);
  return { id: choix.id, passes: [...passes, choix.id], fin: false };
}

export default function ChaineLexicale() {
  // Réglages (écran de lancement)
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [themeId, setThemeId] = useState(champsLexicaux[0].id);
  const [champsPerso, setChampsPerso] = useState<ChampLexical[]>([]);
  const [nouveauTheme, setNouveauTheme] = useState("");
  const [modeElimination, setModeElimination] = useState(false);

  // Partie en cours
  const [phase, setPhase] = useState<Phase>("lancement");
  const [eleveCourantId, setEleveCourantId] = useState<string | null>(null);
  const [mots, setMots] = useState<MotChaine[]>([]);
  const [passes, setPasses] = useState<string[]>([]); // tour simple : élèves déjà désignés
  const [elimines, setElimines] = useState<string[]>([]); // élimination : élèves sortis
  const [saisie, setSaisie] = useState("");
  // Le champ de saisie garde le focus après chaque mot validé (confort au vidéoprojecteur).
  const champSaisie = useRef<HTMLInputElement>(null);

  // Chargement des classes depuis le localStorage (côté client uniquement) : initialisé
  // dans un effet pour éviter un décalage d'hydratation (faux positif de set-state-in-effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseActiveId(initiales[0]?.id ?? null);
    setChampsPerso(chargerChampsPerso());
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // --- Dérivés ---
  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  // Thèmes livrés + thèmes créés par le prof : une seule liste pour la sélection.
  const tousLesThemes = [...champsLexicaux, ...champsPerso];
  const theme = tousLesThemes.find((t) => t.id === themeId) ?? champsLexicaux[0];
  const themePersoChoisi = champsPerso.some((t) => t.id === themeId);
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
  // Ajoute un thème personnalisé, ou resélectionne l'existant si le libellé est
  // déjà proposé (casse et accents ignorés).
  function ajouterThemePerso() {
    const libelle = nouveauTheme.trim();
    if (!libelle) return;
    const existant = tousLesThemes.find(
      (t) => normaliser(t.theme) === normaliser(libelle),
    );
    if (existant) {
      setThemeId(existant.id);
      setNouveauTheme("");
      return;
    }
    // Préfixe « perso- » : jamais de collision avec les ids livrés (animaux…).
    const cree: ChampLexical = { id: `perso-${nouvelId()}`, theme: libelle };
    const liste = [...champsPerso, cree];
    setChampsPerso(liste);
    enregistrerChampsPerso(liste);
    setThemeId(cree.id);
    setNouveauTheme("");
  }

  function supprimerThemePerso() {
    const liste = champsPerso.filter((t) => t.id !== themeId);
    setChampsPerso(liste);
    enregistrerChampsPerso(liste);
    setThemeId(champsLexicaux[0].id);
  }

  function lancer() {
    if (eleves.length === 0 || themeId === OPTION_NOUVEAU) return;
    setMots([]);
    setElimines([]);
    setSaisie("");
    const premier = piocherAuHasard(eleves);
    setEleveCourantId(premier.id);
    setPasses([premier.id]);
    setPhase("jeu");
  }

  // Applique un tirage : élève désigné, « déjà passés », fin de partie éventuelle.
  function appliquerTirage(tirage: ReturnType<typeof tirerSuivant>) {
    setEleveCourantId(tirage.id);
    setPasses(tirage.passes);
    if (tirage.fin) setPhase("fin");
  }

  function eleveSuivant() {
    appliquerTirage(
      tirerSuivant({
        eleves,
        elimines,
        passes,
        courantId: eleveCourantId,
        modeElimination,
      }),
    );
  }

  function valider(statut: Statut) {
    const mot = saisie.trim();
    if (!mot || !eleveCourantId) return;
    const doublon = mots.some((m) => normaliser(m.mot) === normaliser(mot));
    setMots((prev) => [...prev, { mot, statut, eleveId: eleveCourantId, doublon }]);
    setSaisie("");
    // En mode élimination, un mot hors thème élimine l'élève courant.
    const nouveauxElimines =
      modeElimination && statut === "horsTheme"
        ? [...elimines, eleveCourantId]
        : elimines;
    if (nouveauxElimines !== elimines) setElimines(nouveauxElimines);
    // Le mot posé, on enchaîne : l'élève suivant est tiré au sort automatiquement.
    appliquerTirage(
      tirerSuivant({
        eleves,
        elimines: nouveauxElimines,
        passes,
        courantId: eleveCourantId,
        modeElimination,
      }),
    );
    champSaisie.current?.focus();
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
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  // ---------- Écran : lancement ----------
  if (phase === "lancement") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Chaîne lexicale
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Choisis une classe, un thème, puis lance la partie.
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
          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeActiveId ?? ""}
                onChange={(e) => setClasseActiveId(e.target.value)}
                className="max-w-sm rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
              Thème
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="max-w-sm rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                <optgroup label="Thèmes proposés">
                  {champsLexicaux.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.theme}
                    </option>
                  ))}
                </optgroup>
                {champsPerso.length > 0 && (
                  <optgroup label="Mes thèmes">
                    {champsPerso.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.theme}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value={OPTION_NOUVEAU}>✏️ Nouveau thème…</option>
              </select>
            </label>

            {themeId === OPTION_NOUVEAU && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ajouterThemePerso();
                }}
                className="flex max-w-sm flex-col gap-2 rounded-carte border border-ligne bg-fond p-4"
              >
                <label
                  htmlFor="nouveau-theme"
                  className="text-sm font-medium text-encre-douce"
                >
                  Mon thème
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    id="nouveau-theme"
                    type="text"
                    value={nouveauTheme}
                    onChange={(e) => setNouveauTheme(e.target.value)}
                    placeholder="Ex. : le portrait"
                    className="min-w-40 flex-1 rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  />
                  <button
                    type="submit"
                    disabled={!nouveauTheme.trim()}
                    className={btnPrincipal}
                  >
                    Ajouter
                  </button>
                </div>
                <p className="text-xs text-encre-douce">
                  Il sera gardé dans « Mes thèmes » pour les prochaines parties.
                </p>
              </form>
            )}

            {themePersoChoisi && (
              <button
                type="button"
                onClick={supprimerThemePerso}
                className={`${btnFantome} self-start`}
              >
                <span aria-hidden="true">🗑</span> Supprimer ce thème
              </button>
            )}

            <label className="inline-flex items-center gap-2 text-sm font-medium text-encre">
              <input
                type="checkbox"
                checked={modeElimination}
                onChange={(e) => setModeElimination(e.target.checked)}
                className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
              />
              Mode élimination
            </label>

            {eleves.length === 0 ? (
              <p className="rounded-carte border border-dashed border-ligne p-4 text-center text-sm text-encre-douce">
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
                disabled={themeId === OPTION_NOUVEAU}
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
      <div className="rounded-carte border border-ligne bg-surface p-8 text-center">
        {modeElimination ? (
          <>
            <p className="text-xl font-semibold text-encre-douce">
              Vainqueur
            </p>
            <p className="my-3 text-5xl font-extrabold text-principal">
              {vainqueur ? vainqueur.nom : "—"}
            </p>
            {vainqueur && (
              <p className="text-lg text-encre-douce">
                {motsCorrectsDe(vainqueur.id)} mot(s) correct(s) donné(s)
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-titre text-2xl font-bold text-encre">
              Tout le monde est passé
            </p>
            <p className="my-3 text-6xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {nbCorrects}
            </p>
            <p className="text-lg text-encre-douce">
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
    <div className="rounded-carte border border-ligne bg-surface p-6">
      {/* Thème */}
      <div className={`rounded-carte px-5 py-4 text-center ${couleurBande(ACCENT)}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          Thème
        </p>
        <p className="text-3xl font-extrabold sm:text-4xl">{theme.theme}</p>
      </div>

      {/* Au tour de + élève suivant */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-bold text-encre">
          Au tour de :{" "}
          {eleveCourant ? (
            <span className="text-principal">{eleveCourant.nom}</span>
          ) : (
            <span className="text-encre-douce">à toi de tirer</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {modeElimination && (
            <span className="rounded-full bg-fond px-3 py-1 text-sm font-semibold text-encre-douce">
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
          ref={champSaisie}
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          disabled={!eleveCourant}
          placeholder="Mot proposé par l'élève"
          aria-label="Mot proposé par l'élève"
          className="min-w-48 flex-1 rounded-full border border-ligne bg-surface px-4 py-2.5 text-lg text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
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
        <span className="text-sm font-semibold text-encre-douce">
          La chaîne
        </span>
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          Mots corrects : {nbCorrects}
        </span>
      </div>
      {mots.length === 0 ? (
        <p className="mt-2 rounded-carte border border-dashed border-ligne p-4 text-center text-sm text-encre-douce">
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
