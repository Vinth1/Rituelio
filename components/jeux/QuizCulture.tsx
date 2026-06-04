"use client";

// Jeu jouable « Quiz culture » : choix d'un thème (pastilles rondes), puis
// questions une par une à choix multiple, correction immédiate, et score final.
// Pensé pour le vidéoprojecteur (gros texte, fort contraste) et l'usage solo.
import { useState } from "react";
import {
  CATEGORIES_QUIZ,
  questionsDe,
  type CategorieQuiz,
  type QuestionQuiz,
} from "@/data/quiz";
import { couleurBande, couleurBanniere } from "@/lib/couleurs";

type Ecran = "categories" | "quiz" | "resultat";

export default function QuizCulture() {
  const [ecran, setEcran] = useState<Ecran>("categories");
  const [categorie, setCategorie] = useState<CategorieQuiz | null>(null);
  const [questions, setQuestions] = useState<QuestionQuiz[]>([]);
  const [index, setIndex] = useState(0);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  function demarrer(cat: CategorieQuiz) {
    setCategorie(cat);
    setQuestions(questionsDe(cat));
    setIndex(0);
    setChoisi(null);
    setScore(0);
    setEcran("quiz");
  }

  function repondre(i: number) {
    if (choisi !== null) return; // on ne répond qu'une fois
    setChoisi(i);
    if (i === questions[index].bonneReponse) setScore((s) => s + 1);
  }

  function suivante() {
    if (index + 1 < questions.length) {
      setIndex((x) => x + 1);
      setChoisi(null);
    } else {
      setEcran("resultat");
    }
  }

  function recommencer() {
    if (categorie) demarrer(categorie);
  }

  function reinitialiser() {
    setEcran("categories");
    setCategorie(null);
    setQuestions([]);
    setIndex(0);
    setChoisi(null);
    setScore(0);
  }

  // ---------- Écran : choix des thèmes ----------
  if (ecran === "categories") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-5 text-center text-2xl font-bold text-slate-800 dark:text-slate-100">
          Choisis un thème
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES_QUIZ.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => demarrer(c.slug)}
              className="group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-sm transition group-hover:scale-105 ${couleurBande(c.couleur)}`}
                aria-hidden="true"
              >
                {c.icone}
              </span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{c.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{c.description}</span>
              <span className={`mt-1 h-1.5 w-10 rounded-full ${couleurBanniere(c.couleur)}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Écran : résultat ----------
  if (ecran === "resultat") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xl font-semibold text-slate-500 dark:text-slate-400">Ton score</p>
        <p className="my-3 text-6xl font-extrabold text-principal">
          {score} / {questions.length}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={recommencer}
            className="rounded-2xl bg-principal px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Recommencer
          </button>
          <button
            type="button"
            onClick={reinitialiser}
            className="rounded-2xl bg-white px-6 py-3 text-lg font-bold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-600"
          >
            Choisir une autre catégorie
          </button>
        </div>
      </div>
    );
  }

  // ---------- Écran : quiz ----------
  const q = questions[index];
  const repondu = choisi !== null;

  function styleChoix(i: number): string {
    const estBonne = i === q.bonneReponse;
    const estChoisi = i === choisi;
    if (!repondu)
      return "bg-white text-slate-800 ring-1 ring-slate-200 hover:border-principal hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-600";
    if (estBonne) return "bg-emerald-500 text-white ring-1 ring-emerald-500";
    if (estChoisi) return "bg-red-500 text-white ring-1 ring-red-500";
    return "bg-white text-slate-400 ring-1 ring-slate-200 opacity-70 dark:bg-slate-700 dark:text-slate-500 dark:ring-slate-600";
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-500 dark:text-slate-400">
          Question {index + 1} / {questions.length}
        </span>
        <button
          type="button"
          onClick={reinitialiser}
          className="rounded-full px-3 py-1 font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-400 dark:ring-slate-600 dark:hover:bg-slate-700"
        >
          Réinitialiser
        </button>
      </div>

      <h2 className="text-2xl font-bold leading-snug text-slate-800 sm:text-3xl dark:text-slate-100">
        {q.question}
      </h2>

      <div className="mt-5 flex flex-col gap-3">
        {q.choix.map((choix, i) => (
          <button
            key={i}
            type="button"
            onClick={() => repondre(i)}
            disabled={repondu}
            className={`rounded-2xl px-5 py-4 text-left text-lg font-semibold transition disabled:cursor-default sm:text-xl ${styleChoix(i)}`}
          >
            {choix}
          </button>
        ))}
      </div>

      {repondu && q.explication && (
        <p className="mt-4 rounded-2xl bg-principal-clair p-4 text-base text-slate-700 dark:bg-principal/15 dark:text-slate-200">
          💡 {q.explication}
        </p>
      )}

      {repondu && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={suivante}
            className="rounded-2xl bg-principal px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            {index + 1 < questions.length ? "Question suivante →" : "Voir le résultat"}
          </button>
        </div>
      )}
    </div>
  );
}
