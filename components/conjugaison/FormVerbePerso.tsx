"use client";

// Création d'un verbe personnalisé. Le prof saisit un infinitif, le moteur
// propose les formes, et il ne corrige que ce qui lui semble faux — c'est le
// point important : il n'a pas 48 cases à remplir, seulement à relire.
//
// Seules les cases corrigées partent au serveur ; les autres sont régénérées à
// chaque lecture, si bien qu'un verbe perso profite des corrections futures du
// moteur.
import { useMemo, useState } from "react";
import { conjuguer, type EntreeVerbe } from "@/data/verbes";
import {
  TEMPS_COLLEGE,
  cleTempsMode,
  groupeDevine,
  libelleTempsMode,
  type Auxiliaire,
  type Formes6,
  type Groupe,
} from "@/lib/conjugueur";

// Même restriction que le jeu : l'impératif attend un tableau à 3 lignes.
const TEMPS_EDITABLES = TEMPS_COLLEGE.filter((t) => t.mode !== "impératif");

const PRONOMS = ["je", "tu", "il/elle/on", "nous", "vous", "ils/elles"];
const GROUPES: Groupe[] = ["1er groupe", "2e groupe", "3e groupe"];

const VIDE: Formes6 = ["", "", "", "", "", ""];

export type VerbePerso = {
  id: string;
  infinitif: string;
  groupe: Groupe;
  auxiliaire: Auxiliaire;
  formesCorrigees: Record<string, Formes6>;
};

export default function FormVerbePerso({
  infinitifPropose,
  onEnregistre,
  onAnnuler,
}: {
  infinitifPropose: string;
  onEnregistre: (v: VerbePerso) => void;
  onAnnuler: () => void;
}) {
  const [infinitif, setInfinitif] = useState(infinitifPropose);
  const [groupe, setGroupe] = useState<Groupe>(groupeDevine(infinitifPropose));
  const [auxiliaire, setAuxiliaire] = useState<Auxiliaire>("avoir");
  const [corrigees, setCorrigees] = useState<Record<string, Formes6>>({});
  const [cleTemps, setCleTemps] = useState(cleTempsMode(TEMPS_EDITABLES[0]));
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const tempsCourant =
    TEMPS_EDITABLES.find((t) => cleTempsMode(t) === cleTemps) ??
    TEMPS_EDITABLES[0];

  // L'aperçu tient compte des corrections déjà saisies : le prof voit ce que
  // verra la classe.
  const apercu: EntreeVerbe = useMemo(
    () => ({
      infinitif: infinitif.trim().toLowerCase(),
      groupe,
      auxiliaire,
      formesCorrigees: corrigees,
    }),
    [infinitif, groupe, auxiliaire, corrigees],
  );

  const formes: Formes6 = useMemo(() => {
    const c = conjuguer(apercu, tempsCourant.temps, tempsCourant.mode);
    return c ? (c.formes as Formes6) : VIDE;
  }, [apercu, tempsCourant]);

  // Un 3e groupe inconnu du moteur ne produit rien : le prof saisit tout.
  const moteurMuet = useMemo(
    () => conjuguer({ infinitif: apercu.infinitif, groupe, auxiliaire }, tempsCourant.temps, tempsCourant.mode) === null,
    [apercu.infinitif, groupe, auxiliaire, tempsCourant],
  );

  function majForme(i: number, valeur: string) {
    setCorrigees((prev) => {
      const actuelles = prev[cleTemps] ?? formes;
      const suivantes = [...actuelles] as Formes6;
      suivantes[i] = valeur;
      return { ...prev, [cleTemps]: suivantes };
    });
  }

  function reinitialiserTemps() {
    setCorrigees((prev) => {
      const suivant = { ...prev };
      delete suivant[cleTemps];
      return suivant;
    });
  }

  async function enregistrer() {
    setErreur(null);
    setEnCours(true);
    try {
      const r = await fetch("/api/verbes-perso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          infinitif: infinitif.trim().toLowerCase(),
          groupe,
          auxiliaire,
          formesCorrigees: corrigees,
        }),
      });
      const data = (await r.json()) as { verbe?: VerbePerso; erreur?: string };
      if (!r.ok || !data.verbe) {
        setErreur(data.erreur ?? "Enregistrement impossible.");
        return;
      }
      onEnregistre(data.verbe);
    } catch {
      setErreur("Le serveur n'a pas répondu.");
    } finally {
      setEnCours(false);
    }
  }

  const champ =
    "rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Nouveau verbe
        </h2>
        <button type="button" onClick={onAnnuler} className={btnFantome}>
          <span aria-hidden="true">←</span> Annuler
        </button>
      </div>

      <p className="mt-2 text-sm text-encre-douce">
        Les formes sont proposées automatiquement. Relis-les et corrige
        seulement ce qui ne va pas : le reste suivra les mises à jour du site.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Infinitif
          <input
            type="text"
            value={infinitif}
            onChange={(e) => {
              setInfinitif(e.target.value);
              setGroupe(groupeDevine(e.target.value));
              // Les corrections portaient sur l'ancien verbe : elles n'ont plus
              // de sens et seraient enregistrées à tort.
              setCorrigees({});
            }}
            className={`w-full ${champ}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Groupe
          <select
            value={groupe}
            onChange={(e) => setGroupe(e.target.value as Groupe)}
            className={`w-full ${champ}`}
          >
            {GROUPES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Auxiliaire
          <select
            value={auxiliaire}
            onChange={(e) => setAuxiliaire(e.target.value as Auxiliaire)}
            className={`w-full ${champ}`}
          >
            <option value="avoir">avoir (j&apos;ai …)</option>
            <option value="être">être (je suis …)</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-carte border border-ligne p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
            Temps
            <select
              value={cleTemps}
              onChange={(e) => setCleTemps(e.target.value)}
              className={champ}
            >
              {TEMPS_EDITABLES.map((t) => (
                <option key={cleTempsMode(t)} value={cleTempsMode(t)}>
                  {libelleTempsMode(t)}
                  {corrigees[cleTempsMode(t)] ? " ✎" : ""}
                </option>
              ))}
            </select>
          </label>
          {corrigees[cleTemps] && (
            <button
              type="button"
              onClick={reinitialiserTemps}
              className={btnFantome}
            >
              Reprendre les formes proposées
            </button>
          )}
        </div>

        {moteurMuet && (
          <p className="mt-3 rounded-moyen bg-fond p-3 text-sm text-encre-douce">
            Ce verbe est trop irrégulier pour être deviné : saisis les six
            formes à la main, pour chaque temps que tu comptes utiliser.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {PRONOMS.map((pronom, i) => (
            <div key={pronom} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm text-encre-douce">
                {pronom}
              </span>
              <input
                type="text"
                value={formes[i]}
                onChange={(e) => majForme(i, e.target.value)}
                aria-label={`${libelleTempsMode(tempsCourant)}, ${pronom}`}
                className={`min-w-0 flex-1 ${champ}`}
              />
            </div>
          ))}
        </div>
      </div>

      {erreur && (
        <p className="mt-4 rounded-moyen bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {erreur}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || infinitif.trim().length < 2}
          className={btnPrincipal}
        >
          {enCours ? "Enregistrement…" : "Enregistrer le verbe"}
        </button>
        <span className="text-sm text-encre-douce">
          {Object.keys(corrigees).length > 0
            ? `${Object.keys(corrigees).length} temps corrigé(s) à la main`
            : "Aucune correction — tout vient du moteur"}
        </span>
      </div>
    </div>
  );
}
