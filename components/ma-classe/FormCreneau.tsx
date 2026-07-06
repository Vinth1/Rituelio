"use client";

// Formulaire d'ajout / édition d'un créneau (modale). Saisie clavier rapide des
// heures (input type="time") ; l'heure de fin est pré-remplie à +45 min tant que
// l'utilisateur ne l'a pas ajustée. Le serveur reste l'autorité (chevauchement → 409).
import { useEffect, useState } from "react";
import { JOURS, DUREE_DEFAUT, ajouterMinutes, enMinutes } from "@/lib/emploi-du-temps";

export type Creneau = {
  id: string;
  classeId: string;
  matiere: string;
  jour: number;
  heureDebut: string;
  heureFin: string;
  salle: string | null;
};

type Classe = { id: string; nom: string };

export default function FormCreneau({
  creneau,
  defauts,
  classes,
  matieres,
  onFerme,
  onEnregistre,
}: {
  creneau?: Creneau;
  defauts?: { jour: number; heureDebut: string };
  classes: Classe[];
  matieres: string[];
  onFerme: () => void;
  onEnregistre: () => void;
}) {
  const heureDebutInit = creneau?.heureDebut ?? defauts?.heureDebut ?? "08:00";
  const [classeId, setClasseId] = useState(
    creneau?.classeId ?? classes[0]?.id ?? "",
  );
  const [matiere, setMatiere] = useState(creneau?.matiere ?? "");
  const [jour, setJour] = useState(creneau?.jour ?? defauts?.jour ?? 1);
  const [heureDebut, setHeureDebut] = useState(heureDebutInit);
  const [heureFin, setHeureFin] = useState(
    creneau?.heureFin ?? ajouterMinutes(heureDebutInit, DUREE_DEFAUT),
  );
  const [finModifiee, setFinModifiee] = useState(Boolean(creneau));
  const [salle, setSalle] = useState(creneau?.salle ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Fermeture au clavier (Échap).
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFerme();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFerme]);

  function changerDebut(v: string) {
    setHeureDebut(v);
    if (!finModifiee && v) setHeureFin(ajouterMinutes(v, DUREE_DEFAUT));
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (!classeId) {
      setErreur("Choisis une classe.");
      return;
    }
    if (enMinutes(heureDebut) >= enMinutes(heureFin)) {
      setErreur("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    const corps = { classeId, matiere, jour, heureDebut, heureFin, salle };
    const url = creneau
      ? `/api/ma-classe/creneaux/${creneau.id}`
      : "/api/ma-classe/creneaux";
    try {
      const r = await fetch(url, {
        method: creneau ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      if (r.ok) {
        onEnregistre();
      } else {
        setErreur(data?.erreur ?? "Échec de l'enregistrement.");
      }
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer() {
    if (!creneau || envoi) return;
    setEnvoi(true);
    try {
      const r = await fetch(`/api/ma-classe/creneaux/${creneau.id}`, {
        method: "DELETE",
      });
      if (r.ok) onEnregistre();
      else setErreur("Échec de la suppression.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  const label = "flex flex-col gap-1 text-sm font-medium text-encre-douce";
  const champ =
    "rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFerme}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={creneau ? "Modifier le cours" : "Ajouter un cours"}
        className="w-full max-w-md rounded-carte border border-ligne bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-titre text-xl font-bold text-encre">
          {creneau ? "Modifier le cours" : "Ajouter un cours"}
        </h2>
        <form onSubmit={soumettre} className="mt-4 flex flex-col gap-3">
          <label className={label}>
            Jour
            <select
              value={jour}
              onChange={(e) => setJour(Number(e.target.value))}
              className={champ}
            >
              {JOURS.map((nom, i) => (
                <option key={i} value={i + 1}>
                  {nom}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3">
            <label className={`${label} flex-1`}>
              Début
              <input
                type="time"
                value={heureDebut}
                onChange={(e) => changerDebut(e.target.value)}
                className={champ}
                required
              />
            </label>
            <label className={`${label} flex-1`}>
              Fin
              <input
                type="time"
                value={heureFin}
                onChange={(e) => {
                  setHeureFin(e.target.value);
                  setFinModifiee(true);
                }}
                className={champ}
                required
              />
            </label>
          </div>

          <label className={label}>
            Matière
            <input
              type="text"
              list="liste-matieres"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              placeholder="Français, Science sociale…"
              className={champ}
            />
            <datalist id="liste-matieres">
              {matieres.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          <label className={label}>
            Classe
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className={champ}
            >
              {classes.length === 0 && <option value="">Aucune classe</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>

          <label className={label}>
            Salle (facultatif)
            <input
              type="text"
              value={salle}
              onChange={(e) => setSalle(e.target.value)}
              placeholder="A1, labo…"
              className={champ}
            />
          </label>

          {erreur && (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {erreur}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={envoi}
                className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
              >
                {envoi ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={onFerme}
                className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Annuler
              </button>
            </div>
            {creneau && (
              <button
                type="button"
                onClick={supprimer}
                disabled={envoi}
                className="rounded-full px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
