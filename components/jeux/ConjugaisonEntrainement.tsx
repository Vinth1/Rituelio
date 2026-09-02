"use client";

// Jeu jouable « Conjugaison — entraînement » (au tableau, mode projection).
// Le prof choisit 2 verbes (verbe + temps + mode), une classe, une date et les
// contraintes de phrase, puis projette 2 tableaux où la classe complète pronom +
// forme des 6 personnes, avec vérification ligne par ligne. La section
// « Ma phrase » fait produire une phrase utilisant les 2 verbes sous contraintes.
// La séance terminée est enregistrée dans un historique par classe (localStorage).
// Pour désigner un élève au hasard : l'outil « Roue des prénoms » (/prof/outils/roue).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  conjuguer,
  trouverEntree,
  verbes,
  type Conjugaison,
  type EntreeVerbe,
} from "@/data/verbes";
import { TEMPS_COLLEGE, cleTempsMode, libelleTempsMode } from "@/lib/conjugueur";
import { contraintesPhrase } from "@/data/contraintes-phrase";
import { type Classe, chargerClasses, nouvelId } from "@/lib/classes";
import {
  type SeanceConj,
  ajouterSeance,
  seancesDeClasse,
} from "@/lib/historique-conjugaison";
import { ligneCorrecte } from "@/lib/conjugaison";
import SelecteurVerbe from "@/components/conjugaison/SelecteurVerbe";
import FormVerbePerso, {
  type VerbePerso,
} from "@/components/conjugaison/FormVerbePerso";
import SuiviEvaluation from "@/components/evaluation/SuiviEvaluation";

type Phase = "menu" | "jeu" | "historique" | "suiviEval" | "nouveauVerbe";
type ModeJeu = "entrainement" | "evaluation";
type Ligne = { pronom: string; forme: string; valide: boolean | null };
type Partie = { entree: EntreeVerbe; conj: Conjugaison };
type Contrainte = { label: string; validee: boolean };
// Ce que le prof choisit pour un tableau : un verbe et un temps, indépendants
// l'un de l'autre — tous les verbes ont désormais les mêmes temps.
type Choix = { infinitif: string; temps: string; mode: string };

// L'impératif n'a que 3 personnes et pas de pronom : il ne rentre pas dans le
// tableau à 6 lignes du jeu. Le moteur sait le produire, l'écran viendra plus tard.
const TEMPS_JEU = TEMPS_COLLEGE.filter((t) => t.mode !== "impératif");

// Résout un choix en une partie jouable, ou null si le verbe est introuvable
// ou si le moteur ne sait pas produire ce temps. `connus` contient la banque
// ET les verbes personnalisés du prof.
function resoudre(c: Choix, connus: EntreeVerbe[]): Partie | null {
  const entree =
    connus.find((v) => v.infinitif === c.infinitif) ?? trouverEntree(c.infinitif);
  if (!entree) return null;
  const conj = conjuguer(entree, c.temps, c.mode);
  return conj ? { entree, conj } : null;
}

function lignesVides(): Ligne[] {
  return Array.from({ length: 6 }, () => ({
    pronom: "",
    forme: "",
    valide: null,
  }));
}

