"use client";

// Prépa hebdo : la grille de l'emploi du temps mais pour une SEMAINE DATÉE.
// Chaque cours montre l'état de sa prépa (badge) ; clic → fiche d'édition.
// Navigation semaine précédente / suivante / aujourd'hui. (Grille ré-implémentée
// ici avec les helpers purs — on ne modifie pas le module emploi du temps.)
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CLES_ACCENT, couleurBande } from "@/lib/couleurs";
import { JOURS, enMinutes } from "@/lib/emploi-du-temps";
import { STATUT_INFO, type PrepaCours } from "@/lib/prepa";
import {
  ajouterJours,
  datesSemaine,
  deIso,
  formatSemaine,
  isoDe,
  lundiDe,
} from "@/lib/semaine";
import PrepaFiche, {
  type CibleDuplication,
  type Creneau,
} from "./PrepaFiche";

type Classe = { id: string; nom: string };

const PAS = 15;
const HAUTEUR = 16;
const COLONNES = "3.5rem repeat(5, minmax(6rem, 1fr))";

export default function PrepaHebdo({
  dateInitiale,
  creneauInitial,
}: {
  dateInitiale?: string;
  creneauInitial?: string;
}) {
  const [lundiIso, setLundiIso] = useState<string>(() =>
    dateInitiale ? lundiDe(deIso(dateInitiale)) : lundiDe(new Date()),
  );
  const [todayIso] = useState<string>(() => isoDe(new Date()));
  const [classes, setClasses] = useState<Classe[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [prepas, setPrepas] = useState<PrepaCours[]>([]);
  const [charge, setCharge] = useState(false);
  const [fiche, setFiche] = useState<{ creneau: Creneau; dateISO: string } | null>(
    null,
  );
  const [deepDone, setDeepDone] = useState(false);

  // Trame hebdo (classes + créneaux), chargée une fois.
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const [rc, rk] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/ma-classe/creneaux"),
        ]);
        if (rc.ok && actif) {
          const { classes: cs } = (await rc.json()) as { classes: Classe[] };
          setClasses(cs.map((c) => ({ id: c.id, nom: c.nom })));
        }
        if (rk.ok && actif) {
          const { creneaux: ks } = (await rk.json()) as { creneaux: Creneau[] };
          setCreneaux(ks);
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

  // Prépas de la semaine courante + suivante (pour badges et duplication).
  useEffect(() => {
    let actif = true;
    (async () => {
      const au = ajouterJours(lundiIso, 11);
      try {
        const r = await fetch(`/api/ma-classe/prepas?du=${lundiIso}&au=${au}`);
        if (r.ok && actif) {
          const { prepas: ps } = (await r.json()) as { prepas: PrepaCours[] };
          setPrepas(ps);
        }
      } catch {
        /* réseau */
      }
    })();
    return () => {
      actif = false;
    };
  }, [lundiIso]);

  // Ouverture directe d'une fiche (deep-link depuis le dashboard).
  useEffect(() => {
    if (deepDone || !charge || !dateInitiale || !creneauInitial) return;
    const c = creneaux.find((k) => k.id === creneauInitial);
    const ouvrir = () => {
      if (c) setFiche({ creneau: c, dateISO: dateInitiale });
      setDeepDone(true);
    };
    ouvrir();
  }, [deepDone, charge, dateInitiale, creneauInitial, creneaux]);

  const infoClasse = useMemo(() => {
    const m = new Map<string, { nom: string; couleur: string }>();
    classes.forEach((c, i) =>
      m.set(c.id, { nom: c.nom, couleur: CLES_ACCENT[i % CLES_ACCENT.length] }),
    );
    return m;
  }, [classes]);

  const dates = useMemo(() => datesSemaine(lundiIso), [lundiIso]);

  const { minMin, maxMin } = useMemo(() => {
    if (creneaux.length === 0) return { minMin: 8 * 60, maxMin: 17 * 60 };
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of creneaux) {
      lo = Math.min(lo, enMinutes(c.heureDebut));
      hi = Math.max(hi, enMinutes(c.heureFin));
    }
    return { minMin: Math.floor(lo / 60) * 60, maxMin: Math.ceil(hi / 60) * 60 };
  }, [creneaux]);

  const nbLignes = Math.max(1, (maxMin - minMin) / PAS);
  const ligneDe = (min: number) => (min - minMin) / PAS + 1;
  const heures: number[] = [];
  for (let m = minMin; m < maxMin; m += 60) heures.push(m);

  const prepaDe = (creneau: Creneau) =>
    prepas.find(
      (p) => p.creneauId === creneau.id && p.dateISO === dates[creneau.jour - 1],
    ) ?? null;

  // Cibles de duplication : autres cours de cette semaine et de la suivante.
  const ciblesPour = (source: { creneau: Creneau; dateISO: string }): CibleDuplication[] => {
    const out: CibleDuplication[] = [];
    for (const semaine of [lundiIso, ajouterJours(lundiIso, 7)]) {
      const d = datesSemaine(semaine);
      for (const k of creneaux) {
        const dateISO = d[k.jour - 1];
        if (k.id === source.creneau.id && dateISO === source.dateISO) continue;
        const nom = infoClasse.get(k.classeId)?.nom ?? "—";
        const court = `${JOURS[k.jour - 1].slice(0, 3)} ${dateISO.slice(8)}/${dateISO.slice(5, 7)}`;
        out.push({
          creneauId: k.id,
          dateISO,
          label: `${k.matiere || "Cours"} · ${nom} — ${court}`,
          occupe: prepas.some((p) => p.creneauId === k.id && p.dateISO === dateISO),
        });
      }
    }
    return out;
  };

  const btnNav =
    "rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Prépa hebdo
        </h1>
        <p className="text-sm text-encre-douce">
          Attache une préparation à chaque cours de la semaine.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setLundiIso(ajouterJours(lundiIso, -7))} className={btnNav}>
          ← Semaine précédente
        </button>
        <span className="font-titre text-lg font-bold text-encre">
          Semaine du {formatSemaine(lundiIso)}
        </span>
        <button type="button" onClick={() => setLundiIso(ajouterJours(lundiIso, 7))} className={btnNav}>
          Semaine suivante →
        </button>
        <button type="button" onClick={() => setLundiIso(lundiDe(new Date()))} className={btnNav}>
          Aujourd&apos;hui
        </button>
      </div>

      {charge && creneaux.length === 0 && (
        <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
          Ajoute d&apos;abord des cours dans{" "}
          <Link href="/ma-classe/emploi-du-temps" className="font-semibold text-principal underline">
            l&apos;emploi du temps
          </Link>
          .
        </p>
      )}

      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : (
        creneaux.length > 0 && (
          <div className="overflow-x-auto rounded-carte border border-ligne bg-surface p-3">
            {/* En-tête des jours (avec la date) */}
            <div style={{ display: "grid", gridTemplateColumns: COLONNES }}>
              <div />
              {JOURS.map((nom, i) => {
                const actif = dates[i] === todayIso;
                return (
                  <div key={nom} className="px-1 pb-2 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${
                        actif ? "bg-principal text-sur-principal" : "text-encre-douce"
                      }`}
                    >
                      {nom} {dates[i].slice(8)}/{dates[i].slice(5, 7)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grille */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: COLONNES,
                gridTemplateRows: `repeat(${nbLignes}, ${HAUTEUR}px)`,
              }}
            >
              {dates.map(
                (d, i) =>
                  d === todayIso && (
                    <div
                      key={`today-${i}`}
                      aria-hidden="true"
                      className="rounded-moyen bg-principal-clair/50"
                      style={{ gridColumn: i + 2, gridRow: `1 / ${nbLignes + 1}` }}
                    />
                  ),
              )}

              {heures.map((m) => (
                <div
                  key={`h-${m}`}
                  className="pr-1 text-right text-[11px] leading-none text-encre-douce"
                  style={{ gridColumn: 1, gridRow: `${ligneDe(m)} / span 4` }}
                >
                  {String(Math.floor(m / 60)).padStart(2, "0")}:
                  {String(m % 60).padStart(2, "0")}
                </div>
              ))}

              {heures.map((m) =>
                [1, 2, 3, 4, 5].map((jour) => (
                  <div
                    key={`bg-${m}-${jour}`}
                    aria-hidden="true"
                    className="border-t border-ligne/60"
                    style={{ gridColumn: jour + 1, gridRow: `${ligneDe(m)} / span 4` }}
                  />
                )),
              )}

              {creneaux.map((c) => {
                const info = infoClasse.get(c.classeId);
                const prepa = prepaDe(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFiche({ creneau: c, dateISO: dates[c.jour - 1] })}
                    className={`relative z-10 m-px flex flex-col overflow-hidden rounded-moyen p-1.5 text-left leading-tight ring-1 ring-black/5 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${couleurBande(
                      info?.couleur ?? "",
                    )}`}
                    style={{
                      gridColumn: c.jour + 1,
                      gridRow: `${ligneDe(enMinutes(c.heureDebut))} / ${ligneDe(enMinutes(c.heureFin))}`,
                    }}
                  >
                    <span className="truncate text-xs font-bold">
                      {c.matiere || "Cours"}
                    </span>
                    <span className="truncate text-[11px] opacity-90">
                      {info?.nom ?? "—"}
                    </span>
                    {prepa ? (
                      <>
                        <span
                          className={`mt-0.5 inline-block w-fit rounded-full px-1.5 text-[10px] font-semibold ${STATUT_INFO[prepa.statut].badge}`}
                        >
                          {STATUT_INFO[prepa.statut].libelle}
                        </span>
                        {prepa.titre && (
                          <span className="truncate text-[10px] opacity-80">
                            {prepa.titre}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] opacity-70">+ prépa</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}

      {fiche && (
        <PrepaFiche
          key={`${fiche.creneau.id}-${fiche.dateISO}`}
          creneau={fiche.creneau}
          dateISO={fiche.dateISO}
          prepa={prepaDe(fiche.creneau)}
          classeNom={infoClasse.get(fiche.creneau.classeId)?.nom ?? "—"}
          cibles={ciblesPour(fiche)}
          onFerme={() => setFiche(null)}
          onEnregistre={(p) =>
            setPrepas((prev) => {
              const autres = prev.filter(
                (x) => !(x.creneauId === p.creneauId && x.dateISO === p.dateISO),
              );
              return [...autres, p];
            })
          }
        />
      )}
    </div>
  );
}
