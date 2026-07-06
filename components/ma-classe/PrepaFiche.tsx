"use client";

// Fiche de préparation d'un cours (modale). Édition titre/objectifs/déroulé/
// matériel/statut/notes, activités du catalogue (avec « Lancer »), et duplication
// vers un autre cours. Garde anti-perte si on ferme sans enregistrer.
import { useEffect, useMemo, useState } from "react";
import { jeux } from "@/data/jeux";
import { STATUTS, STATUT_INFO, type PrepaCours, type StatutPrepa } from "@/lib/prepa";

export type Creneau = {
  id: string;
  classeId: string;
  matiere: string;
  jour: number;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
};

export type CibleDuplication = {
  creneauId: string;
  dateISO: string;
  label: string;
  occupe: boolean;
};

// Lien de lancement : projection si l'activité a un déroulé (futur), sinon le jeu
// interactif en contexte prof.
function lienActivite(id: string): string {
  const jeu = jeux.find((j) => j.id === id);
  if (jeu && (jeu.deroule?.length ?? 0) > 0) return `/jeux/${id}/projeter`;
  return `/jeux/${id}?espace=prof`;
}

export default function PrepaFiche({
  creneau,
  dateISO,
  prepa,
  classeNom,
  cibles,
  onFerme,
  onEnregistre,
}: {
  creneau: Creneau;
  dateISO: string;
  prepa: PrepaCours | null;
  classeNom: string;
  cibles: CibleDuplication[];
  onFerme: () => void;
  onEnregistre: (p: PrepaCours) => void;
}) {
  const [titre, setTitre] = useState(prepa?.titre ?? "");
  const [objectifs, setObjectifs] = useState(prepa?.objectifs ?? "");
  const [deroule, setDeroule] = useState(prepa?.deroule ?? "");
  const [materiel, setMateriel] = useState(prepa?.materiel ?? "");
  const [statut, setStatut] = useState<StatutPrepa>(prepa?.statut ?? "a-preparer");
  const [notesApres, setNotesApres] = useState(prepa?.notesApres ?? "");
  const [activites, setActivites] = useState<string[]>(prepa?.activitesRituelio ?? []);
  const [recherche, setRecherche] = useState("");
  const [cible, setCible] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // Référence initiale pour détecter les modifications non enregistrées (calculée
  // une fois : le composant est remonté à chaque ouverture de fiche, cf. `key`).
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({
      titre: prepa?.titre ?? "",
      objectifs: prepa?.objectifs ?? "",
      deroule: prepa?.deroule ?? "",
      materiel: prepa?.materiel ?? "",
      statut: prepa?.statut ?? "a-preparer",
      notesApres: prepa?.notesApres ?? "",
      activites: prepa?.activitesRituelio ?? [],
    }),
  );

  const instantane = JSON.stringify({ titre, objectifs, deroule, materiel, statut, notesApres, activites });
  const modifie = instantane !== baseline;

  useEffect(() => {
    if (!modifie) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [modifie]);

  function tenterFermer() {
    if (
      modifie &&
      !window.confirm("Modifications non enregistrées. Fermer sans enregistrer ?")
    ) {
      return;
    }
    onFerme();
  }

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") tenterFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifie]);

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return jeux
      .filter((j) => !activites.includes(j.id))
      .filter((j) => j.titre.toLowerCase().includes(q) || j.categorie.includes(q))
      .slice(0, 6);
  }, [recherche, activites]);

  async function envoyer(
    corps: Record<string, unknown>,
  ): Promise<PrepaCours | null> {
    const r = await fetch("/api/ma-classe/prepas", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
    });
    const data = (await r.json().catch(() => null)) as
      | { prepa?: PrepaCours; erreur?: string }
      | null;
    if (r.ok && data?.prepa) return data.prepa;
    setMessage({ type: "err", texte: data?.erreur ?? "Échec de l'enregistrement." });
    return null;
  }

  async function enregistrer() {
    if (envoi) return;
    if (!titre.trim()) {
      setMessage({ type: "err", texte: "Le titre est requis." });
      return;
    }
    setEnvoi(true);
    setMessage(null);
    try {
      const p = await envoyer({
        creneauId: creneau.id,
        dateISO,
        titre,
        objectifs,
        deroule,
        materiel,
        activitesRituelio: activites,
        statut,
        notesApres,
      });
      if (p) {
        setBaseline(instantane);
        setMessage({ type: "ok", texte: "Prépa enregistrée." });
        onEnregistre(p);
      }
    } catch {
      setMessage({ type: "err", texte: "Impossible de contacter le serveur." });
    } finally {
      setEnvoi(false);
    }
  }

  async function dupliquer() {
    if (envoi || !cible) return;
    const c = cibles.find((x) => `${x.creneauId}|${x.dateISO}` === cible);
    if (!c) return;
    if (c.occupe && !window.confirm("Ce cours a déjà une prépa. La remplacer ?")) {
      return;
    }
    setEnvoi(true);
    setMessage(null);
    try {
      const p = await envoyer({
        creneauId: c.creneauId,
        dateISO: c.dateISO,
        titre,
        objectifs,
        deroule,
        materiel,
        activitesRituelio: activites,
        statut: "a-preparer",
        notesApres: "",
      });
      if (p) {
        setMessage({ type: "ok", texte: `Dupliquée vers « ${c.label} ».` });
        onEnregistre(p);
        setCible("");
      }
    } catch {
      setMessage({ type: "err", texte: "Impossible de contacter le serveur." });
    } finally {
      setEnvoi(false);
    }
  }

  const label = "flex flex-col gap-1 text-sm font-medium text-encre-douce";
  const champ =
    "rounded-moyen border border-ligne bg-surface px-3 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={tenterFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fiche de préparation"
        className="my-4 w-full max-w-2xl rounded-carte border border-ligne bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-titre text-xl font-bold text-encre">
            {creneau.matiere || "Cours"} · {classeNom}
          </h2>
          <span className="text-sm text-encre-douce">
            {dateISO} · {creneau.heureDebut}–{creneau.heureFin}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <label className={label}>
            Titre de la séance
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Le passé composé — séance 3"
              className={champ}
            />
          </label>
          <label className={label}>
            Objectifs
            <textarea
              value={objectifs}
              onChange={(e) => setObjectifs(e.target.value)}
              rows={2}
              className={champ}
            />
          </label>
          <label className={label}>
            Déroulé
            <textarea
              value={deroule}
              onChange={(e) => setDeroule(e.target.value)}
              rows={5}
              placeholder="Étapes du cours…"
              className={champ}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className={`${label} flex-1`}>
              Matériel
              <input
                type="text"
                value={materiel}
                onChange={(e) => setMateriel(e.target.value)}
                className={champ}
              />
            </label>
            <label className={label}>
              Statut
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutPrepa)}
                className={champ}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_INFO[s].libelle}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Activités Rituelio */}
          <div className="rounded-moyen border border-ligne p-3">
            <p className="text-sm font-semibold text-encre">Activités prévues</p>
            {activites.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {activites.map((id) => {
                  const jeu = jeux.find((j) => j.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-moyen bg-fond px-2 py-1.5 text-sm"
                    >
                      <span aria-hidden="true">{jeu?.icone ?? "🎲"}</span>
                      <span className="min-w-0 flex-1 truncate text-encre">
                        {jeu?.titre ?? id}
                      </span>
                      <a
                        href={lienActivite(id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-principal px-3 py-1 text-xs font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                      >
                        Lancer
                      </a>
                      <button
                        type="button"
                        onClick={() => setActivites((a) => a.filter((x) => x !== id))}
                        aria-label={`Retirer ${jeu?.titre ?? id}`}
                        className="rounded-full px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        Retirer
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une activité du catalogue…"
              className={`${champ} mt-2 w-full`}
            />
            {resultats.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1">
                {resultats.map((j) => (
                  <li key={j.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActivites((a) => [...a, j.id]);
                        setRecherche("");
                      }}
                      className="flex w-full items-center gap-2 rounded-moyen px-2 py-1.5 text-left text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                    >
                      <span aria-hidden="true">{j.icone}</span>
                      <span className="truncate">{j.titre}</span>
                      <span className="ml-auto text-xs">+ ajouter</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className={label}>
            Notes après le cours
            <textarea
              value={notesApres}
              onChange={(e) => setNotesApres(e.target.value)}
              rows={2}
              placeholder="Bilan à chaud…"
              className={champ}
            />
          </label>

          {/* Dupliquer */}
          {cibles.length > 0 && (
            <div className="flex flex-wrap items-end gap-2 rounded-moyen border border-dashed border-ligne p-3">
              <label className={`${label} flex-1`}>
                Dupliquer cette prépa vers…
                <select
                  value={cible}
                  onChange={(e) => setCible(e.target.value)}
                  className={champ}
                >
                  <option value="">Choisir un cours…</option>
                  {cibles.map((c) => (
                    <option key={`${c.creneauId}|${c.dateISO}`} value={`${c.creneauId}|${c.dateISO}`}>
                      {c.label}
                      {c.occupe ? " (a déjà une prépa)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={dupliquer}
                disabled={envoi || !cible}
                className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
              >
                Dupliquer
              </button>
            </div>
          )}

          {message && (
            <p
              className={`text-sm font-medium ${
                message.type === "ok"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {message.texte}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi}
              className="rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={tenterFermer}
              className="rounded-full bg-surface px-5 py-2.5 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
