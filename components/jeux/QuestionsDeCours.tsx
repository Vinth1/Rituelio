"use client";

// Jeu « Questions de cours » : interrogation orale pilotée par le prof.
// 1) Réglages : choix de la classe (gérée dans « Mes classes ») et de la
//    catégorie (Français / Sciences sociales / Révolution française).
// 2) À chaque question, une pioche aléatoire (prénoms qui défilent, comme le
//    Conjugator) désigne un élève. Tirage SANS remise : personne n'est
//    réinterrogé avant que toute la classe soit passée — tous les élèves
//    répondent donc au même nombre de questions.
// 3) Le questionnaire s'arrête au bouton « Terminer » ou automatiquement au
//    nombre max de questions équitable (tours complets de la classe possibles
//    avec les questions disponibles). Le tableau des scores (bonnes réponses /
//    questions posées, ex. 1/2) n'est montré qu'à la fin.
// Pensé pour le vidéoprojecteur : gros texte, fort contraste.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type Classe, type Eleve, chargerClasses } from "@/lib/classes";
import {
  CATEGORIES_QUESTIONS_COURS,
  questionsCoursDe,
  type CategorieQuestionsCours,
  type QuestionCours,
} from "@/data/questions-cours";
import { couleurBande, couleurBanniere } from "@/lib/couleurs";

type Etape = "reglages" | "jeu" | "fin";

type Resultat = { bonnes: number; posees: number };

// Mélange de Fisher-Yates (copie, sans modifier l'original).
function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// Mélange l'ordre d'affichage des propositions d'un QCM (et recalcule l'index
// de la bonne réponse) : évite que la bonne réponse soit souvent à la même
// place que dans la liste d'origine. Sans effet sur les questions ouvertes.
function melangerChoix(q: QuestionCours): QuestionCours {
  if (!q.choix || q.bonneReponse === undefined) return q;
  const indices = melanger(q.choix.map((_, i) => i));
  return {
    ...q,
    choix: indices.map((i) => q.choix![i]),
    bonneReponse: indices.indexOf(q.bonneReponse),
  };
}

