"use client";

// Jeu jouable « Conjugaison — entraînement » (au tableau, mode projection).
// Le prof choisit 2 verbes (verbe + temps + mode), une classe, une date et les
// contraintes de phrase, puis projette 2 tableaux où la classe complète pronom +
// forme des 6 personnes, avec vérification ligne par ligne. Une roue désigne un
// élève au hasard (avec une petite animation). La section « Ma phrase » fait
// produire une phrase utilisant les 2 verbes sous contraintes. La séance terminée
// est enregistrée dans un historique par classe (localStorage).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verbes, type Conjugaison, type Verbe } from "@/data/verbes";
import { contraintesPhrase } from "@/data/contraintes-phrase";
import { type Classe, chargerClasses, nouvelId } from "@/lib/classes";
import {
  type SeanceConj,
  ajouterSeance,
  seancesDeClasse,
} from "@/lib/historique-conjugaison";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "green"; // accent de couleur du rituel « conjugaison »

// Pronoms acceptés pour chaque ligne (gère l'élision « j' » et les variantes).
const PRONOMS_ACCEPTES: string[][] = [
  ["je", "j"],
  ["tu"],
  ["il", "elle", "on"],
  ["nous"],
  ["vous"],
  ["ils", "elles"],
];

type Phase = "menu" | "jeu" | "historique";
type Ligne = { pronom: string; forme: string; valide: boolean | null };
type Partie = { verbe: Verbe; conj: Conjugaison };
type Contrainte = { label: string; validee: boolean };

// Insensible à la casse, aux accents et aux espaces.
function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Pour les pronoms : on enlève en plus tout ce qui n'est pas une lettre (« j' »).
function normaliserPronom(s: string): string {
  return normaliser(s).replace(/[^a-z]/g, "");
}

function lignesVides(): Ligne[] {
  return Array.from({ length: 6 }, () => ({
    pronom: "",
    forme: "",
    valide: null,
  }));
}

