"use client";

// Grille hebdomadaire de l'emploi du temps (colonnes lundi→vendredi, axe vertical
// horaire). Chaque créneau est une carte colorée PAR CLASSE. Ajout par bouton ou
// par clic sur une case vide ; édition/suppression par clic sur un créneau. Le jour
// courant et le cours en cours sont mis en évidence.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CLES_ACCENT, couleurBande } from "@/lib/couleurs";
import { JOURS, enHHMM, enMinutes, jourCourant } from "@/lib/emploi-du-temps";
import FormCreneau, { type Creneau } from "./FormCreneau";

type Classe = { id: string; nom: string };

const PAS = 15; // minutes par ligne de grille
const HAUTEUR = 16; // px par ligne
const COLONNES = "3.5rem repeat(5, minmax(6rem, 1fr))";

export default function EmploiDuTemps() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [charge, setCharge] = useState(false);
  const [formulaire, setFormulaire] = useState<
    { creneau?: Creneau; defauts?: { jour: number; heureDebut: string } } | null
  >(null);
  const [jourNow, setJourNow] = useState<number | null>(null);
  const [minNow, setMinNow] = useState<number | null>(null);

  const charger = useCallback(async () => {
    try {
      const [rc, rk] = await Promise.all([
        fetch("/api/classes"),
        fetch("/api/ma-classe/creneaux"),
      ]);
      if (rc.ok) {
        const { classes: cs } = (await rc.json()) as { classes: Classe[] };
        setClasses(cs.map((c) => ({ id: c.id, nom: c.nom })));
      }
      if (rk.ok) {
        const { creneaux: ks } = (await rk.json()) as { creneaux: Creneau[] };
        setCreneaux(ks);
      }
    } catch {
      /* réseau : réessai en modifiant */
    }
  }, []);

  useEffect(() => {
    let actif = true;
    (async () => {
      await charger();
      if (actif) setCharge(true);
    })();
    return () => {
      actif = false;
    };
  }, [charger]);

  // Jour + heure courants (client), rafraîchis chaque minute.
  useEffect(() => {
    const maj = () => {
      const d = new Date();
      setJourNow(jourCourant(d));
      setMinNow(d.getHours() * 60 + d.getMinutes());
    };
    maj();
    const t = setInterval(maj, 60000);
    return () => clearInterval(t);
  }, []);

  const infoClasse = useMemo(() => {
    const m = new Map<string, { nom: string; couleur: string }>();
    classes.forEach((c, i) =>
      m.set(c.id, { nom: c.nom, couleur: CLES_ACCENT[i % CLES_ACCENT.length] }),
    );
    return m;
  }, [classes]);

  const matieres = useMemo(
    () =>
      Array.from(new Set(creneaux.map((c) => c.matiere).filter(Boolean))).sort(),
    [creneaux],
  );

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

  const enCours = (c: Creneau) =>
    jourNow === c.jour &&
    minNow != null &&
    minNow >= enMinutes(c.heureDebut) &&
    minNow < enMinutes(c.heureFin);

  function fermerEtRecharger() {
    setFormulaire(null);
    charger();
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
            Emploi du temps
          </h1>
          <p className="text-sm text-encre-douce">
            Ta semaine type. Clique une case ou « Ajouter un cours ».
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormulaire({ defauts: { jour: jourNow ?? 1, heureDebut: "08:00" } })}
          className="rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          + Ajouter un cours
        </button>
      </header>

      {charge && classes.length === 0 && (
        <p className="rounded-carte border border-dashed border-ligne bg-fond p-4 text-sm text-encre-douce">
          Crée d&apos;abord une classe dans{" "}
          <Link href="/classe" className="font-semibold text-principal underline">
            Mes classes
          </Link>{" "}
          pour pouvoir y rattacher des cours.
        </p>
      )}

      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : (
        <div className="overflow-x-auto rounded-carte border border-ligne bg-surface p-3">
          {/* En-tête des jours */}
          <div style={{ display: "grid", gridTemplateColumns: COLONNES }}>
            <div />
            {JOURS.map((nom, i) => {
              const actif = jourNow === i + 1;
              return (
                <div key={nom} className="px-1 pb-2 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${
                      actif
                        ? "bg-principal text-sur-principal"
                        : "text-encre-douce"
                    }`}
                  >
                    {nom}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grille horaire */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: COLONNES,
              gridTemplateRows: `repeat(${nbLignes}, ${HAUTEUR}px)`,
            }}
          >
            {/* Surlignage de la colonne du jour */}
            {jourNow != null && (
              <div
                aria-hidden="true"
                className="rounded-moyen bg-principal-clair/50"
                style={{ gridColumn: jourNow + 1, gridRow: `1 / ${nbLignes + 1}` }}
              />
            )}

            {/* Repères horaires (colonne 1) */}
            {heures.map((m) => (
              <div
                key={`h-${m}`}
                className="pr-1 text-right text-[11px] leading-none text-encre-douce"
                style={{ gridColumn: 1, gridRow: `${ligneDe(m)} / span 4` }}
              >
                {enHHMM(m)}
              </div>
            ))}

            {/* Cases vides cliquables (fond, une par heure et par jour) */}
            {heures.map((m) =>
              [1, 2, 3, 4, 5].map((jour) => (
                <button
                  key={`c-${m}-${jour}`}
                  type="button"
                  aria-label={`Ajouter un cours le ${JOURS[jour - 1]} à ${enHHMM(m)}`}
                  onClick={() =>
                    setFormulaire({ defauts: { jour, heureDebut: enHHMM(m) } })
                  }
                  className="border-t border-ligne/60 transition hover:bg-fond focus:outline-none focus-visible:ring-1 focus-visible:ring-principal"
                  style={{ gridColumn: jour + 1, gridRow: `${ligneDe(m)} / span 4` }}
                />
              )),
            )}

            {/* Créneaux */}
            {creneaux.map((c) => {
              const info = infoClasse.get(c.classeId);
              const actif = enCours(c);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFormulaire({ creneau: c })}
                  className={`relative z-10 m-px flex flex-col overflow-hidden rounded-moyen p-1.5 text-left leading-tight ring-1 ring-black/5 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${couleurBande(
                    info?.couleur ?? "",
                  )} ${actif ? "ring-2 ring-principal" : ""}`}
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
                  <span className="truncate text-[10px] opacity-80">
                    {c.heureDebut}–{c.heureFin}
                    {c.salle ? ` · ${c.salle}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {formulaire && (
        <FormCreneau
          creneau={formulaire.creneau}
          defauts={formulaire.defauts}
          classes={classes}
          matieres={matieres}
          onFerme={() => setFormulaire(null)}
          onEnregistre={fermerEtRecharger}
        />
      )}
    </div>
  );
}
