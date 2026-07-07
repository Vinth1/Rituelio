"use client";

// Carnet de notes : navigation classe → matière → trimestre, puis tableau
// élèves × tâches. Saisie clavier fluide (inputs non contrôlés, tabulation), % et
// grade (échelle ITSW) recalculés en direct, colonne moyenne par élève. Absent =
// cellule vide + commentaire « absent », exclu du calcul (pas compté 0).
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  arrondi1,
  gradeITSW,
  moyenneTrimestre,
  pourcentage,
  type Matiere,
  type NoteEleve,
  type Tache,
} from "@/lib/carnet";
import FormTache from "./FormTache";

type Eleve = { id: string; nom: string };
type Classe = { id: string; nom: string; eleves: Eleve[] };
type ValeurNote = { points: number | null; commentaire: string };

function parsePoints(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function CarnetNotes() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState("");
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [matiereId, setMatiereId] = useState("");
  const [trimestre, setTrimestre] = useState(1);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [notes, setNotes] = useState<Map<string, ValeurNote>>(new Map());
  const [charge, setCharge] = useState(false);
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
  const [formTache, setFormTache] = useState<{ tache?: Tache } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const cle = (tId: string, eId: string) => `${tId}:${eId}`;

  // Classes (une fois).
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch("/api/classes");
        if (r.ok && actif) {
          const { classes: cs } = (await r.json()) as { classes: Classe[] };
          setClasses(cs);
          if (cs[0]) setClasseId(cs[0].id);
        }
      } catch {
        /* réseau */
      } finally {
        if (actif) setCharge(true);
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  // Matières de la classe.
  useEffect(() => {
    let actif = true;
    (async () => {
      if (!classeId) {
        if (actif) {
          setMatieres([]);
          setMatiereId("");
        }
        return;
      }
      try {
        const r = await fetch(`/api/ma-classe/matieres?classeId=${classeId}`);
        if (r.ok && actif) {
          const { matieres: ms } = (await r.json()) as { matieres: Matiere[] };
          setMatieres(ms);
          setMatiereId(ms[0]?.id ?? "");
        }
      } catch {
        /* réseau */
      }
    })();
    return () => {
      actif = false;
    };
  }, [classeId]);

  // Carnet (tâches + notes) de la matière + trimestre.
  useEffect(() => {
    let actif = true;
    (async () => {
      if (!matiereId) {
        if (actif) {
          setTaches([]);
          setNotes(new Map());
        }
        return;
      }
      try {
        const r = await fetch(
          `/api/ma-classe/carnet?matiereId=${matiereId}&trimestre=${trimestre}`,
        );
        if (!r.ok || !actif) return;
        const { taches: ts, notes: ns } = (await r.json()) as {
          taches: Tache[];
          notes: NoteEleve[];
        };
        const m = new Map<string, ValeurNote>();
        for (const n of ns) {
          m.set(`${n.tacheId}:${n.eleveId}`, {
            points: n.points,
            commentaire: n.commentaire,
          });
        }
        setTaches(ts);
        setNotes(m);
      } catch {
        /* réseau */
      }
    })();
    return () => {
      actif = false;
    };
  }, [matiereId, trimestre]);

  const classe = classes.find((c) => c.id === classeId);
  const eleves = classe?.eleves ?? [];
  const sommePond = taches.reduce((s, t) => s + t.ponderation, 0);
  const pondOK = taches.length === 0 || Math.abs(sommePond - 1) < 0.001;

  function majNote(tId: string, eId: string, patch: Partial<ValeurNote>) {
    setNotes((prev) => {
      const m = new Map(prev);
      const k = cle(tId, eId);
      const cur = m.get(k) ?? { points: null, commentaire: "" };
      m.set(k, { ...cur, ...patch });
      return m;
    });
  }

  async function saveNote(tId: string, eId: string, v: ValeurNote) {
    try {
      const r = await fetch("/api/ma-classe/notes", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tacheId: tId,
          eleveId: eId,
          points: v.points,
          commentaire: v.commentaire,
        }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => null)) as { erreur?: string } | null;
        setErreur(d?.erreur ?? "Une note n'a pas pu être enregistrée.");
      } else {
        setErreur(null);
      }
    } catch {
      setErreur("Réseau : note non enregistrée.");
    }
  }

  function estAbsent(v: ValeurNote): boolean {
    return v.points === null && v.commentaire.trim().toLowerCase() === "absent";
  }

  function basculerAbsent(tId: string, eId: string) {
    const cur = notes.get(cle(tId, eId)) ?? { points: null, commentaire: "" };
    const suivant: ValeurNote = estAbsent(cur)
      ? { points: null, commentaire: "" }
      : { points: null, commentaire: "absent" };
    majNote(tId, eId, suivant);
    saveNote(tId, eId, suivant);
  }

  async function ajouterMatiere() {
    const nom = nouvelleMatiere.trim();
    if (!nom || !classeId) return;
    try {
      const r = await fetch("/api/ma-classe/matieres", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classeId, nom }),
      });
      const d = (await r.json().catch(() => null)) as { matiere?: Matiere; erreur?: string } | null;
      if (r.ok && d?.matiere) {
        setMatieres((prev) =>
          [...prev, d.matiere as Matiere].sort((a, b) => a.nom.localeCompare(b.nom)),
        );
        setMatiereId(d.matiere.id);
        setNouvelleMatiere("");
      } else {
        setErreur(d?.erreur ?? "Matière non créée.");
      }
    } catch {
      setErreur("Impossible de contacter le serveur.");
    }
  }

  const selectCl =
    "rounded-full border border-ligne bg-surface px-4 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
  const cellInput =
    "w-14 rounded-moyen border border-ligne bg-surface px-1.5 py-1 text-center text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Carnet de notes
        </h1>
        <p className="text-sm text-encre-douce">
          Classe → matière → trimestre. % et note (échelle ITSW) calculés en direct.
        </p>
      </header>

      {charge && classes.length === 0 && (
        <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
          Crée d&apos;abord une classe dans{" "}
          <Link href="/classe" className="font-semibold text-principal underline">
            Mes classes
          </Link>
          .
        </p>
      )}

      {/* Sélecteurs */}
      {classes.length > 0 && (
        <div className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                className={selectCl}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Matière
              <select
                value={matiereId}
                onChange={(e) => setMatiereId(e.target.value)}
                className={selectCl}
                disabled={matieres.length === 0}
              >
                {matieres.length === 0 && <option value="">Aucune matière</option>}
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </label>

            <div
              role="group"
              aria-label="Trimestre"
              className="inline-flex items-center gap-1 rounded-full border border-ligne bg-surface p-1"
            >
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrimestre(t)}
                  aria-pressed={trimestre === t}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    trimestre === t
                      ? "bg-principal text-sur-principal shadow-sm"
                      : "text-encre-douce hover:text-encre"
                  }`}
                >
                  T{t}
                </button>
              ))}
            </div>
          </div>

          {/* Ajout de matière */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nouvelleMatiere}
              onChange={(e) => setNouvelleMatiere(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ajouterMatiere();
                }
              }}
              placeholder="Nouvelle matière (ex. Science sociale)"
              className="rounded-full border border-ligne bg-surface px-4 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            />
            <button
              type="button"
              onClick={ajouterMatiere}
              className="rounded-full bg-encre px-4 py-1.5 text-sm font-semibold text-fond transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              + Matière
            </button>
          </div>
        </div>
      )}

      {erreur && (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{erreur}</p>
      )}

      {/* Tableau */}
      {classes.length > 0 && matiereId && (
        eleves.length === 0 ? (
          <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
            Cette classe n&apos;a pas encore d&apos;élèves. Ajoute-les dans{" "}
            <Link href="/classe" className="font-semibold text-principal underline">
              Mes classes
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Barre d'outils */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormTache({})}
                  className="rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  + Tâche
                </button>
                <a
                  href={`/api/ma-classe/carnet/export?matiereId=${matiereId}&trimestre=${trimestre}`}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  ⬇ Excel — T{trimestre}
                </a>
                <a
                  href={`/api/ma-classe/carnet/export?matiereId=${matiereId}&tout=1`}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  ⬇ Excel — 3 trimestres
                </a>
              </div>
              {taches.length > 0 && (
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    pondOK
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
                  }`}
                >
                  Σ pondérations = {arrondi1(sommePond)}
                  {pondOK ? " ✓" : " ⚠ (devrait être 1)"}
                </span>
              )}
            </div>

            {taches.length === 0 ? (
              <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
                Aucune tâche pour ce trimestre. Ajoute-en une avec « + Tâche ».
              </p>
            ) : (
              <div className="overflow-x-auto rounded-carte border border-ligne">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-fond">
                      <th className="sticky left-0 z-10 bg-fond px-3 py-2 text-left font-semibold text-encre">
                        Élève
                      </th>
                      {taches.map((t) => (
                        <th key={t.id} className="border-l border-ligne px-2 py-2 align-top">
                          <button
                            type="button"
                            onClick={() => setFormTache({ tache: t })}
                            className="flex flex-col items-center gap-0.5 rounded-moyen px-1 py-0.5 text-center transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                            title="Modifier la tâche"
                          >
                            <span className="max-w-[8rem] truncate font-semibold text-encre">
                              {t.nom}
                            </span>
                            <span className="text-[11px] font-normal text-encre-douce">
                              /{t.bareme} · ×{t.ponderation}
                            </span>
                            {t.origine === "rituelio" && (
                              <span
                                className="rounded-full bg-principal-clair px-1.5 py-px text-[10px] font-semibold text-principal"
                                title="Importée depuis une activité Rituelio"
                              >
                                📔 Rituelio
                              </span>
                            )}
                          </button>
                        </th>
                      ))}
                      <th className="border-l border-ligne bg-fond px-3 py-2 font-semibold text-encre">
                        Moyenne
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {eleves.map((e) => {
                      const items = taches.map((t) => ({
                        pct: pourcentage(
                          notes.get(cle(t.id, e.id))?.points ?? null,
                          t.bareme,
                        ),
                        ponderation: t.ponderation,
                      }));
                      const moy = moyenneTrimestre(items);
                      return (
                        <tr key={e.id} className="border-t border-ligne">
                          <th
                            scope="row"
                            className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left font-medium text-encre"
                          >
                            {e.nom}
                          </th>
                          {taches.map((t) => {
                            const v = notes.get(cle(t.id, e.id)) ?? {
                              points: null,
                              commentaire: "",
                            };
                            const absent = estAbsent(v);
                            const p = pourcentage(v.points, t.bareme);
                            const g = gradeITSW(p);
                            return (
                              <td
                                key={t.id}
                                className="border-l border-ligne px-1.5 py-1 text-center"
                              >
                                {absent ? (
                                  <button
                                    type="button"
                                    onClick={() => basculerAbsent(t.id, e.id)}
                                    className="rounded-moyen bg-fond px-2 py-1 text-xs font-medium text-encre-douce ring-1 ring-ligne"
                                    title="Marquer présent"
                                  >
                                    Abs.
                                  </button>
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <input
                                      key={`${t.id}-${e.id}`}
                                      type="number"
                                      inputMode="decimal"
                                      step="0.5"
                                      min={0}
                                      defaultValue={v.points === null ? "" : String(v.points)}
                                      aria-label={`${e.nom} — ${t.nom}`}
                                      onChange={(ev) =>
                                        majNote(t.id, e.id, {
                                          points: parsePoints(ev.target.value),
                                        })
                                      }
                                      onBlur={() => {
                                        const cur = notes.get(cle(t.id, e.id)) ?? {
                                          points: null,
                                          commentaire: "",
                                        };
                                        saveNote(t.id, e.id, cur);
                                      }}
                                      className={cellInput}
                                    />
                                    <span className="text-[10px] leading-none text-encre-douce">
                                      {p === null ? "—" : `${arrondi1(p)}% · ${g}`}
                                    </span>
                                    <button
                                      type="button"
                                      tabIndex={-1}
                                      onClick={() => basculerAbsent(t.id, e.id)}
                                      className="text-[10px] text-encre-douce underline hover:text-encre"
                                    >
                                      absent
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="border-l border-ligne bg-fond px-3 py-1.5 text-center font-semibold text-encre">
                            {moy === null ? "—" : (
                              <span>
                                {arrondi1(moy)}%
                                <span className="ml-1 text-xs font-normal text-encre-douce">
                                  · {gradeITSW(moy)}
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {formTache && matiereId && (
        <FormTache
          tache={formTache.tache}
          matiereId={matiereId}
          trimestre={trimestre}
          onFerme={() => setFormTache(null)}
          onEnregistre={(t) => {
            setTaches((prev) => {
              const autres = prev.filter((x) => x.id !== t.id);
              return [...autres, t].sort((a, b) =>
                a.dateISO.localeCompare(b.dateISO),
              );
            });
            setFormTache(null);
          }}
          onSupprime={(id) => {
            setTaches((prev) => prev.filter((x) => x.id !== id));
            setNotes((prev) => {
              const m = new Map(prev);
              for (const k of [...m.keys()]) if (k.startsWith(`${id}:`)) m.delete(k);
              return m;
            });
            setFormTache(null);
          }}
        />
      )}
    </div>
  );
}
