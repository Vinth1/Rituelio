"use client";

// Jeu jouable « Dictée du jour » (mode projection). Le prof choisit une classe
// et une dictée de sa banque (/prof/dictees), puis la classe corrige mot à mot :
// un élève épelle, le prof saisit ce qu'il entend — ou tranche d'un clic — et
// le mot se révèle dans le texte.
//
// Un seul écran, projeté au tableau : le texte reste masqué et se dévoile à
// mesure. La comparaison ignore la casse et les accents (`comparerEpellation`),
// parce qu'on épelle à l'oral sans annoncer « E accent aigu ».
//
// État en mémoire : rien n'est enregistré d'une séance à l'autre.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  comparerEpellation,
  decouperEnMots,
  type Dictee,
  type MotDictee,
} from "@/lib/dictee";
import { type Classe, type Eleve, chargerClasses } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";
import ChampTags, { useTagsConnus } from "@/components/dictees/ChampTags";

const ACCENT = "blue"; // accent de couleur du rituel « orthographe »

type Phase = "lancement" | "correction" | "bilan";
type Verdict = "juste" | "faux" | "passe";
type Resultat = { verdict: Verdict; saisie: string };

// Tire l'élève suivant à partir d'un état passé explicitement plutôt que du
// state React : `valider` enchaîne juste après un setState, où `passes` serait
// encore périmé et pourrait redonner la parole au même élève.
function tirerEleve(
  eleves: Eleve[],
  passes: string[],
  courantId: string | null,
): { id: string | null; passes: string[] } {
  if (eleves.length === 0) return { id: null, passes: [] };
  let restants = eleves.filter((e) => !passes.includes(e.id));
  let nouveauxPasses = passes;
  if (restants.length === 0) {
    // Tout le monde est passé : nouveau tour, sans reprendre l'élève courant.
    nouveauxPasses = [];
    restants = eleves.filter((e) => e.id !== courantId);
    if (restants.length === 0) restants = eleves;
  }
  const choisi = restants[Math.floor(Math.random() * restants.length)];
  return { id: choisi.id, passes: [...nouveauxPasses, choisi.id] };
}

function masquer(mot: string): string {
  return "•".repeat(mot.length);
}

