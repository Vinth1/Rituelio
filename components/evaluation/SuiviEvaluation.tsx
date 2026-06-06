"use client";

// Suivi + correction d'une évaluation (côté prof). Affiche le code, suit les
// copies qui arrivent (polling toutes les 3 s tant que l'évaluation est ouverte),
// et permet de corriger chaque copie : formes en vert/rouge (auto), contraintes à
// cocher, commentaire, note forcée, et note /20 recalculée. Bouton « Terminer ».
import { useCallback, useEffect, useState } from "react";
import type {
  CopieCorrigee,
  EvaluationPublique,
} from "@/lib/evaluation-types";

export default function SuiviEvaluation({
  code,
  onRetour,
}: {
  code: string;
  onRetour: () => void;
}) {
  const [evaluation, setEvaluation] = useState<EvaluationPublique | null>(null);
  const [status, setStatus] = useState("ouverte");
  const [copies, setCopies] = useState<CopieCorrigee[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouverteId, setOuverteId] = useState<string | null>(null);

  const chargerCopies = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/evaluations/${encodeURIComponent(code)}/copies`,
      );
      if (r.ok) setCopies((await r.json()).copies as CopieCorrigee[]);
    } catch {
      /* réseau momentané : on réessaiera au prochain tick */
    }
  }, [code]);

  // Chargement initial (infos + copies).
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch(`/api/evaluations/${encodeURIComponent(code)}`);
        if (r.ok && actif) {
          const d = (await r.json()) as { evaluation: EvaluationPublique };
          setEvaluation(d.evaluation);
          setStatus(d.evaluation.status);
        }
      } catch {
        /* ignore */
      }
      await chargerCopies();
      if (actif) setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [code, chargerCopies]);

  // Polling tant que l'évaluation est ouverte.
  useEffect(() => {
    if (status !== "ouverte") return;
    const id = setInterval(chargerCopies, 3000);
    return () => clearInterval(id);
  }, [status, chargerCopies]);

  async function patchCopie(id: string, corps: Record<string, unknown>) {
    await fetch(`/api/evaluations/${encodeURIComponent(code)}/copies/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
    });
    await chargerCopies();
  }

  function basculerContrainte(copie: CopieCorrigee, label: string) {
    const valides = copie.contraintes.filter((c) => c.validee).map((c) => c.label);
    const nouvelles = valides.includes(label)
      ? valides.filter((l) => l !== label)
      : [...valides, label];
    patchCopie(copie.id, { contraintesValidees: nouvelles });
  }

  async function terminer() {
    await fetch(`/api/evaluations/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statut: "terminee" }),
    });
    setStatus("terminee");
    await chargerCopies();
  }

  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onRetour} className={btnFantome}>
          <span aria-hidden="true">←</span> Retour
        </button>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            status === "ouverte"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          }`}
        >
          {status === "ouverte" ? "Ouverte" : "Terminée"}
        </span>
      </div>

      {/* Code à donner aux élèves */}
      <div className="mt-4 rounded-2xl bg-principal-clair p-5 text-center dark:bg-principal/15">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Code à donner aux élèves
        </p>
        <p className="my-1 text-5xl font-extrabold tracking-wider text-principal">
          {code}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Les élèves vont sur « Rejoindre une évaluation » et entrent ce code.
        </p>
      </div>

      {/* Barre d'état + terminer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {copies.length} copie{copies.length > 1 ? "s" : ""} reçue
          {copies.length > 1 ? "s" : ""}
          {status === "ouverte" ? " · actualisation automatique" : ""}
        </span>
        {status === "ouverte" && (
          <button
            type="button"
            onClick={terminer}
            className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Terminer cette évaluation
          </button>
        )}
      </div>

      {/* Liste des copies */}
      {chargement ? (
        <p className="mt-6 text-sm text-slate-400">Chargement…</p>
      ) : copies.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          En attente des copies des élèves…
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {copies.map((copie) => {
            const ouverte = ouverteId === copie.id;
            return (
              <div
                key={copie.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                {/* Ligne résumé */}
                <button
                  type="button"
                  onClick={() => setOuverteId(ouverte ? null : copie.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {copie.prenom}
                  </span>
                  <span className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {copie.formesCorrectes}/12 formes
                    </span>
                    <span className="text-xl font-extrabold text-principal">
                      {copie.note}/20
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      {ouverte ? "▲" : "▼"}
                    </span>
                  </span>
                </button>

                {/* Détail / correction */}
                {ouverte && (
                  <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {copie.tableaux.map((tab, ti) => (
                        <div
                          key={ti}
                          className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                        >
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            {tab.verbe.infinitif}{" "}
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                              {tab.verbe.temps} · {tab.verbe.mode}
                            </span>
                          </p>
                          <ul className="mt-2 flex flex-col gap-1 text-sm">
                            {tab.lignes.map((lg, li) => (
                              <li
                                key={li}
                                className={`flex flex-wrap items-center gap-2 rounded px-1 ${
                                  lg.correcte
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                <span className="w-14 shrink-0 text-slate-500 dark:text-slate-400">
                                  {lg.pronom || "—"}
                                </span>
                                <span className="font-semibold">
                                  {lg.forme || "—"}
                                </span>
                                <span aria-hidden="true">
                                  {lg.correcte ? "✓" : "✗"}
                                </span>
                                {!lg.correcte && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    (attendu : {lg.attendue})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Phrase */}
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <span className="font-semibold">Phrase : </span>
                      {copie.phrase ? `« ${copie.phrase} »` : "—"}
                    </p>

                    {/* Contraintes */}
                    {copie.contraintes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Contraintes respectées
                        </p>
                        <div className="mt-1 flex flex-col gap-1">
                          {copie.contraintes.map((c, i) => (
                            <label
                              key={i}
                              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={c.validee}
                                onChange={() => basculerContrainte(copie, c.label)}
                                className="h-4 w-4 rounded border-slate-300 text-principal focus:ring-principal"
                              />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Commentaire + note */}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Commentaire
                        <textarea
                          key={`com-${copie.id}`}
                          defaultValue={copie.commentaire}
                          onBlur={(e) =>
                            patchCopie(copie.id, { commentaire: e.target.value })
                          }
                          rows={2}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Forcer la note /20 (laisser vide = note auto)
                        <input
                          key={`note-${copie.id}`}
                          type="number"
                          min={0}
                          max={20}
                          defaultValue={copie.noteForcee ?? ""}
                          onBlur={(e) =>
                            patchCopie(copie.id, {
                              noteForcee:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </label>
                    </div>

                    <p className="mt-3 text-right text-sm text-slate-600 dark:text-slate-300">
                      Note finale :{" "}
                      <span className="text-xl font-extrabold text-principal">
                        {copie.note}/20
                      </span>{" "}
                      <span className="text-slate-400">
                        (auto {copie.noteAuto}, brut {copie.brut}/{copie.max})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {evaluation && (
        <p className="mt-4 text-center text-xs text-slate-400">
          {evaluation.verbes
            .map((v) => `${v.infinitif} (${v.temps})`)
            .join("  ·  ")}
        </p>
      )}
    </div>
  );
}