export default function QuestionsDeCours() {
  // --- Réglages ---
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [categorie, setCategorie] = useState<CategorieQuestionsCours | null>(null);

  // --- Déroulé de la partie ---
  const [etape, setEtape] = useState<Etape>("reglages");
  const [file, setFile] = useState<QuestionCours[]>([]); // questions mélangées
  const [indexFile, setIndexFile] = useState(0);
  const [numero, setNumero] = useState(0); // nombre de questions déjà posées
  const [maxQuestions, setMaxQuestions] = useState(0); // fin automatique (tours complets)
  const [resultats, setResultats] = useState<Record<string, Resultat>>({});

  // --- Pioche aléatoire (sans remise sur le tour en cours) ---
  const [pool, setPool] = useState<Eleve[]>([]); // élèves pas encore passés ce tour
  const [elu, setElu] = useState<Eleve | null>(null);
  const [nomAffiche, setNomAffiche] = useState<string | null>(null);
  const [roulette, setRoulette] = useState(false);
  const rouleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Question en cours ---
  const [choisi, setChoisi] = useState<number | null>(null); // QCM
  const [reponseVisible, setReponseVisible] = useState(false); // question ouverte
  const [juge, setJuge] = useState<boolean | null>(null); // verdict du prof (ouverte)

  // Chargement des classes (localStorage, côté client) : initialisé dans un effet
  // pour éviter un décalage d'hydratation — faux positif de set-state-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseId(initiales[0]?.id ?? null);
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Arrête l'animation de la pioche au démontage.
  useEffect(() => {
    return () => {
      if (rouleRef.current) clearInterval(rouleRef.current);
    };
  }, []);

  const classe = useMemo(
    () => classes.find((c) => c.id === classeId) ?? null,
    [classes, classeId],
  );
  const eleves = useMemo(() => classe?.eleves ?? [], [classe]);
  const infoCategorie = CATEGORIES_QUESTIONS_COURS.find((c) => c.slug === categorie);

  // Classement : tous les élèves de la classe, triés par bonnes réponses.
  const classement = useMemo(() => {
    return eleves
      .map((e) => ({ eleve: e, ...(resultats[e.id] ?? { bonnes: 0, posees: 0 }) }))
      .sort(
        (a, b) =>
          b.bonnes - a.bonnes ||
          a.posees - b.posees ||
          a.eleve.nom.localeCompare(b.eleve.nom),
      );
  }, [eleves, resultats]);
  const maxBonnes = classement[0]?.bonnes ?? 0;

  // ---------- Actions ----------

  function demarrer() {
    if (!classe || eleves.length === 0 || !categorie) return;
    const questions = questionsCoursDe(categorie);
    if (questions.length === 0) return;
    // Fin automatique : autant de tours complets de la classe que les questions
    // le permettent (au moins un), pour que chacun en ait le même nombre.
    const tours = Math.max(1, Math.floor(questions.length / eleves.length));
    setMaxQuestions(tours * eleves.length);
    setFile(melanger(questions).map(melangerChoix));
    setIndexFile(0);
    setNumero(0);
    setResultats({});
    setPool(eleves);
    setElu(null);
    setNomAffiche(null);
    setChoisi(null);
    setReponseVisible(false);
    setJuge(null);
    setEtape("jeu");
  }

  // Tire un élève au hasard avec une petite animation (les prénoms défilent),
  // comme le Conjugator — mais dans le pool « sans remise » du tour en cours.
  function lancerRoue() {
    if (roulette || elu !== null || pool.length === 0) return;
    const designe = pool[Math.floor(Math.random() * pool.length)];
    setRoulette(true);
    let ticks = 0;
    rouleRef.current = setInterval(() => {
      ticks += 1;
      if (ticks >= 15) {
        if (rouleRef.current) clearInterval(rouleRef.current);
        rouleRef.current = null;
        setNomAffiche(designe.nom);
        setElu(designe);
        // L'élève désigné sort de la pioche jusqu'à ce que tout le monde soit passé.
        setPool((prev) => prev.filter((e) => e.id !== designe.id));
        setNumero((n) => n + 1);
        setRoulette(false);
      } else {
        setNomAffiche(pool[Math.floor(Math.random() * pool.length)].nom);
      }
    }, 80);
  }

  function enregistrer(correcte: boolean) {
    if (!elu) return;
    setResultats((prev) => {
      const actuel = prev[elu.id] ?? { bonnes: 0, posees: 0 };
      return {
        ...prev,
        [elu.id]: {
          bonnes: actuel.bonnes + (correcte ? 1 : 0),
          posees: actuel.posees + 1,
        },
      };
    });
  }

  // Réponse à un QCM : on ne répond qu'une fois.
  function repondreQcm(i: number) {
    const q = file[indexFile];
    if (choisi !== null || q.bonneReponse === undefined) return;
    setChoisi(i);
    enregistrer(i === q.bonneReponse);
  }

  // Verdict du prof sur une question ouverte.
  function jugerOuverte(correcte: boolean) {
    if (juge !== null) return;
    setJuge(correcte);
    enregistrer(correcte);
  }

  function questionSuivante() {
    // Question suivante dans la file ; on remélange quand elle est épuisée.
    if (indexFile + 1 < file.length) {
      setIndexFile((i) => i + 1);
    } else {
      setFile((f) => melanger(f).map(melangerChoix));
      setIndexFile(0);
    }
    // Nouveau tour de classe quand tout le monde est passé.
    setPool((prev) => (prev.length === 0 ? eleves : prev));
    setElu(null);
    setNomAffiche(null);
    setChoisi(null);
    setReponseVisible(false);
    setJuge(null);
  }

  function terminer() {
    if (rouleRef.current) clearInterval(rouleRef.current);
    rouleRef.current = null;
    setRoulette(false);
    setEtape("fin");
  }

  function changerReglages() {
    if (rouleRef.current) clearInterval(rouleRef.current);
    rouleRef.current = null;
    setRoulette(false);
    setElu(null);
    setEtape("reglages");
  }

  // ---------- Écran : réglages ----------
  if (etape === "reglages") {
    const pret = classe !== null && eleves.length > 0 && categorie !== null;
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h2 className="font-titre text-2xl font-bold text-encre">
          🎯 Questions de cours
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Choisis une classe et une catégorie : la pioche désigne un élève pour
          chaque question, et tout le monde répond au même nombre de questions.
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
          <div className="mt-5 flex flex-col gap-6">
            <label className="flex flex-wrap items-center gap-2 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeId ?? ""}
                onChange={(e) => setClasseId(e.target.value)}
                className="rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom || "Sans nom"} ({c.eleves.length})
                  </option>
                ))}
              </select>
            </label>

            {eleves.length === 0 && (
              <p className="rounded-carte border border-dashed border-ligne p-4 text-center text-sm text-encre-douce">
                Cette classe n’a pas encore d’élèves. Ajoute-les depuis « Mes
                classes ».
              </p>
            )}

            <div>
              <h3 className="mb-3 text-sm font-medium text-encre-douce">
                Catégorie
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES_QUESTIONS_COURS.map((c) => {
                  const active = categorie === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategorie(c.slug)}
                      aria-pressed={active}
                      className={`group flex flex-col items-center gap-2 rounded-carte p-4 text-center transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                        active ? "ring-2 ring-principal" : "ring-1 ring-ligne"
                      }`}
                    >
                      <span
                        className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-sm transition group-hover:scale-105 ${couleurBande(c.couleur)}`}
                        aria-hidden="true"
                      >
                        {c.icone}
                      </span>
                      <span className="text-lg font-bold text-encre">{c.label}</span>
                      <span className="text-xs text-encre-douce">{c.description}</span>
                      <span
                        className={`mt-1 h-1.5 w-10 rounded-full ${couleurBanniere(c.couleur)}`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={demarrer}
                disabled={!pret}
                className="rounded-full bg-principal px-7 py-3 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lancer le questionnaire →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran : résultats finaux ----------
  if (etape === "fin") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h2 className="text-center font-titre text-2xl font-bold text-encre">
          🏁 Résultats
        </h2>
        <p className="mt-1 text-center text-sm text-encre-douce">
          {numero} question{numero > 1 ? "s" : ""} posée{numero > 1 ? "s" : ""} —{" "}
          {infoCategorie?.label}
        </p>

        <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2">
          {classement.map(({ eleve, bonnes, posees }) => {
            const enTete = bonnes === maxBonnes && maxBonnes > 0;
            return (
              <li
                key={eleve.id}
                className={`flex items-center justify-between gap-3 rounded-carte px-4 py-2.5 ${
                  enTete
                    ? "bg-principal-clair font-bold text-encre ring-1 ring-principal"
                    : "text-encre ring-1 ring-ligne"
                }`}
              >
                <span className="flex items-center gap-2 text-base">
                  {enTete && <span aria-hidden="true">🏆</span>}
                  {eleve.nom}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {bonnes} / {posees}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={demarrer}
            className="rounded-full bg-principal px-6 py-3 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            ↺ Recommencer
          </button>
          <button
            type="button"
            onClick={changerReglages}
            className="rounded-full bg-surface px-6 py-3 text-base font-bold text-encre ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Changer de réglages
          </button>
        </div>
      </div>
    );
  }

  // ---------- Écran : jeu (pioche + question) ----------
  const q = file[indexFile];
  const estQcm = q.choix !== undefined && q.bonneReponse !== undefined;
  const repondu = estQcm ? choisi !== null : juge !== null;
  const derniereQuestion = numero >= maxQuestions;

  function styleChoix(i: number): string {
    const estBonne = i === q.bonneReponse;
    const estChoisi = i === choisi;
    if (!repondu)
      return "bg-surface text-encre ring-1 ring-ligne hover:border-principal hover:bg-fond";
    if (estBonne) return "bg-emerald-500 text-white ring-1 ring-emerald-500";
    if (estChoisi) return "bg-red-500 text-white ring-1 ring-red-500";
    return "bg-surface text-encre-douce ring-1 ring-ligne opacity-70";
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-encre-douce">
          Question {elu ? numero : Math.min(numero + 1, maxQuestions)} /{" "}
          {maxQuestions} — {infoCategorie?.label}
        </span>
        <button
          type="button"
          onClick={terminer}
          className="rounded-full px-3 py-1 font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          🏁 Terminer
        </button>
      </div>

      {/* Pioche aléatoire (comme le Conjugator) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-carte px-5 py-4 ${couleurBande(infoCategorie?.couleur ?? "")}`}
      >
        <p
          className={`text-4xl font-extrabold transition ${roulette ? "animate-pulse" : ""}`}
          aria-live="polite"
        >
          {nomAffiche ?? "—"}
        </p>
        <button
          type="button"
          onClick={lancerRoue}
          disabled={roulette || elu !== null}
          className="inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">🎡</span> {roulette ? "…" : "Lancer la roue"}
        </button>
      </div>

      {!elu ? (
        <p className="mt-6 rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
          {roulette
            ? "La pioche tourne…"
            : "Lance la roue pour désigner l’élève qui répondra à la prochaine question."}
        </p>
      ) : (
        <>
          <h2 className="mt-5 font-titre text-2xl font-bold leading-snug text-encre sm:text-3xl">
            {q.question}
          </h2>

          {estQcm ? (
            <div className="mt-5 flex flex-col gap-3">
              {q.choix!.map((choix, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => repondreQcm(i)}
                  disabled={repondu}
                  className={`rounded-carte px-5 py-4 text-left text-lg font-semibold transition disabled:cursor-default sm:text-xl ${styleChoix(i)}`}
                >
                  {choix}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-4">
              {!reponseVisible ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setReponseVisible(true)}
                    className="rounded-full bg-surface px-6 py-3 text-base font-bold text-encre ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    👁️ Afficher la réponse
                  </button>
                </div>
              ) : (
                <>
                  <p className="rounded-carte bg-principal-clair p-4 text-lg font-semibold text-encre">
                    Réponse attendue : {q.reponse}
                  </p>
                  {juge === null ? (
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => jugerOuverte(true)}
                        className="rounded-carte bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        ✓ Bonne réponse
                      </button>
                      <button
                        type="button"
                        onClick={() => jugerOuverte(false)}
                        className="rounded-carte bg-red-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        ✗ Mauvaise réponse
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-lg font-bold text-encre">
                      {juge ? "✓ Bonne réponse !" : "✗ Mauvaise réponse."}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {repondu && q.explication && (
            <p className="mt-4 rounded-carte bg-principal-clair p-4 text-base text-encre">
              💡 {q.explication}
            </p>
          )}

          {repondu && (
            <div className="mt-5 flex justify-end">
              {derniereQuestion ? (
                <button
                  type="button"
                  onClick={terminer}
                  className="rounded-carte bg-principal px-6 py-3 text-lg font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  🏁 Voir les résultats
                </button>
              ) : (
                <button
                  type="button"
                  onClick={questionSuivante}
                  className="rounded-carte bg-principal px-6 py-3 text-lg font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  Question suivante →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