export default function DicteeDuJour() {
  const { tags: tagsConnus } = useTagsConnus();

  // Réglages (écran de lancement)
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [dictees, setDictees] = useState<Dictee[]>([]);
  const [dicteeId, setDicteeId] = useState("");
  const [filtreTags, setFiltreTags] = useState<string[]>([]);

  // Correction en cours
  const [phase, setPhase] = useState<Phase>("lancement");
  const [mots, setMots] = useState<MotDictee[]>([]);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [position, setPosition] = useState(0);
  const [saisie, setSaisie] = useState("");
  const [eleveCourantId, setEleveCourantId] = useState<string | null>(null);
  const [passes, setPasses] = useState<string[]>([]);
  const [dernier, setDernier] = useState<{
    mot: string;
    resultat: Resultat;
  } | null>(null);
  // Le champ garde le focus après chaque mot validé (confort au vidéoprojecteur).
  const champSaisie = useRef<HTMLInputElement>(null);

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

  // Dictées, filtrées par les tags cochés (le serveur exige TOUS les tags).
  useEffect(() => {
    let actif = true;
    (async () => {
      const params = new URLSearchParams();
      if (filtreTags.length > 0) params.set("tags", filtreTags.join(","));
      try {
        const r = await fetch(`/api/dictees?${params}`);
        if (r.ok && actif) {
          const data = (await r.json()) as { dictees: Dictee[] };
          setDictees(data.dictees);
          setDicteeId((prec) =>
            data.dictees.some((d) => d.id === prec)
              ? prec
              : (data.dictees[0]?.id ?? ""),
          );
        }
      } catch {
        /* réseau : on garde la liste précédente */
      }
    })();
    return () => {
      actif = false;
    };
  }, [filtreTags]);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const dictee = dictees.find((d) => d.id === dicteeId) ?? null;
  const eleveCourant = eleves.find((e) => e.id === eleveCourantId) ?? null;
  const motCourant = mots[position] ?? null;

  function commencer() {
    if (!dictee) return;
    const decoupe = decouperEnMots(dictee.texte);
    if (decoupe.length === 0) return;
    setMots(decoupe);
    setResultats([]);
    setPosition(0);
    setSaisie("");
    setDernier(null);
    const tirage = tirerEleve(eleves, [], null);
    setEleveCourantId(tirage.id);
    setPasses(tirage.passes);
    setPhase("correction");
  }

  function valider(verdict: Verdict) {
    if (!motCourant) return;
    const resultat: Resultat = { verdict, saisie: saisie.trim() };
    setResultats((prec) => [...prec, resultat]);
    setDernier({ mot: motCourant.mot, resultat });
    setSaisie("");

    const suivante = position + 1;
    setPosition(suivante);
    if (suivante >= mots.length) {
      setPhase("bilan");
      return;
    }
    const tirage = tirerEleve(eleves, passes, eleveCourantId);
    setEleveCourantId(tirage.id);
    setPasses(tirage.passes);
    champSaisie.current?.focus();
  }

  function validerSaisie() {
    if (!motCourant || saisie.trim() === "") return;
    valider(comparerEpellation(saisie, motCourant.mot) ? "juste" : "faux");
  }

  function eleveSuivant() {
    const tirage = tirerEleve(eleves, passes, eleveCourantId);
    setEleveCourantId(tirage.id);
    setPasses(tirage.passes);
    champSaisie.current?.focus();
  }

  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  // ----- Écran de lancement -----
  if (phase === "lancement") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Dictée du jour
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Choisis une classe et une dictée, puis lance la correction collective.
        </p>

        {!charge ? (
          <p className="mt-6 text-sm text-encre-douce">Chargement…</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {classes.length === 0 ? (
              <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
                Aucune classe pour le moment. Crée une classe et ses élèves
                depuis la page{" "}
                <Link
                  href="/classe"
                  className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  « Mes classes »
                </Link>
                . Tu peux corriger sans classe : les élèves ne seront pas
                nommés.
              </p>
            ) : (
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
            )}

            <div className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
              Filtrer par tag
              <ChampTags
                tags={filtreTags}
                onChange={setFiltreTags}
                tagsConnus={tagsConnus}
                label="Filtrer les dictées par tag"
                placeholder="Filtrer par tag…"
              />
            </div>

            {dictees.length === 0 ? (
              <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
                {filtreTags.length > 0
                  ? "Aucune dictée ne porte ces tags."
                  : "Aucune dictée déposée."}{" "}
                <Link
                  href="/prof/dictees"
                  className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  Gérer mes dictées
                </Link>
              </p>
            ) : (
              <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
                Dictée
                <select
                  value={dicteeId}
                  onChange={(e) => setDicteeId(e.target.value)}
                  className="max-w-sm rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  {dictees.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.titre} ({decouperEnMots(d.texte).length} mots)
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div>
              <button
                type="button"
                onClick={commencer}
                disabled={!dictee || decouperEnMots(dictee.texte).length === 0}
                className={btnPrincipal}
              >
                Commencer la correction
              </button>
              {dictee && decouperEnMots(dictee.texte).length === 0 && (
                <p className="mt-2 text-sm text-encre-douce">
                  Cette dictée n’a pas encore de texte.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- Bilan -----
  if (phase === "bilan") {
    const rates = mots
      .map((m, i) => ({ mot: m.mot, resultat: resultats[i] }))
      .filter((x) => x.resultat?.verdict === "faux");
    const justes = resultats.filter((r) => r.verdict === "juste").length;
    const passesCount = resultats.filter((r) => r.verdict === "passe").length;

    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h2 className="font-titre text-2xl font-bold text-encre">
          Dictée corrigée
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          {justes} mot{justes > 1 ? "s" : ""} juste{justes > 1 ? "s" : ""} ·{" "}
          {rates.length} erreur{rates.length > 1 ? "s" : ""} · {passesCount}{" "}
          passé{passesCount > 1 ? "s" : ""}
        </p>

        {rates.length === 0 ? (
          <p className="mt-6 rounded-carte bg-emerald-50 p-4 text-center text-lg font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Aucune erreur — bravo !
          </p>
        ) : (
          <div className="mt-6">
            <h3 className="font-titre text-lg font-semibold text-encre">
              Mots à retravailler
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {rates.map((x, i) => (
                <li
                  key={`${x.mot}-${i}`}
                  className="flex flex-wrap items-baseline gap-2 rounded-moyen bg-fond px-3 py-2 text-base"
                >
                  <span className="font-bold text-encre">{x.mot}</span>
                  {x.resultat.saisie && (
                    <span className="text-sm text-encre-douce">
                      épelé « {x.resultat.saisie} »
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={commencer} className={btnPrincipal}>
            Refaire cette dictée
          </button>
          <button
            type="button"
            onClick={() => setPhase("lancement")}
            className={btnFantome}
          >
            Choisir une autre dictée
          </button>
        </div>
      </div>
    );
  }

  // ----- Correction -----
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-carte px-5 py-4 text-center ${couleurBande(ACCENT)}`}
      >
        <p className="font-titre text-2xl font-bold sm:text-3xl">
          {dictee?.titre}
        </p>
        <p className="text-sm font-semibold">
          Mot {position + 1} sur {mots.length}
        </p>
      </div>

      {/* Le texte entier, révélé à mesure. `whitespace-pre-wrap` préserve les
          espaces et les retours à la ligne du texte source. */}
      <p className="whitespace-pre-wrap rounded-carte border border-ligne bg-surface p-5 text-2xl leading-relaxed text-encre sm:text-3xl">
        {mots.map((m, i) => {
          const r = resultats[i];
          const traite = i < position;
          let classe = "text-encre-douce";
          if (traite && r?.verdict === "juste") {
            classe = "font-bold text-emerald-600 dark:text-emerald-300";
          } else if (traite && r?.verdict === "faux") {
            classe = "font-bold text-rose-600 dark:text-rose-300";
          } else if (traite) {
            classe = "text-encre";
          } else if (i === position) {
            classe =
              "rounded-moyen bg-amber-100 px-1 font-bold text-amber-900 dark:bg-amber-400/20 dark:text-amber-100";
          }
          return (
            <span key={m.index}>
              {m.avant}
              <span className={classe}>
                {traite ? m.mot : masquer(m.mot)}
              </span>
              {m.apres}
            </span>
          );
        })}
      </p>

      <div className="rounded-carte border border-ligne bg-surface p-5">
        {eleveCourant && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="text-xl font-bold text-encre">
              Au tour de : {eleveCourant.nom}
            </p>
            <button
              type="button"
              onClick={eleveSuivant}
              className={btnFantome}
            >
              <span aria-hidden="true">🎲</span> Élève suivant
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            validerSaisie();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            ref={champSaisie}
            type="text"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            aria-label="Épellation dictée par l'élève"
            placeholder="Ce que l'élève épelle…"
            autoComplete="off"
            className="min-w-48 flex-1 rounded-full border border-ligne bg-surface px-4 py-2.5 text-lg text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
          <button
            type="submit"
            disabled={saisie.trim() === ""}
            className={btnPrincipal}
          >
            Valider la saisie
          </button>
          <button
            type="button"
            onClick={() => valider("juste")}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-base font-bold text-white transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <span aria-hidden="true">✅</span> Juste
          </button>
          <button
            type="button"
            onClick={() => valider("faux")}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2.5 text-base font-bold text-white transition hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <span aria-hidden="true">❌</span> Faux
          </button>
          <button
            type="button"
            onClick={() => valider("passe")}
            className={btnFantome}
          >
            Passer
          </button>
        </form>

        <p aria-live="polite" className="mt-3 min-h-7 text-lg">
          {dernier?.resultat.verdict === "juste" && (
            <span className="font-bold text-emerald-600 dark:text-emerald-300">
              <span aria-hidden="true">✅</span> Exact — {dernier.mot}
            </span>
          )}
          {dernier?.resultat.verdict === "faux" && (
            <span className="font-bold text-rose-600 dark:text-rose-300">
              <span aria-hidden="true">❌</span>{" "}
              {dernier.resultat.saisie
                ? `« ${dernier.resultat.saisie} » → ${dernier.mot}`
                : `Attendu : ${dernier.mot}`}
            </span>
          )}
          {dernier?.resultat.verdict === "passe" && (
            <span className="text-encre-douce">Passé — {dernier.mot}</span>
          )}
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setPhase("bilan")}
          className={btnFantome}
        >
          Arrêter et voir le bilan
        </button>
      </div>
    </div>
  );
}
