"use client";

// Jeu jouable « Le pendu » (version classique, autonome — sans les classes).
// Le prof saisit un mot MASQUÉ (invisible au vidéoprojecteur) ou en pioche un au
// hasard ; les élèves proposent des lettres via un clavier A–Z à l'écran. Lettre
// trouvée → révélée en vert ; lettre ratée → un demi-cœur en moins (3 cœurs =
// 6 erreurs). Comparaison insensible à la casse et aux accents. État en mémoire.
import { useState } from "react";
import { mots } from "@/data/mots";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "teal"; // accent de couleur du jeu
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// Cœur plein (Heroicons « heart » solide), tracé sur une grille 24×24.
const COEUR_PATH =
  "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z";

type Phase = "saisie" | "jeu";
type EtatCoeur = "plein" | "demi" | "vide";

// Retire les accents et met en majuscule, pour comparer « E » avec é/è/ê…
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

// Un caractère est « devinable » s'il se normalise en une lettre A–Z
// (espaces, traits d'union, apostrophes… ne le sont pas).
function estLettre(c: string): boolean {
  return /^[A-Z]$/.test(normaliser(c));
}

// État des 3 cœurs selon le nombre d'erreurs (chaque erreur = un demi-cœur).
function coeurs(erreurs: number): EtatCoeur[] {
  return [0, 1, 2].map((i) => {
    const restant = Math.max(0, Math.min(2, 6 - erreurs - i * 2));
    return restant === 2 ? "plein" : restant === 1 ? "demi" : "vide";
  });
}

// Un cœur rempli partiellement : un cœur rouge découpé en largeur, posé sur un
// cœur gris (la largeur du calque rouge donne plein / demi / vide).
function Coeur({ etat }: { etat: EtatCoeur }) {
  const largeur = etat === "plein" ? "100%" : etat === "demi" ? "50%" : "0%";
  return (
    <span className="relative inline-block h-8 w-8" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-8 w-8 text-slate-300 dark:text-slate-600"
      >
        <path d={COEUR_PATH} fill="currentColor" />
      </svg>
      <span
        className="absolute left-0 top-0 h-8 overflow-hidden"
        style={{ width: largeur }}
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500">
          <path d={COEUR_PATH} fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export default function Pendu() {
  const [phase, setPhase] = useState<Phase>("saisie");
  const [saisie, setSaisie] = useState("");
  const [mot, setMot] = useState("");
  const [essayees, setEssayees] = useState<string[]>([]);

  // --- Dérivés ---
  const lettresDuMot = new Set(
    Array.from(mot)
      .filter(estLettre)
      .map((c) => normaliser(c)),
  );
  const erreurs = essayees.filter((l) => !lettresDuMot.has(l)).length;
  const perdu = erreurs >= 6;
  const gagne =
    lettresDuMot.size > 0 && [...lettresDuMot].every((l) => essayees.includes(l));
  const termine = perdu || gagne;

  // --- Actions ---
  function lancer(motChoisi: string) {
    const propre = motChoisi.trim();
    if (!propre || !Array.from(propre).some(estLettre)) return;
    setMot(propre);
    setEssayees([]);
    setPhase("jeu");
  }

  function lancerSaisie(e: React.FormEvent) {
    e.preventDefault();
    lancer(saisie);
  }

  function motAuHasard() {
    lancer(mots[Math.floor(Math.random() * mots.length)].mot);
  }

  function essayer(lettre: string) {
    if (termine || essayees.includes(lettre)) return;
    setEssayees((p) => [...p, lettre]);
  }

  function nouveauMot() {
    setPhase("saisie");
    setSaisie("");
    setMot("");
    setEssayees([]);
  }

  // ---------- Phase : saisie du mot ----------
  if (phase === "saisie") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Le pendu
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tape le mot à faire deviner : il restera caché pendant la partie.
        </p>
        <form onSubmit={lancerSaisie} className="mt-4 flex flex-wrap gap-2">
          <input
            type="password"
            autoComplete="off"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Mot à deviner"
            aria-label="Mot à faire deviner"
            className="w-full max-w-xs rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            type="submit"
            className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Lancer
          </button>
          <button
            type="button"
            onClick={motAuHasard}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700"
          >
            <span aria-hidden="true">🎲</span> Mot au hasard
          </button>
        </form>
      </div>
    );
  }

  // ---------- Phase : jeu ----------
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      {/* Vies */}
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${couleurBande(ACCENT)}`}
      >
        <span className="text-sm font-semibold">Vies</span>
        <span
          className="flex gap-1"
          role="img"
          aria-label={`${6 - erreurs} demi-cœurs restants sur 6`}
        >
          {coeurs(erreurs).map((etat, i) => (
            <Coeur key={i} etat={etat} />
          ))}
        </span>
      </div>

      {/* Mot en cases */}
      <div className="mt-6 flex flex-wrap items-end justify-center gap-2">
        {Array.from(mot).map((c, i) => {
          if (!estLettre(c)) {
            return (
              <span
                key={i}
                className="px-1 text-3xl font-bold text-slate-400 dark:text-slate-500"
              >
                {c === " " ? "  " : c}
              </span>
            );
          }
          const trouvee = essayees.includes(normaliser(c));
          const revele = trouvee || perdu;
          const manquee = perdu && !trouvee;
          return (
            <span
              key={i}
              className={`flex h-12 w-9 items-end justify-center border-b-4 pb-1 text-3xl font-bold ${
                manquee
                  ? "border-rose-400 text-rose-500"
                  : "border-slate-400 text-slate-800 dark:border-slate-500 dark:text-slate-100"
              }`}
            >
              {revele ? c : ""}
            </span>
          );
        })}
      </div>

      {/* Message de fin de partie */}
      {gagne && (
        <p className="mt-5 text-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Bravo, mot trouvé !
        </p>
      )}
      {perdu && (
        <p className="mt-5 text-center text-xl font-bold text-rose-600 dark:text-rose-400">
          Perdu ! Le mot était : {mot}
        </p>
      )}

      {/* Clavier A–Z */}
      <div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-9">
        {ALPHABET.map((L) => {
          const essayee = essayees.includes(L);
          const juste = lettresDuMot.has(L);
          let style =
            "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-600";
          if (essayee && juste)
            style = "bg-emerald-500 text-white ring-1 ring-emerald-500";
          else if (essayee && !juste)
            style =
              "bg-slate-100 text-slate-400 line-through ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700";
          return (
            <button
              key={L}
              type="button"
              onClick={() => essayer(L)}
              disabled={essayee || termine}
              className={`rounded-lg py-3 text-lg font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed ${style}`}
            >
              {L}
            </button>
          );
        })}
      </div>

      {/* Nouveau mot */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={nouveauMot}
          className="rounded-2xl bg-principal px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Nouveau mot
        </button>
      </div>
    </div>
  );
}
