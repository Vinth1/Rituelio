"use client";

// Page élève : rejoindre une évaluation de conjugaison.
// L'élève entre son prénom + le code donné par le prof, remplit les 2 tableaux
// (pronom + forme, AUCUNE validation en direct) et écrit une phrase, puis envoie
// sa copie. Ne reçoit jamais les réponses correctes (correction côté serveur).
import { useState } from "react";

type VerbeRef = { infinitif: string; temps: string; mode: string };
type EvaluationPublique = {
  code: string;
  name: string;
  date: string;
  status: string;
  verbes: VerbeRef[];
  contraintes: string[];
};
type LigneSaisie = { pronom: string; forme: string };
type Phase = "saisie" | "composer" | "envoye";

function lignesVides(): LigneSaisie[] {
  return Array.from({ length: 6 }, () => ({ pronom: "", forme: "" }));
}

export default function RejoindreEvaluation() {
  const [phase, setPhase] = useState<Phase>("saisie");
  const [prenom, setPrenom] = useState("");
  const [code, setCode] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationPublique | null>(null);
  const [saisies, setSaisies] = useState<LigneSaisie[][]>([]);
  const [phrase, setPhrase] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function rejoindre(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const p = prenom.trim();
    if (!p || !c) {
      setErreur("Entre ton prénom et le code.");
      return;
    }
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch(`/api/evaluations/${encodeURIComponent(c)}`);
      if (r.status === 404) {
        setErreur("Code introuvable. Vérifie auprès de ton professeur.");
        return;
      }
      if (!r.ok) {
        setErreur("Une erreur est survenue. Réessaie.");
        return;
      }
      const data = (await r.json()) as { evaluation: EvaluationPublique };
      if (data.evaluation.status !== "ouverte") {
        setErreur("Cette évaluation est terminée.");
        return;
      }
      setEvaluation(data.evaluation);
      setSaisies(data.evaluation.verbes.map(() => lignesVides()));
      setPhrase("");
      setPhase("composer");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setChargement(false);
    }
  }

  function majLigne(t: number, i: number, champ: "pronom" | "forme", val: string) {
    setSaisies((prev) =>
      prev.map((tab, ti) =>
        ti === t
          ? tab.map((lg, li) => (li === i ? { ...lg, [champ]: val } : lg))
          : tab,
      ),
    );
  }

  async function envoyer() {
    if (!evaluation || envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch(
        `/api/evaluations/${encodeURIComponent(evaluation.code)}/copies`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prenom: prenom.trim(),
            tableaux: saisies.map((lignes) => ({ lignes })),
            phrase,
          }),
        },
      );
      if (r.status === 409) {
        setErreur("Cette évaluation est fermée.");
        return;
      }
      if (!r.ok) {
        setErreur("Envoi impossible. Réessaie.");
        return;
      }
      setPhase("envoye");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  const btnPrincipal =
    "rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  // ---------- Écran : copie envoyée ----------
  if (phase === "envoye") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-8 text-center">
        <p className="text-5xl" aria-hidden="true">
          ✅
        </p>
        <h1 className="mt-3 font-titre text-2xl font-bold text-encre">
          Copie envoyée !
        </h1>
        <p className="mt-2 text-encre-douce">
          Ton professeur a bien reçu ta copie. Tu peux fermer la page.
        </p>
      </div>
    );
  }

  // ---------- Écran : saisie prénom + code ----------
  if (phase === "saisie") {
    return (
      <div className="rounded-carte border border-ligne bg-surface p-6">
        <h1 className="font-titre text-2xl font-bold text-encre">
          Rejoindre une évaluation
        </h1>
        <p className="mt-1 text-sm text-encre-douce">
          Entre ton prénom et le code donné par ton professeur.
        </p>
        <form onSubmit={rejoindre} className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
            Prénom
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Ton prénom"
              className="max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
            Code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex. CM1-482"
              autoCapitalize="characters"
              className="max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base font-semibold uppercase tracking-wide text-encre placeholder:font-normal placeholder:normal-case placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
          </label>
          {erreur && (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {erreur}
            </p>
          )}
          <button
            type="submit"
            disabled={chargement}
            className={`${btnPrincipal} self-start`}
          >
            {chargement ? "Connexion…" : "Rejoindre"}
          </button>
        </form>
      </div>
    );
  }

  // ---------- Écran : composer la copie ----------
  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-titre text-2xl font-bold text-encre">
          {evaluation?.name}
        </h1>
        <span className="text-sm text-encre-douce">
          Bonjour {prenom.trim()}
        </span>
      </div>
      <p className="mt-1 text-sm text-encre-douce">
        Complète les tableaux, puis écris ta phrase. Tu pourras tout envoyer à la
        fin.
      </p>

      {/* Tableaux */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {(evaluation?.verbes ?? []).map((v, t) => (
          <div
            key={t}
            className="rounded-carte border border-ligne p-4"
          >
            <div className="mb-3 text-center">
              <p className="text-xl font-bold text-encre">
                {v.infinitif}
              </p>
              <p className="text-sm text-encre-douce">
                {v.temps} · {v.mode}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {(saisies[t] ?? []).map((lg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lg.pronom}
                    onChange={(e) => majLigne(t, i, "pronom", e.target.value)}
                    placeholder="pronom"
                    aria-label={`Pronom ligne ${i + 1} de ${v.infinitif}`}
                    className="w-20 shrink-0 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  />
                  <input
                    type="text"
                    value={lg.forme}
                    onChange={(e) => majLigne(t, i, "forme", e.target.value)}
                    placeholder="forme conjuguée"
                    aria-label={`Forme ligne ${i + 1} de ${v.infinitif}`}
                    className="min-w-0 flex-1 rounded-moyen border border-ligne bg-surface px-2 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ma phrase */}
      <div className="mt-6">
        <h2 className="font-titre font-bold text-encre">Ma phrase</h2>
        <p className="text-sm text-encre-douce">
          Écris une phrase qui utilise les deux verbes.
        </p>
        {(evaluation?.contraintes.length ?? 0) > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-encre-douce">
            {evaluation?.contraintes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          rows={3}
          placeholder="Ta phrase…"
          aria-label="Ta phrase"
          className="mt-2 w-full rounded-carte border border-ligne bg-surface px-3 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
      </div>

      {erreur && (
        <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400">
          {erreur}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={envoyer}
          disabled={envoi}
          className={btnPrincipal}
        >
          {envoi ? "Envoi…" : "Envoyer ma copie"}
        </button>
        <span className="text-xs text-encre-douce">
          Une fois envoyée, tu ne pourras plus la modifier.
        </span>
      </div>
    </div>
  );
}
