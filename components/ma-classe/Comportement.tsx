"use client";

// Module Comportement (PR 6) : enregistrement des faits + fiche élève.
// Navigation : classe → (Élèves | Journal). L'onglet Élèves donne la balance de
// chaque élève et ouvre sa fiche (historique + suggestions d'escalade). L'onglet
// Journal liste les faits de la classe, filtrables par type et par période.
// Les conséquences et rappels arriveront en PR 7.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  balance,
  infoType,
  TYPES_FAIT,
  type FaitComportement,
  type TypeFait,
} from "@/lib/comportement";
import { couleurBande } from "@/lib/couleurs";
import FicheEleve from "./FicheEleve";
import FormFait from "./FormFait";

type Eleve = { id: string; nom: string };
type Classe = { id: string; nom: string; eleves: Eleve[] };
type Vue = "eleves" | "journal";

function dateLisible(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export default function Comportement() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeId, setClasseId] = useState("");
  const [faits, setFaits] = useState<FaitComportement[]>([]);
  const [charge, setCharge] = useState(false);
  const [vue, setVue] = useState<Vue>("eleves");
  const [eleveSel, setEleveSel] = useState("");
  const [form, setForm] = useState<{ eleveInitial?: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Filtres du journal.
  const [filtreType, setFiltreType] = useState<TypeFait | "">("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

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

  // Faits de la classe.
  useEffect(() => {
    let actif = true;
    (async () => {
      if (!classeId) {
        if (actif) setFaits([]);
        return;
      }
      try {
        const r = await fetch(`/api/ma-classe/comportement?classeId=${classeId}`);
        if (r.ok && actif) {
          const { faits: fs } = (await r.json()) as { faits: FaitComportement[] };
          setFaits(fs);
        }
      } catch {
        /* réseau */
      }
    })();
    return () => {
      actif = false;
    };
  }, [classeId]);

  const classe = classes.find((c) => c.id === classeId);
  const eleves = useMemo(() => classe?.eleves ?? [], [classe]);
  const nomEleve = useMemo(() => {
    const m = new Map<string, string>();
    eleves.forEach((e) => m.set(e.id, e.nom));
    return m;
  }, [eleves]);

  const faitsParEleve = useMemo(() => {
    const m = new Map<string, FaitComportement[]>();
    for (const f of faits) {
      const arr = m.get(f.eleveId);
      if (arr) arr.push(f);
      else m.set(f.eleveId, [f]);
    }
    return m;
  }, [faits]);

  const journal = useMemo(
    () =>
      faits.filter((f) => {
        if (filtreType && f.type !== filtreType) return false;
        if (dateDebut && f.dateISO < dateDebut) return false;
        if (dateFin && f.dateISO > dateFin) return false;
        return true;
      }),
    [faits, filtreType, dateDebut, dateFin],
  );

  function changerClasse(id: string) {
    setClasseId(id);
    setEleveSel("");
  }

  function surEnregistre(fait: FaitComportement) {
    setFaits((prev) => [fait, ...prev]);
    setForm(null);
    setVue("eleves");
    setEleveSel(fait.eleveId);
  }

  async function supprimer(id: string) {
    setFaits((prev) => prev.filter((f) => f.id !== id));
    try {
      const r = await fetch(`/api/ma-classe/comportement/${id}`, { method: "DELETE" });
      if (!r.ok) setErreur("La suppression a échoué côté serveur.");
    } catch {
      setErreur("Réseau : suppression non confirmée.");
    }
  }

  const selectCl =
    "rounded-full border border-ligne bg-surface px-4 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Comportement
        </h1>
        <p className="text-sm text-encre-douce">
          Faits notables (taxonomie ITSW) et fiche élève. Conséquences et rappels à venir.
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

      {classes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-carte border border-ligne bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Classe
              <select
                value={classeId}
                onChange={(e) => changerClasse(e.target.value)}
                className={selectCl}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>
            <div
              role="group"
              aria-label="Vue"
              className="inline-flex items-center gap-1 rounded-full border border-ligne bg-surface p-1"
            >
              {(["eleves", "journal"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVue(v)}
                  aria-pressed={vue === v}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    vue === v
                      ? "bg-principal text-sur-principal shadow-sm"
                      : "text-encre-douce hover:text-encre"
                  }`}
                >
                  {v === "eleves" ? "Élèves" : "Journal"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm({ eleveInitial: eleveSel || undefined })}
            disabled={eleves.length === 0}
            className="rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Fait
          </button>
        </div>
      )}

      {erreur && (
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{erreur}</p>
      )}

      {classes.length > 0 && eleves.length === 0 && (
        <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
          Cette classe n&apos;a pas encore d&apos;élèves. Ajoute-les dans{" "}
          <Link href="/classe" className="font-semibold text-principal underline">
            Mes classes
          </Link>
          .
        </p>
      )}

      {/* Vue Élèves : grille de balances + fiche de l'élève sélectionné. */}
      {classeId && eleves.length > 0 && vue === "eleves" && (
        <div className="flex flex-col gap-4">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {eleves.map((el) => {
              const fs = faitsParEleve.get(el.id) ?? [];
              const bal = balance(fs);
              const actif = el.id === eleveSel;
              return (
                <li key={el.id}>
                  <button
                    type="button"
                    onClick={() => setEleveSel(actif ? "" : el.id)}
                    aria-pressed={actif}
                    className={`flex w-full items-center justify-between gap-2 rounded-moyen border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                      actif
                        ? "border-principal ring-1 ring-principal"
                        : "border-ligne hover:bg-fond"
                    }`}
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-encre">
                      {el.nom}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        bal > 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                          : bal < 0
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200"
                            : "bg-fond text-encre-douce ring-1 ring-ligne"
                      }`}
                    >
                      {bal > 0 ? `+${bal}` : bal}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {eleveSel && nomEleve.has(eleveSel) && (
            <FicheEleve
              eleve={{ id: eleveSel, nom: nomEleve.get(eleveSel) ?? "" }}
              faits={faitsParEleve.get(eleveSel) ?? []}
              onAjouter={() => setForm({ eleveInitial: eleveSel })}
              onSupprime={supprimer}
            />
          )}
        </div>
      )}

      {/* Vue Journal : faits de la classe, filtrables. */}
      {classeId && eleves.length > 0 && vue === "journal" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-carte border border-ligne bg-surface p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Type
              <select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value as TypeFait | "")}
                className={selectCl}
              >
                <option value="">Tous</option>
                {TYPES_FAIT.map((t) => (
                  <option key={t.cle} value={t.cle}>
                    {t.libelle}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Du
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className={selectCl}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
              Au
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className={selectCl}
              />
            </label>
            {(filtreType || dateDebut || dateFin) && (
              <button
                type="button"
                onClick={() => {
                  setFiltreType("");
                  setDateDebut("");
                  setDateFin("");
                }}
                className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Réinitialiser
              </button>
            )}
            <span className="ml-auto text-sm text-encre-douce">
              {journal.length} fait{journal.length > 1 ? "s" : ""}
            </span>
          </div>

          {journal.length === 0 ? (
            <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
              Aucun fait pour ces filtres.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {journal.map((f) => {
                const info = infoType(f.type);
                return (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-start gap-3 rounded-moyen border border-ligne bg-surface p-3"
                  >
                    <span className="shrink-0 text-xs text-encre-douce">
                      {dateLisible(f.dateISO)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${couleurBande(info.couleur)}`}
                    >
                      {info.libelle}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-encre">
                      {nomEleve.get(f.eleveId) ?? "Élève retiré"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-encre">{f.raison}</p>
                      {f.details && (
                        <p className="mt-0.5 text-xs text-encre-douce">{f.details}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Supprimer ce fait ?")) supprimer(f.id);
                      }}
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      Supprimer
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {form && classeId && (
        <FormFait
          classeId={classeId}
          eleves={eleves}
          eleveInitial={form.eleveInitial}
          onFerme={() => setForm(null)}
          onEnregistre={surEnregistre}
        />
      )}
    </div>
  );
}
