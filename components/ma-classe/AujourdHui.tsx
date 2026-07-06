"use client";

// Zone « Aujourd'hui » du tableau de bord : les cours du jour dans l'ordre, avec le
// bouton « Faire l'appel (Vulkan) » à côté du cours en cours ou à venir, et une case
// « appel fait » par cours (aide-mémoire local, remise à zéro chaque jour).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CLES_ACCENT, couleurBande } from "@/lib/couleurs";
import { enMinutes, jourCourant } from "@/lib/emploi-du-temps";
import { STATUT_INFO, type StatutPrepa } from "@/lib/prepa";
import { isoDe } from "@/lib/semaine";

type Creneau = {
  id: string;
  classeId: string;
  matiere: string;
  jour: number;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
};
type Classe = { id: string; nom: string };

// URL ouvrable = schéma http/https (évite d'ouvrir un lien vide ou dangereux).
const ouvrable = (u: string) => /^https?:\/\//i.test(u.trim());

function cleDuJour(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `rituelio.appel-fait.${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function AujourdHui({
  creneaux,
  classes,
  urlVulkan,
  prepas,
}: {
  creneaux: Creneau[];
  classes: Classe[];
  urlVulkan: string;
  prepas: { creneauId: string; statut: StatutPrepa }[];
}) {
  const [jourNow, setJourNow] = useState<number | null>(null);
  const [minNow, setMinNow] = useState(0);
  const [cle, setCle] = useState("");
  const [faits, setFaits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const majHeure = () => {
      const d = new Date();
      setJourNow(jourCourant(d));
      setMinNow(d.getHours() * 60 + d.getMinutes());
    };
    const chargerFaits = () => {
      const k = cleDuJour(new Date());
      setCle(k);
      try {
        const brut = localStorage.getItem(k);
        if (brut) setFaits(new Set(JSON.parse(brut) as string[]));
      } catch {
        /* ignore */
      }
    };
    majHeure();
    chargerFaits();
    const t = setInterval(majHeure, 60000);
    return () => clearInterval(t);
  }, []);

  const couleurDe = useMemo(() => {
    const m = new Map<string, { nom: string; couleur: string }>();
    classes.forEach((c, i) =>
      m.set(c.id, { nom: c.nom, couleur: CLES_ACCENT[i % CLES_ACCENT.length] }),
    );
    return m;
  }, [classes]);

  const cours = useMemo(
    () =>
      creneaux
        .filter((c) => c.jour === jourNow)
        .sort((a, b) => enMinutes(a.heureDebut) - enMinutes(b.heureDebut)),
    [creneaux, jourNow],
  );

  const statutParCreneau = useMemo(() => {
    const m = new Map<string, StatutPrepa>();
    prepas.forEach((p) => m.set(p.creneauId, p.statut));
    return m;
  }, [prepas]);
  const todayISO = isoDe(new Date());

  // Cours à « pointer » : celui en cours, sinon le prochain à venir.
  const idActif = useMemo(() => {
    const enCours = cours.find(
      (c) => minNow >= enMinutes(c.heureDebut) && minNow < enMinutes(c.heureFin),
    );
    if (enCours) return enCours.id;
    const suivant = cours.find((c) => enMinutes(c.heureDebut) > minNow);
    return suivant?.id ?? null;
  }, [cours, minNow]);

  function basculer(id: string) {
    const n = new Set(faits);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setFaits(n);
    try {
      if (cle) localStorage.setItem(cle, JSON.stringify([...n]));
    } catch {
      /* ignore */
    }
  }

  if (jourNow === null) {
    return (
      <div className="mt-4 rounded-moyen border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
        Pas de cours le week-end. Bon repos&nbsp;!
      </div>
    );
  }

  if (cours.length === 0) {
    return (
      <div className="mt-4 rounded-moyen border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
        <p>Aucun cours aujourd&apos;hui.</p>
        <div className="mt-3">
          <Link
            href="/ma-classe/emploi-du-temps"
            className="inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Emploi du temps <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {cours.map((c) => {
        const info = couleurDe.get(c.classeId);
        const actif = c.id === idActif;
        const fait = faits.has(c.id);
        const statut = statutParCreneau.get(c.id);
        const badgePrepa = statut
          ? STATUT_INFO[statut].badge
          : "bg-fond text-encre-douce ring-1 ring-ligne";
        const libellePrepa = statut ? STATUT_INFO[statut].libelle : "À préparer";
        return (
          <li
            key={c.id}
            className={`flex flex-wrap items-center gap-3 rounded-moyen border p-2.5 ${
              actif ? "border-principal ring-1 ring-principal" : "border-ligne"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-8 w-1.5 shrink-0 rounded-full ${couleurBande(info?.couleur ?? "")}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-encre">
                {c.matiere || "Cours"} · {info?.nom ?? "—"}
              </p>
              <p className="text-xs text-encre-douce">
                {c.heureDebut}–{c.heureFin}
                {c.salle ? ` · ${c.salle}` : ""}
              </p>
            </div>
            <Link
              href={`/ma-classe/prepa?date=${todayISO}&creneau=${c.id}`}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${badgePrepa}`}
              title="Voir ou créer la prépa"
            >
              {libellePrepa}
            </Link>
            {actif &&
              (ouvrable(urlVulkan) ? (
                <a
                  href={urlVulkan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-principal px-3 py-1.5 text-xs font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  📋 Faire l&apos;appel
                </a>
              ) : (
                <Link
                  href="/ma-classe/reglages"
                  className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  📋 Appel — à configurer
                </Link>
              ))}
            <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-encre-douce">
              <input
                type="checkbox"
                checked={fait}
                onChange={() => basculer(c.id)}
                className="h-4 w-4 rounded border-ligne text-principal focus:ring-principal"
              />
              appel fait
            </label>
          </li>
        );
      })}
    </ul>
  );
}
