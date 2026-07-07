"use client";

// Envoi du résultat d'une évaluation Conjugaison vers le carnet de notes.
// Ouvert depuis le suivi d'évaluation. Étapes dans une seule fenêtre :
//   1. destination (classe issue de la session, matière, trimestre, nom, date,
//      pondération — barème /20 fixe car c'est la note de l'évaluation) ;
//   2. appariement copie → élève officiel (auto par prénom, ajustable) ;
//   3. absents (élèves sans copie) ; confirmation.
// Rien n'est importé tant que l'appariement n'est pas confirmé. Une session déjà
// importée est signalée (anti-doublon) au lieu de créer une 2e tâche en silence.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apparierCopies } from "@/lib/appariement";
import type { Matiere } from "@/lib/carnet";
import type {
  CopieAImporter,
  Doublon,
  PreparationImport,
} from "@/lib/import-carnet-types";

type Eleve = { id: string; nom: string };
type Classe = { id: string; nom: string; eleves: Eleve[] };

const NE_PAS_IMPORTER = "";

export default function EnvoiVersCarnet({
  code,
  onFerme,
}: {
  code: string;
  onFerme: () => void;
}) {
  const [prep, setPrep] = useState<PreparationImport | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [chargement, setChargement] = useState(true);

  const [classeId, setClasseId] = useState("");
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [matiereId, setMatiereId] = useState("");
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
  const [trimestre, setTrimestre] = useState(1);
  const [nom, setNom] = useState("");
  const [dateISO, setDateISO] = useState("");
  const [ponderation, setPonderation] = useState("1");

  // Choix manuels du prof : submissionId → eleveId ("" = ne pas importer).
  // Priment sur l'appariement automatique (dérivé plus bas).
  const [override, setOverride] = useState<Record<string, string>>({});
  // Élèves sans copie explicitement retirés des absents (décochés).
  const [absentsExclus, setAbsentsExclus] = useState<Set<string>>(new Set());

  const [forcer, setForcer] = useState(false);
  const [doublon, setDoublon] = useState<Doublon | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState<{ nbNotes: number; nbAbsents: number } | null>(
    null,
  );

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFerme();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFerme]);

  // Chargement : préparation (session + copies + notes) et classes du prof.
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const [rp, rc] = await Promise.all([
          fetch(`/api/evaluations/${encodeURIComponent(code)}/carnet`),
          fetch("/api/classes"),
        ]);
        if (!actif) return;
        const dp = (await rp.json().catch(() => null)) as {
          preparation?: PreparationImport;
          erreur?: string;
        } | null;
        const dc = (await rc.json().catch(() => null)) as { classes?: Classe[] } | null;
        if (!rp.ok || !dp?.preparation) {
          setErreur(dp?.erreur ?? "Impossible de préparer l'envoi.");
          return;
        }
        const p = dp.preparation;
        const cs = dc?.classes ?? [];
        setPrep(p);
        setClasses(cs);
        const lie = p.session.classeId && cs.some((c) => c.id === p.session.classeId);
        setClasseId(lie ? (p.session.classeId as string) : (cs[0]?.id ?? ""));
        setTrimestre(p.trimestreSuggere);
        setNom(p.session.name);
        setDateISO(
          /^\d{4}-\d{2}-\d{2}$/.test(p.session.date) ? p.session.date : "",
        );
        setDoublon(p.dejaImporte);
        if (p.dejaImporte) setForcer(false);
      } catch {
        if (actif) setErreur("Impossible de contacter le serveur.");
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [code]);

  // Matières de la classe sélectionnée.
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
          setMatiereId((prev) => (ms.some((m) => m.id === prev) ? prev : ms[0]?.id ?? ""));
        }
      } catch {
        /* réseau : le prof réessaiera */
      }
    })();
    return () => {
      actif = false;
    };
  }, [classeId]);

  const classe = classes.find((c) => c.id === classeId);
  const eleves = useMemo(() => classe?.eleves ?? [], [classe]);
  const copies = useMemo<CopieAImporter[]>(() => prep?.copies ?? [], [prep]);

  // Appariement automatique (prénom → élève), dérivé de l'état : recalculé si les
  // copies ou les élèves changent. Les choix manuels du prof (override) priment.
  const autoAppariement = useMemo(
    () =>
      apparierCopies(
        copies.map((c) => ({ submissionId: c.submissionId, prenom: c.prenom })),
        eleves,
      ),
    [copies, eleves],
  );
  const attribution = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of copies) {
      const o = override[c.submissionId];
      m[c.submissionId] =
        o !== undefined ? o : autoAppariement[c.submissionId] ?? NE_PAS_IMPORTER;
    }
    return m;
  }, [copies, override, autoAppariement]);

  // Détection de conflits : un même élève choisi pour 2 copies.
  const conflits = useMemo(() => {
    const compte = new Map<string, number>();
    for (const v of Object.values(attribution)) {
      if (v) compte.set(v, (compte.get(v) ?? 0) + 1);
    }
    return new Set([...compte].filter(([, n]) => n > 1).map(([id]) => id));
  }, [attribution]);

  const elevesAttribues = useMemo(
    () => new Set(Object.values(attribution).filter(Boolean)),
    [attribution],
  );
  // Élèves du carnet sans copie → candidats « absent ».
  const sansCopie = useMemo(
    () => eleves.filter((e) => !elevesAttribues.has(e.id)),
    [eleves, elevesAttribues],
  );
  const absents = sansCopie.filter((e) => !absentsExclus.has(e.id)).map((e) => e.id);
  const nbAImporter = elevesAttribues.size;

  async function ajouterMatiere() {
    const nomM = nouvelleMatiere.trim();
    if (!nomM || !classeId) return;
    try {
      const r = await fetch("/api/ma-classe/matieres", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classeId, nom: nomM }),
      });
      const d = (await r.json().catch(() => null)) as {
        matiere?: Matiere;
        erreur?: string;
      } | null;
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

  async function envoyer() {
    if (envoi) return;
    if (!matiereId) return setErreur("Choisis une matière.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return setErreur("Choisis une date.");
    if (nbAImporter === 0) return setErreur("Associe au moins une copie à un élève.");
    if (conflits.size > 0) {
      return setErreur("Deux copies visent le même élève : corrige l'appariement.");
    }
    const pond = Number(ponderation.replace(",", "."));
    if (!(pond >= 0)) return setErreur("Pondération invalide.");

    const attributions = copies
      .filter((c) => attribution[c.submissionId])
      .map((c) => ({ submissionId: c.submissionId, eleveId: attribution[c.submissionId] }));

    setEnvoi(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/evaluations/${encodeURIComponent(code)}/carnet`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matiereId,
          trimestre,
          dateISO,
          nom: nom.trim() || `Évaluation ${dateISO}`,
          ponderation: pond,
          attributions,
          absents,
          forcer,
        }),
      });
      const d = (await r.json().catch(() => null)) as {
        ok?: boolean;
        nbNotes?: number;
        nbAbsents?: number;
        erreur?: string;
        doublon?: Doublon | null;
      } | null;
      if (r.ok && d?.ok) {
        setSucces({ nbNotes: d.nbNotes ?? 0, nbAbsents: d.nbAbsents ?? 0 });
      } else if (d?.doublon) {
        setDoublon(d.doublon);
        setForcer(false);
        setErreur("Cette évaluation a déjà été importée dans le carnet.");
      } else {
        setErreur(d?.erreur ?? "Échec de l'envoi.");
      }
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  // --- Styles partagés (tokens du projet) ---
  const label = "flex flex-col gap-1 text-sm font-medium text-encre-douce";
  const champ =
    "rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
  const selectCl =
    "rounded-full border border-ligne bg-surface px-4 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  const matiereNom = matieres.find((m) => m.id === matiereId)?.nom ?? "";
  const sessionLie =
    !!prep?.session.classeId && classes.some((c) => c.id === prep.session.classeId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onFerme}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Envoyer vers le carnet de notes"
        className="my-6 w-full max-w-2xl rounded-carte border border-ligne bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-titre text-xl font-bold text-encre">
              Envoyer vers le carnet de notes
            </h2>
            {prep && (
              <p className="mt-0.5 text-sm text-encre-douce">
                {prep.session.name} · {copies.length} copie
                {copies.length > 1 ? "s" : ""} · note /{prep.bareme}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFerme}
            aria-label="Fermer"
            className="rounded-full px-2 py-1 text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            ✕
          </button>
        </div>

        {chargement ? (
          <p className="mt-6 text-sm text-encre-douce">Chargement…</p>
        ) : succes ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-carte bg-emerald-100 p-4 text-sm text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
              <p className="font-semibold">Envoyé dans le carnet ✓</p>
              <p className="mt-1">
                {succes.nbNotes} note{succes.nbNotes > 1 ? "s" : ""}
                {succes.nbAbsents > 0
                  ? ` · ${succes.nbAbsents} absent${succes.nbAbsents > 1 ? "s" : ""}`
                  : ""}{" "}
                dans <strong>{matiereNom}</strong> · T{trimestre}.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/ma-classe/notes"
                className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Voir le carnet
              </Link>
              <button
                type="button"
                onClick={onFerme}
                className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : !prep ? (
          <p className="mt-6 text-sm font-medium text-rose-600 dark:text-rose-400">
            {erreur ?? "Évaluation introuvable."}
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            {/* Avertissement anti-doublon */}
            {doublon && (
              <div className="rounded-carte border border-amber-300 bg-amber-100 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100">
                <p className="font-semibold">Déjà importée</p>
                <p className="mt-1">
                  Cette évaluation a déjà été envoyée (tâche «&nbsp;{doublon.nom}&nbsp;»
                  dans {doublon.matiereNom}). Évite de créer un doublon.
                </p>
                <label className="mt-2 flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={forcer}
                    onChange={(e) => setForcer(e.target.checked)}
                    className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
                  />
                  Créer quand même une 2<sup>e</sup> tâche
                </label>
              </div>
            )}

            {classes.length === 0 && (
              <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
                Aucune classe. Crée d&apos;abord une classe et ses élèves dans{" "}
                <Link href="/classe" className="font-semibold text-principal underline">
                  Mes classes
                </Link>
                .
              </p>
            )}

            {/* Destination */}
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-encre-douce">
                Destination
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className={label}>
                  Classe
                  {sessionLie ? (
                    <span className="rounded-full border border-ligne bg-fond px-4 py-1.5 text-sm font-semibold text-encre">
                      {classe?.nom ?? prep.session.classeNom}
                    </span>
                  ) : (
                    <select
                      value={classeId}
                      onChange={(e) => {
                        setClasseId(e.target.value);
                        setOverride({});
                        setAbsentsExclus(new Set());
                      }}
                      className={selectCl}
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <label className={label}>
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

                <div className={label}>
                  Trimestre
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
              </div>

              {/* Création rapide de matière si besoin */}
              {classeId && matieres.length === 0 && (
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
                    placeholder="Nouvelle matière (ex. Français)"
                    className={champ}
                  />
                  <button
                    type="button"
                    onClick={ajouterMatiere}
                    className="rounded-full bg-encre px-4 py-1.5 text-sm font-semibold text-fond transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    + Matière
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-3">
                <label className={`${label} min-w-[14rem] flex-1`}>
                  Nom de la tâche
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={champ}
                  />
                </label>
                <label className={label}>
                  Date
                  <input
                    type="date"
                    value={dateISO}
                    onChange={(e) => setDateISO(e.target.value)}
                    className={champ}
                  />
                </label>
                <label className={label}>
                  Barème
                  <span className="rounded-moyen border border-ligne bg-fond px-3 py-1.5 text-sm font-semibold text-encre">
                    /{prep.bareme}
                  </span>
                </label>
                <label className={label}>
                  Pondération
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={ponderation}
                    onChange={(e) => setPonderation(e.target.value)}
                    className={`${champ} w-24`}
                  />
                </label>
              </div>
            </section>

            {/* Appariement copies → élèves */}
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-encre-douce">
                Appariement des copies
              </h3>
              {copies.length === 0 ? (
                <p className="rounded-carte border border-dashed border-ligne p-4 text-sm text-encre-douce">
                  Aucune copie reçue pour cette évaluation.
                </p>
              ) : eleves.length === 0 ? (
                <p className="rounded-carte border border-dashed border-ligne p-4 text-sm text-encre-douce">
                  La classe sélectionnée n&apos;a pas d&apos;élèves. Ajoute-les dans{" "}
                  <Link href="/classe" className="font-semibold text-principal underline">
                    Mes classes
                  </Link>
                  .
                </p>
              ) : (
                <div className="overflow-hidden rounded-carte border border-ligne">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-fond text-left">
                        <th className="px-3 py-2 font-semibold text-encre">Copie</th>
                        <th className="px-3 py-2 font-semibold text-encre">Note</th>
                        <th className="px-3 py-2 font-semibold text-encre">
                          Élève du carnet
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {copies.map((c) => {
                        const val = attribution[c.submissionId] ?? NE_PAS_IMPORTER;
                        const enConflit = !!val && conflits.has(val);
                        return (
                          <tr key={c.submissionId} className="border-t border-ligne">
                            <td className="px-3 py-1.5 font-medium text-encre">
                              {c.prenom}
                            </td>
                            <td className="px-3 py-1.5 font-bold text-principal">
                              {c.note}/{prep.bareme}
                            </td>
                            <td className="px-3 py-1.5">
                              <select
                                value={val}
                                onChange={(e) =>
                                  setOverride((prev) => ({
                                    ...prev,
                                    [c.submissionId]: e.target.value,
                                  }))
                                }
                                aria-label={`Élève pour la copie de ${c.prenom}`}
                                className={`w-full rounded-moyen border bg-surface px-2 py-1 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                                  enConflit
                                    ? "border-rose-500 ring-1 ring-rose-500"
                                    : "border-ligne"
                                }`}
                              >
                                <option value={NE_PAS_IMPORTER}>
                                  — Ne pas importer —
                                </option>
                                {eleves.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.nom}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {conflits.size > 0 && (
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                  Un même élève est associé à plusieurs copies (en rouge). Corrige avant
                  d&apos;envoyer.
                </p>
              )}
            </section>

            {/* Absents (élèves sans copie) */}
            {eleves.length > 0 && sansCopie.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-encre-douce">
                  Élèves sans copie ({absents.length} compté
                  {absents.length > 1 ? "s" : ""} absent{absents.length > 1 ? "s" : ""})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sansCopie.map((e) => {
                    const absent = !absentsExclus.has(e.id);
                    return (
                      <label
                        key={e.id}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                          absent
                            ? "border-ligne bg-fond text-encre"
                            : "border-dashed border-ligne text-encre-douce"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={absent}
                          onChange={(ev) =>
                            setAbsentsExclus((prev) => {
                              const s = new Set(prev);
                              if (ev.target.checked) s.delete(e.id);
                              else s.add(e.id);
                              return s;
                            })
                          }
                          className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
                        />
                        {e.nom}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-encre-douce">
                  Coché = compté absent (cellule vide, exclu de la moyenne). Décoché =
                  laissé vide, à saisir plus tard.
                </p>
              </section>
            )}

            {erreur && (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {erreur}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onFerme}
                className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={envoyer}
                disabled={
                  envoi ||
                  !matiereId ||
                  nbAImporter === 0 ||
                  conflits.size > 0 ||
                  (!!doublon && !forcer)
                }
                className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
              >
                {envoi
                  ? "Envoi…"
                  : `Envoyer ${nbAImporter} note${nbAImporter > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