// Un tableau de conjugaison (6 lignes à compléter).
function TableauVerbe({
  partie,
  lignes,
  onChange,
  onVerifier,
}: {
  partie: Partie;
  lignes: Ligne[];
  onChange: (i: number, champ: "pronom" | "forme", val: string) => void;
  onVerifier: (i: number) => void;
}) {
  return (
    <div className="rounded-carte border border-ligne p-4">
      <div className="mb-3 text-center">
        <p className="text-xl font-bold text-encre">
          {partie.entree.infinitif}
        </p>
        <p className="text-sm text-encre-douce">
          {partie.conj.temps} · {partie.conj.mode}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {lignes.map((lg, i) => {
          const fond =
            lg.valide === true
              ? "bg-emerald-50 dark:bg-emerald-500/10"
              : lg.valide === false
                ? "bg-rose-50 dark:bg-rose-500/10"
                : "";
          return (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-moyen p-1 ${fond}`}
            >
              <input
                type="text"
                value={lg.pronom}
                onChange={(e) => onChange(i, "pronom", e.target.value)}
                placeholder="pronom"
                aria-label={`Pronom ligne ${i + 1}`}
                className="w-20 shrink-0 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              />
              <input
                type="text"
                value={lg.forme}
                onChange={(e) => onChange(i, "forme", e.target.value)}
                placeholder="forme conjuguée"
                aria-label={`Forme ligne ${i + 1}`}
                className="min-w-0 flex-1 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              />
              <button
                type="button"
                onClick={() => onVerifier(i)}
                aria-label={`Vérifier la ligne ${i + 1}`}
                className={`shrink-0 rounded-moyen px-2 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                  lg.valide === true
                    ? "bg-emerald-500 text-white"
                    : "text-encre-douce ring-1 ring-ligne hover:bg-fond"
                }`}
              >
                {lg.valide === true ? "✓" : "Vérifier"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ConjugaisonEntrainement() {
  // Réglages (menu)
  const [choix, setChoix] = useState<[Choix, Choix]>([
    { infinitif: "parler", temps: "présent", mode: "indicatif" },
    { infinitif: "finir", temps: "présent", mode: "indicatif" },
  ]);
  const [classeId, setClasseId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [contraintesChoisies, setContraintesChoisies] = useState<string[]>([]);
  const [nouvelleContrainte, setNouvelleContrainte] = useState("");

  // Communs
  const [classes, setClasses] = useState<Classe[]>([]);
  const [charge, setCharge] = useState(false);
  const [phase, setPhase] = useState<Phase>("menu");
  const [modeJeu, setModeJeu] = useState<ModeJeu>("entrainement");
  const [codeEval, setCodeEval] = useState<string | null>(null);
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [aideOuverte, setAideOuverte] = useState(false);
  const [verbesPerso, setVerbesPerso] = useState<VerbePerso[]>([]);
  const [infinitifPropose, setInfinitifPropose] = useState("");
  // Quel des deux tableaux a demandé la création : on y place le nouveau verbe.
  const [slotCreation, setSlotCreation] = useState<0 | 1>(0);

  // Partie en cours
  const [parties, setParties] = useState<Partie[]>([]);
  const [saisies, setSaisies] = useState<Ligne[][]>([]);
  // Minuteries pour vider une ligne fausse après le flash rouge (clé « t-i »).
  const effaceursRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [phrase, setPhrase] = useState("");
  const [phraseCorrigee, setPhraseCorrigee] = useState("");
  const [contraintes, setContraintes] = useState<Contrainte[]>([]);

  // Chargement des classes + date du jour (côté client uniquement). Initialisé dans un
  // effet (localStorage, date locale) pour éviter un décalage d'hydratation — faux
  // positif de set-state-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseId(initiales[0]?.id ?? null);
    setDate(new Date().toISOString().slice(0, 10));
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Verbes personnalisés du prof (API). Un échec n'est pas bloquant : on
  // travaille alors avec la seule banque officielle.
  useEffect(() => {
    let vivant = true;
    fetch("/api/verbes-perso")
      .then((r) => (r.ok ? r.json() : { verbes: [] }))
      .then((data: { verbes?: VerbePerso[] }) => {
        if (vivant) setVerbesPerso(data.verbes ?? []);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, []);

  // Arrête les minuteries d'effacement au démontage.
  useEffect(() => {
    const effaceurs = effaceursRef.current;
    return () => {
      effaceurs.forEach((minuterie) => clearTimeout(minuterie));
      effaceurs.clear();
    };
  }, []);

  // Banque officielle + verbes du prof. Les perso passent devant à infinitif
  // égal : si le prof a créé « bouillir », c'est SA version qui compte.
  const tousLesVerbes: EntreeVerbe[] = useMemo(() => {
    const persoInf = new Set(verbesPerso.map((v) => v.infinitif));
    return [
      ...verbesPerso.map((v) => ({
        infinitif: v.infinitif,
        groupe: v.groupe,
        auxiliaire: v.auxiliaire,
        formesCorrigees: v.formesCorrigees,
      })),
      ...verbes.filter((v) => !persoInf.has(v.infinitif)),
    ].sort((a, b) => a.infinitif.localeCompare(b.infinitif, "fr"));
  }, [verbesPerso]);

  const infinitifsPerso = useMemo(
    () => new Set(verbesPerso.map((v) => v.infinitif)),
    [verbesPerso],
  );

  // Supprime un verbe du prof. Les tableaux qui le visaient retombent sur
  // « parler », faute de quoi « Lancer » resterait bloqué sans rien dire.
  async function supprimerVerbePerso(infinitif: string) {
    const cible = verbesPerso.find((v) => v.infinitif === infinitif);
    if (!cible) return;
    const r = await fetch(`/api/verbes-perso/${cible.id}`, { method: "DELETE" });
    if (!r.ok) return;
    setVerbesPerso((prev) => prev.filter((v) => v.id !== cible.id));
    setChoix((prev) => [
      prev[0].infinitif === infinitif ? { ...prev[0], infinitif: "parler" } : prev[0],
      prev[1].infinitif === infinitif ? { ...prev[1], infinitif: "parler" } : prev[1],
    ]);
  }

  // --- Actions (menu) ---
  function majChoix(slot: 0 | 1, partiel: Partial<Choix>) {
    setChoix((prev) => {
      const suivant: [Choix, Choix] = [prev[0], prev[1]];
      suivant[slot] = { ...prev[slot], ...partiel };
      return suivant;
    });
  }

  function ajouterContrainteChoisie(label: string) {
    const propre = label.trim();
    if (!propre) return;
    setContraintesChoisies((prev) =>
      prev.includes(propre) ? prev : [...prev, propre],
    );
    setNouvelleContrainte("");
  }

  function retirerContrainteChoisie(idx: number) {
    setContraintesChoisies((prev) => prev.filter((_, i) => i !== idx));
  }

  function lancer() {
    const resolues = choix.map((c) => resoudre(c, tousLesVerbes));
    if (resolues.some((p) => p === null)) return;
    setParties(resolues as Partie[]);
    setSaisies([lignesVides(), lignesVides()]);
    setPhrase("");
    setPhraseCorrigee("");
    setContraintes(contraintesChoisies.map((label) => ({ label, validee: false })));
    setPhase("jeu");
  }

  // Crée une évaluation côté serveur, puis bascule sur l'écran de suivi.
  async function creerEvaluation() {
    if (!classeId || creationEnCours) return;
    const resolues = choix.map((c) => resoudre(c, tousLesVerbes));
    if (resolues.some((p) => p === null)) return;
    const classeNom = classes.find((c) => c.id === classeId)?.nom ?? "";
    setCreationEnCours(true);
    try {
      const r = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `Évaluation du ${date}`,
          classeId,
          classeNom,
          date,
          // On fige le corrigé maintenant : le serveur ne saurait pas
          // reconstituer un verbe personnalisé, et une copie déjà rendue doit
          // garder sa note même si la banque évolue.
          verbes: (resolues as Partie[]).map((p) => ({
            infinitif: p.entree.infinitif,
            temps: p.conj.temps,
            mode: p.conj.mode,
            formes: {
              formes: p.conj.formes,
              lignes: p.conj.lignes,
              variantes: p.conj.formes.map(
                (_, i) => p.conj.variantes?.[i] ?? null,
              ),
            },
          })),
          contraintes: contraintesChoisies,
        }),
      });
      if (r.ok) {
        const { code } = (await r.json()) as { code: string };
        setCodeEval(code);
        setPhase("suiviEval");
      }
    } catch {
      /* réseau : le prof peut réessayer */
    } finally {
      setCreationEnCours(false);
    }
  }

  // --- Actions (jeu) ---
  function majLigne(t: number, i: number, champ: "pronom" | "forme", val: string) {
    setSaisies((prev) =>
      prev.map((tab, ti) =>
        ti === t
          ? tab.map((lg, li) =>
              li === i ? { ...lg, [champ]: val, valide: null } : lg,
            )
          : tab,
      ),
    );
  }

  function verifierLigne(t: number, i: number) {
    const conj = parties[t]?.conj;
    if (!conj) return;
    const ok = ligneCorrecte(saisies[t][i].pronom, saisies[t][i].forme, conj, i);
    setSaisies((prev) =>
      prev.map((tab, ti) =>
        ti === t
          ? tab.map((lg, li) => (li === i ? { ...lg, valide: ok } : lg))
          : tab,
      ),
    );
    // Mauvaise réponse : on laisse le flash rouge, puis on vide la ligne.
    if (!ok) {
      const cle = `${t}-${i}`;
      const ancien = effaceursRef.current.get(cle);
      if (ancien) clearTimeout(ancien);
      const minuterie = setTimeout(() => {
        setSaisies((prev) =>
          prev.map((tab, ti) =>
            ti === t
              ? tab.map((lg, li) =>
                  li === i ? { pronom: "", forme: "", valide: null } : lg,
                )
              : tab,
          ),
        );
        effaceursRef.current.delete(cle);
      }, 900);
      effaceursRef.current.set(cle, minuterie);
    }
  }

  function basculerContrainte(idx: number) {
    setContraintes((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, validee: !c.validee } : c)),
    );
  }

  function reinitialiser() {
    setSaisies([lignesVides(), lignesVides()]);
    setPhrase("");
    setPhraseCorrigee("");
    setContraintes((prev) => prev.map((c) => ({ ...c, validee: false })));
  }

  function terminerSeance() {
    if (!classeId) return;
    const tableaux = parties.map((p, t) => ({
      infinitif: p.entree.infinitif,
      temps: p.conj.temps,
      mode: p.conj.mode,
      lignes: saisies[t].map((lg, i) => ({
        pronom: lg.pronom,
        forme: lg.forme,
        correcte: ligneCorrecte(lg.pronom, lg.forme, p.conj, i),
      })),
    }));
    const seance: SeanceConj = {
      id: nouvelId(),
      classeId,
      date,
      tableaux,
      contraintesValidees: contraintes.filter((c) => c.validee).map((c) => c.label),
      phraseCorrigee,
    };
    ajouterSeance(seance);
    setPhase("historique");
  }

  // Styles de boutons partagés.
  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const champ =
    "rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  // ---------- Écran : nouveau verbe personnalisé ----------
  if (phase === "nouveauVerbe") {
    return (
      <FormVerbePerso
        infinitifPropose={infinitifPropose}
        onAnnuler={() => setPhase("menu")}
        onEnregistre={(v) => {
          // Un ré-enregistrement du même infinitif remplace l'ancien.
          setVerbesPerso((prev) => [
            ...prev.filter((x) => x.infinitif !== v.infinitif),
            v,
          ]);
          majChoix(slotCreation, { infinitif: v.infinitif });
          setPhase("menu");
        }}
      />
    );
  }

  // ---------- Écran : suivi d'une évaluation ----------
  if (phase === "suiviEval" && codeEval) {
    return (
      <SuiviEvaluation code={codeEval} onRetour={() => setPhase("menu")} />
    );
  }

  // ---------- Écran : menu ----------
  if (phase === "menu") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-titre text-2xl font-bold text-encre">
            Conjugaison — entraînement
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAideOuverte((v) => !v)}
              aria-expanded={aideOuverte}
              aria-label="Comment ça marche ?"
              title="Comment ça marche ?"
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-encre-douce ring-1 ring-ligne transition hover:bg-fond hover:text-principal focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              ?
            </button>
            <button
              type="button"
              onClick={() => setPhase("historique")}
              className={btnFantome}
            >
              <span aria-hidden="true">📒</span> Historique
            </button>
          </div>
        </div>

        {aideOuverte && (
          <div className="mt-4 rounded-carte border border-ligne bg-fond p-4 text-sm text-encre-douce">
            <p className="font-semibold text-encre">Comment ça marche ?</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Choisis <strong>2 verbes</strong> (verbe + temps + mode), une{" "}
                <strong>classe</strong> et une <strong>date</strong>. Tu peux
                ajouter des <strong>contraintes de phrase</strong> (optionnel).
              </li>
              <li>
                <strong>Entraînement</strong> : au tableau, la classe complète les
                6 personnes (pronom + forme) de chaque verbe ; chaque ligne se
                vérifie d’un clic (✓ vert, sinon flash rouge).{" "}
                <strong>« Ma phrase »</strong> fait écrire une phrase qui utilise
                les 2 verbes. « Terminer la séance » l’enregistre dans
                l’<strong>historique</strong>.
              </li>
              <li>
                <strong>Évaluation</strong> : « Créer l’évaluation » génère un{" "}
                <strong>code</strong>. Les élèves vont sur{" "}
                <strong>« Rejoindre une évaluation »</strong>, entrent le code et
                leur prénom, remplissent les tableaux et la phrase, puis envoient
                leur copie. Tu suis les copies en direct et tu corriges (note /20).
              </li>
            </ul>
          </div>
        )}

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
          <div className="mt-6 flex flex-col gap-5">
            <div className="inline-flex self-start rounded-full bg-fond p-1">
              {(["entrainement", "evaluation"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModeJeu(m)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    modeJeu === m
                      ? "bg-surface text-principal shadow-sm"
                      : "text-encre-douce"
                  }`}
                >
                  {m === "entrainement" ? "Entraînement" : "Évaluation"}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {([0, 1] as const).map((slot) => (
                <div
                  key={slot}
                  className="rounded-carte border border-ligne p-4"
                >
                  <p className="mb-2 text-sm font-semibold text-encre-douce">
                    Verbe {slot + 1}
                  </p>
                  <SelecteurVerbe
                    valeur={choix[slot].infinitif}
                    onChange={(infinitif) => majChoix(slot, { infinitif })}
                    verbes={tousLesVerbes}
                    label={`Verbe ${slot + 1}`}
                    onCreer={(propose) => {
                      setInfinitifPropose(propose);
                      setSlotCreation(slot);
                      setPhase("nouveauVerbe");
                    }}
                    infinitifsPerso={infinitifsPerso}
                    onSupprimer={supprimerVerbePerso}
                  />
                  {/* Le temps ne dépend plus du verbe : changer de verbe le conserve. */}
                  <select
                    value={cleTempsMode(choix[slot])}
                    onChange={(e) => {
                      const tm = TEMPS_JEU.find(
                        (t) => cleTempsMode(t) === e.target.value,
                      );
                      if (tm) majChoix(slot, { temps: tm.temps, mode: tm.mode });
                    }}
                    aria-label={`Temps du verbe ${slot + 1}`}
                    className={`mt-2 w-full ${champ}`}
                  >
                    {TEMPS_JEU.map((t) => (
                      <option key={cleTempsMode(t)} value={cleTempsMode(t)}>
                        {libelleTempsMode(t)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
                Classe
                <select
                  value={classeId ?? ""}
                  onChange={(e) => setClasseId(e.target.value)}
                  className={champ}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom || "Sans nom"} ({c.eleves.length})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={champ}
                />
              </label>
            </div>

            {/* Contraintes de phrase : liste déroulante + saisie manuelle */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-encre-douce">
                Contraintes de phrase (optionnel)
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  value=""
                  onChange={(e) => ajouterContrainteChoisie(e.target.value)}
                  aria-label="Choisir une contrainte dans la liste"
                  className={champ}
                >
                  <option value="">Choisir dans la liste…</option>
                  {contraintesPhrase.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={nouvelleContrainte}
                  onChange={(e) => setNouvelleContrainte(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ajouterContrainteChoisie(nouvelleContrainte);
                    }
                  }}
                  placeholder="…ou écrire une contrainte"
                  aria-label="Écrire une contrainte"
                  className={`min-w-0 flex-1 ${champ}`}
                />
                <button
                  type="button"
                  onClick={() => ajouterContrainteChoisie(nouvelleContrainte)}
                  className={btnFantome}
                >
                  Ajouter
                </button>
              </div>
              {contraintesChoisies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {contraintesChoisies.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-fond px-3 py-1 text-sm text-encre"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => retirerContrainteChoisie(i)}
                        aria-label={`Retirer ${c}`}
                        className="text-encre-douce transition hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {modeJeu === "entrainement" ? (
              <button
                type="button"
                onClick={lancer}
                disabled={!classeId}
                className={`${btnPrincipal} self-start`}
              >
                Lancer
              </button>
            ) : (
              <button
                type="button"
                onClick={creerEvaluation}
                disabled={!classeId || creationEnCours}
                className={`${btnPrincipal} self-start`}
              >
                {creationEnCours ? "Création…" : "Créer l'évaluation"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran : historique ----------
  if (phase === "historique") {
    const seances = classeId ? seancesDeClasse(classeId) : [];
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-titre text-2xl font-bold text-encre">
            Historique des séances
          </h2>
          <button
            type="button"
            onClick={() => setPhase("menu")}
            className={btnFantome}
          >
            <span aria-hidden="true">←</span> Retour
          </button>
        </div>

        {classes.length > 0 && (
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-encre-douce">
            Classe
            <select
              value={classeId ?? ""}
              onChange={(e) => setClasseId(e.target.value)}
              className={champ}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom || "Sans nom"}
                </option>
              ))}
            </select>
          </label>
        )}

        {seances.length === 0 ? (
          <p className="mt-6 rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
            Aucune séance enregistrée pour cette classe.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {seances.map((s) => (
              <div
                key={s.id}
                className="rounded-carte border border-ligne p-4"
              >
                <p className="text-sm font-semibold text-encre-douce">
                  {s.date}
                </p>
                <p className="mt-1 font-bold text-encre">
                  {s.tableaux
                    .map((t) => `${t.infinitif} (${t.temps})`)
                    .join("  ·  ")}
                </p>
                {s.contraintesValidees.length > 0 && (
                  <p className="mt-1 text-sm text-encre-douce">
                    Contraintes : {s.contraintesValidees.join(", ")}
                  </p>
                )}
                {s.phraseCorrigee && (
                  <p className="mt-2 rounded-moyen bg-fond p-2 text-sm italic text-encre">
                    « {s.phraseCorrigee} »
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran : jeu ----------
  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Conjugaison — entraînement
        </h2>
        <span className="text-sm text-encre-douce">{date}</span>
      </div>

      {/* 2 tableaux */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {parties.map((p, t) => (
          <TableauVerbe
            key={t}
            partie={p}
            lignes={saisies[t]}
            onChange={(i, ch, val) => majLigne(t, i, ch, val)}
            onVerifier={(i) => verifierLigne(t, i)}
          />
        ))}
      </div>

      {/* Ma phrase */}
      <div className="mt-6 rounded-carte border border-ligne p-4">
        <h3 className="font-titre font-bold text-encre">Ma phrase</h3>
        <p className="text-sm text-encre-douce">
          Une phrase qui utilise les deux verbes.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            rows={4}
            placeholder="Écris la phrase de la classe…"
            aria-label="Phrase de la classe"
            className="w-full rounded-carte border border-ligne bg-surface px-3 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-encre-douce">
              Contraintes
            </p>
            {contraintes.length === 0 ? (
              <p className="text-sm text-encre-douce">
                Aucune contrainte choisie (à définir au lancement).
              </p>
            ) : (
              contraintes.map((c, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-encre"
                >
                  <input
                    type="checkbox"
                    checked={c.validee}
                    onChange={() => basculerContrainte(i)}
                    className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
                  />
                  <span className={c.validee ? "line-through opacity-60" : ""}>
                    {c.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-encre-douce">
            Phrase corrigée (à recopier)
          </p>
          <textarea
            value={phraseCorrigee}
            onChange={(e) => setPhraseCorrigee(e.target.value)}
            rows={2}
            placeholder="La version validée, en grand pour la recopie…"
            aria-label="Phrase corrigée"
            className="mt-1 w-full rounded-carte border border-ligne bg-surface px-4 py-3 text-xl font-semibold text-encre placeholder:text-base placeholder:font-normal placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={reinitialiser} className={btnFantome}>
          Réinitialiser
        </button>
        <button type="button" onClick={terminerSeance} className={btnPrincipal}>
          Terminer la séance
        </button>
      </div>
    </div>
  );
}
