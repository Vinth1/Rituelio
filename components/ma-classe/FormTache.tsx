"use client";

// Ajout / édition d'une tâche (colonne du carnet) : date, nom, barème, pondération.
import { useEffect, useState } from "react";
import type { Tache } from "@/lib/carnet";

export default function FormTache({
  tache,
  matiereId,
  trimestre,
  onFerme,
  onEnregistre,
  onSupprime,
}: {
  tache?: Tache;
  matiereId: string;
  trimestre: number;
  onFerme: () => void;
  onEnregistre: (t: Tache) => void;
  onSupprime: (id: string) => void;
}) {
  const [dateISO, setDateISO] = useState(tache?.dateISO ?? "");
  const [nom, setNom] = useState(tache?.nom ?? "");
  const [bareme, setBareme] = useState(tache ? String(tache.bareme) : "20");
  const [ponderation, setPonderation] = useState(
    tache ? String(tache.ponderation) : "1",
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFerme();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFerme]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    const bar = Number(bareme.replace(",", "."));
    const pond = Number(ponderation.replace(",", "."));
    if (!nom.trim()) return setErreur("Le nom est requis.");
    if (!(bar > 0)) return setErreur("Le barème doit être supérieur à 0.");
    if (!(pond >= 0)) return setErreur("La pondération doit être positive.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return setErreur("Choisis une date.");
    setEnvoi(true);
    setErreur(null);
    const corps = { matiereId, trimestre, dateISO, nom: nom.trim(), bareme: bar, ponderation: pond };
    const url = tache ? `/api/ma-classe/taches/${tache.id}` : "/api/ma-classe/taches";
    try {
      const r = await fetch(url, {
        method: tache ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = (await r.json().catch(() => null)) as { tache?: Tache; erreur?: string } | null;
      if (r.ok && data?.tache) onEnregistre(data.tache);
      else setErreur(data?.erreur ?? "Échec de l'enregistrement.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer() {
    if (!tache || envoi) return;
    if (!window.confirm("Supprimer cette tâche et toutes ses notes ?")) return;
    setEnvoi(true);
    try {
      const r = await fetch(`/api/ma-classe/taches/${tache.id}`, { method: "DELETE" });
      if (r.ok) onSupprime(tache.id);
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
        aria-label={tache ? "Modifier la tâche" : "Ajouter une tâche"}
        className="w-full max-w-md rounded-carte border border-ligne bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-titre text-xl font-bold text-encre">
          {tache ? "Modifier la tâche" : "Ajouter une tâche"}
        </h2>
        <form onSubmit={soumettre} className="mt-4 flex flex-col gap-3">
          <label className={label}>
            Nom
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Évaluation passé composé"
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
          <div className="flex gap-3">
            <label className={`${label} flex-1`}>
              Barème
              <input
                type="number"
                min={0}
                step="0.5"
                value={bareme}
                onChange={(e) => setBareme(e.target.value)}
                className={champ}
              />
            </label>
            <label className={`${label} flex-1`}>
              Pondération
              <input
                type="number"
                min={0}
                step="0.1"
                value={ponderation}
                onChange={(e) => setPonderation(e.target.value)}
                className={champ}
              />
            </label>
          </div>
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
            {tache && (
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