function ligneCorrecte(ligne: Ligne, conj: Conjugaison, i: number): boolean {
  const pronomOk = PRONOMS_ACCEPTES[i].includes(normaliserPronom(ligne.pronom));
  const formeOk = normaliser(ligne.forme) === normaliser(conj.formes[i]);
  return pronomOk && formeOk;
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
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="mb-3 text-center">
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {partie.verbe.infinitif}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
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
              className={`flex items-center gap-2 rounded-lg p-1 ${fond}`}
            >
              <input
                type="text"
                value={lg.pronom}
                onChange={(e) => onChange(i, "pronom", e.target.value)}
                placeholder="pronom"
                aria-label={`Pronom ligne ${i + 1}`}
                className="w-20 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <input
                type="text"
                value={lg.forme}
                onChange={(e) => onChange(i, "forme", e.target.value)}
                placeholder="forme conjuguée"
                aria-label={`Forme ligne ${i + 1}`}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => onVerifier(i)}
                aria-label={`Vérifier la ligne ${i + 1}`}
                className={`shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                  lg.valide === true
                    ? "bg-emerald-500 text-white"
                    : "text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700"
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
  const [verbe1Inf, setVerbe1Inf] = useState(verbes[0].infinitif);
  const [conj1Idx, setConj1Idx] = useState(0);
  const [verbe2Inf, setVerbe2Inf] = useState(verbes[1].infinitif);
  const [conj2Idx, setConj2Idx] = useState(0);
  const [classeId, setClasseId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [contraintesChoisies, setContraintesChoisies] = useState<string[]>([]);
  const [nouvelleContrainte, setNouvelleContrainte] = useState("");

  // Communs
  const [classes, setClasses] = useState<Classe[]>([]);
  const [charge, setCharge] = useState(false);
  const [phase, setPhase] = useState<Phase>("menu");

  // Partie en cours
  const [parties, setParties] = useState<Partie[]>([]);
  const [saisies, setSaisies] = useState<Ligne[][]>([]);
  const [eleveRoue, setEleveRoue] = useState<string | null>(null);
  const [roulette, setRoulette] = useState(false);
  const rouleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phrase, setPhrase] = useState("");
  const [phraseCorrigee, setPhraseCorrigee] = useState("");
  const [contraintes, setContraintes] = useState<Contrainte[]>([]);

  // Chargement des classes + date du jour (côté client uniquement).
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseId(initiales[0]?.id ?? null);
    setDate(new Date().toISOString().slice(0, 10));
    setCharge(true);
  }, []);

  // Arrête l'animation de la roue si on quitte le jeu.
  useEffect(() => {
    return () => {
      if (rouleRef.current) clearInterval(rouleRef.current);
    };
  }, []);

  const eleves = classes.find((c) => c.id === classeId)?.eleves ?? [];

  // --- Actions (menu) ---
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
    const v1 = verbes.find((v) => v.infinitif === verbe1Inf) ?? verbes[0];
    const v2 = verbes.find((v) => v.infinitif === verbe2Inf) ?? verbes[0];
    setParties([
      { verbe: v1, conj: v1.conjugaisons[conj1Idx] ?? v1.conjugaisons[0] },
      { verbe: v2, conj: v2.conjugaisons[conj2Idx] ?? v2.conjugaisons[0] },
    ]);
    setSaisies([lignesVides(), lignesVides()]);
    setEleveRoue(null);
    setPhrase("");
    setPhraseCorrigee("");
    setContraintes(contraintesChoisies.map((label) => ({ label, validee: false })));
    setPhase("jeu");
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
    const ok = ligneCorrecte(saisies[t][i], conj, i);
    setSaisies((prev) =>
      prev.map((tab, ti) =>
        ti === t
          ? tab.map((lg, li) => (li === i ? { ...lg, valide: ok } : lg))
          : tab,
      ),
    );
  }

  // Tire un élève au hasard avec une petite animation (les prénoms défilent).
  function lancerRoue() {
    if (eleves.length === 0 || roulette) return;
    setRoulette(true);
    let ticks = 0;
    rouleRef.current = setInterval(() => {
      setEleveRoue(eleves[Math.floor(Math.random() * eleves.length)].nom);
      ticks += 1;
      if (ticks >= 15) {
        if (rouleRef.current) clearInterval(rouleRef.current);
        rouleRef.current = null;
        setRoulette(false);
      }
    }, 80);
  }

  function basculerContrainte(idx: number) {
    setContraintes((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, validee: !c.validee } : c)),
    );
  }

  function reinitialiser() {
    setSaisies([lignesVides(), lignesVides()]);
    setEleveRoue(null);
    setPhrase("");
    setPhraseCorrigee("");
    setContraintes((prev) => prev.map((c) => ({ ...c, validee: false })));
  }

  function terminerSeance() {
    if (!classeId) return;
    const tableaux = parties.map((p, t) => ({
      infinitif: p.verbe.infinitif,
      temps: p.conj.temps,
      mode: p.conj.mode,
      lignes: saisies[t].map((lg, i) => ({
        pronom: lg.pronom,
        forme: lg.forme,
        correcte: ligneCorrecte(lg, p.conj, i),
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
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700";
  const champ =
    "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100";

  // ---------- Écran : menu ----------
  if (phase === "menu") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Conjugaison — entraînement
          </h2>
          <button
            type="button"
            onClick={() => setPhase("historique")}
            className={btnFantome}
          >
            <span aria-hidden="true">📒</span> Historique
          </button>
        </div>

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
          <div className="mt-6 flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {([0, 1] as const).map((slot) => {
                const inf = slot === 0 ? verbe1Inf : verbe2Inf;
                const idx = slot === 0 ? conj1Idx : conj2Idx;
                const v = verbes.find((x) => x.infinitif === inf) ?? verbes[0];
                return (
                  <div
                    key={slot}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Verbe {slot + 1}
                    </p>
                    <select
                      value={inf}
                      onChange={(e) => {
                        if (slot === 0) {
                          setVerbe1Inf(e.target.value);
                          setConj1Idx(0);
                        } else {
                          setVerbe2Inf(e.target.value);
                          setConj2Idx(0);
                        }
                      }}
                      className={`w-full ${champ}`}
                    >
                      {verbes.map((vb) => (
                        <option key={vb.infinitif} value={vb.infinitif}>
                          {vb.infinitif}
                        </option>
                      ))}
                    </select>
                    <select
                      value={idx}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (slot === 0) setConj1Idx(n);
                        else setConj2Idx(n);
                      }}
                      className={`mt-2 w-full ${champ}`}
                    >
                      {v.conjugaisons.map((c, ci) => (
                        <option key={ci} value={ci}>
                          {c.temps} · {c.mode}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
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
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
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
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => retirerContrainteChoisie(i)}
                        aria-label={`Retirer ${c}`}
                        className="text-slate-400 transition hover:text-rose-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={lancer}
              disabled={!classeId}
              className={`${btnPrincipal} self-start`}
            >
              Lancer
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran : historique ----------
  if (phase === "historique") {
    const seances = classeId ? seancesDeClasse(classeId) : [];
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
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
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
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
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucune séance enregistrée pour cette classe.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {seances.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {s.date}
                </p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">
                  {s.tableaux
                    .map((t) => `${t.infinitif} (${t.temps})`)
                    .join("  ·  ")}
                </p>
                {s.contraintesValidees.length > 0 && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Contraintes : {s.contraintesValidees.join(", ")}
                  </p>
                )}
                {s.phraseCorrigee && (
                  <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm italic text-slate-700 dark:bg-slate-900 dark:text-slate-200">
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Conjugaison — entraînement
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
      </div>

      {/* Roue */}
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 ${couleurBande(ACCENT)}`}
      >
        <p
          className={`text-4xl font-extrabold transition ${roulette ? "animate-pulse" : ""}`}
        >
          {eleveRoue ?? "—"}
        </p>
        <button
          type="button"
          onClick={lancerRoue}
          disabled={eleves.length === 0 || roulette}
          className={btnPrincipal}
        >
          <span aria-hidden="true">🎡</span> {roulette ? "…" : "Lancer la roue"}
        </button>
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
      <div className="mt-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Ma phrase</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Une phrase qui utilise les deux verbes.
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <textarea
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            rows={4}
            placeholder="Écris la phrase de la classe…"
            aria-label="Phrase de la classe"
            className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Contraintes
            </p>
            {contraintes.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aucune contrainte choisie (à définir au lancement).
              </p>
            ) : (
              contraintes.map((c, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={c.validee}
                    onChange={() => basculerContrainte(i)}
                    className="h-4 w-4 rounded border-slate-300 text-principal focus:ring-principal"
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
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Phrase corrigée (à recopier)
          </p>
          <textarea
            value={phraseCorrigee}
            onChange={(e) => setPhraseCorrigee(e.target.value)}
            rows={2}
            placeholder="La version validée, en grand pour la recopie…"
            aria-label="Phrase corrigée"
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xl font-semibold text-slate-800 placeholder:text-base placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
