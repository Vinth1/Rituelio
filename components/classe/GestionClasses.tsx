"use client";

// Page de gestion des classes : créer plusieurs classes (pastilles), gérer
// leurs élèves, et enregistrer dans le localStorage via un bouton « Enregistrer »
// (pas de sauvegarde automatique).
import { useEffect, useMemo, useState } from "react";
import {
  type Classe,
  type Eleve,
  chargerClasses,
  enregistrerClasses,
  nouvelId,
} from "@/lib/classes";
import PanneauEleves from "./PanneauEleves";

export default function GestionClasses() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [sauvegarde, setSauvegarde] = useState("[]"); // JSON du dernier état enregistré
  const [charge, setCharge] = useState(false);
  const [nomNouvelleClasse, setNomNouvelleClasse] = useState("");

  // Chargement initial depuis le localStorage (côté client uniquement).
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setSauvegarde(JSON.stringify(initiales));
    setClasseActiveId(initiales[0]?.id ?? null);
    setCharge(true);
  }, []);

  const modifie = useMemo(
    () => charge && JSON.stringify(classes) !== sauvegarde,
    [charge, classes, sauvegarde],
  );

  // Avertir avant de quitter la page si des modifications ne sont pas enregistrées.
  useEffect(() => {
    if (!modifie) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [modifie]);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;

  // --- Actions sur les classes ---
  function creerClasse(e: React.FormEvent) {
    e.preventDefault();
    const nom = nomNouvelleClasse.trim();
    if (!nom) return;
    const classe: Classe = { id: nouvelId(), nom, eleves: [] };
    setClasses((prev) => [...prev, classe]);
    setClasseActiveId(classe.id);
    setNomNouvelleClasse("");
  }

  function supprimerClasse(id: string) {
    setClasses((prev) => {
      const reste = prev.filter((c) => c.id !== id);
      if (id === classeActiveId) setClasseActiveId(reste[0]?.id ?? null);
      return reste;
    });
  }

  function renommerClasse(id: string, nom: string) {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, nom } : c)));
  }

  // --- Actions sur les élèves d'une classe ---
  function majEleves(classeId: string, fn: (eleves: Eleve[]) => Eleve[]) {
    setClasses((prev) =>
      prev.map((c) => (c.id === classeId ? { ...c, eleves: fn(c.eleves) } : c)),
    );
  }

  function ajouterEleve(classeId: string, nom: string) {
    const propre = nom.trim();
    if (!propre) return;
    majEleves(classeId, (eleves) => [
      ...eleves,
      { id: nouvelId(), nom: propre },
    ]);
  }

  function supprimerEleve(classeId: string, eleveId: string) {
    majEleves(classeId, (eleves) => eleves.filter((el) => el.id !== eleveId));
  }

  function renommerEleve(classeId: string, eleveId: string, nom: string) {
    majEleves(classeId, (eleves) =>
      eleves.map((el) => (el.id === eleveId ? { ...el, nom } : el)),
    );
  }

  function importerEleves(classeId: string, texte: string) {
    const noms = texte
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (noms.length === 0) return;
    majEleves(classeId, (eleves) => [
      ...eleves,
      ...noms.map((nom) => ({ id: nouvelId(), nom })),
    ]);
  }

  function enregistrer() {
    enregistrerClasses(classes);
    setSauvegarde(JSON.stringify(classes));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mes classes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gère tes classes et leurs élèves. Ces listes serviront à la roue du
          hasard. Pense à <strong>enregistrer</strong> tes changements.
        </p>
      </header>

      {/* Barre d'enregistrement */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={!modifie}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enregistrer
        </button>
        <span className="text-sm" aria-live="polite">
          {modifie ? (
            <span className="text-amber-600 dark:text-amber-400">
              ● Modifications non enregistrées
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ Enregistré
            </span>
          )}
        </span>
      </div>

      {/* Pastilles des classes + création */}
      <div className="flex flex-col gap-3">
        {classes.length > 0 && (
          <div
            role="group"
            aria-label="Mes classes"
            className="flex flex-wrap gap-2"
          >
            {classes.map((c) => {
              const actif = c.id === classeActiveId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setClasseActiveId(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    actif
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  {c.nom || "Sans nom"}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      actif ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  >
                    {c.eleves.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={creerClasse} className="flex gap-2">
          <input
            type="text"
            value={nomNouvelleClasse}
            onChange={(e) => setNomNouvelleClasse(e.target.value)}
            placeholder="Nom de la classe (ex. CM1, 6e FLE)"
            aria-label="Nom de la nouvelle classe"
            className="w-full max-w-xs rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            + Nouvelle classe
          </button>
        </form>
      </div>

      {/* Panneau de la classe active */}
      {!charge ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : classeActive ? (
        <PanneauEleves
          classe={classeActive}
          onRenommerClasse={(nom) => renommerClasse(classeActive.id, nom)}
          onSupprimerClasse={() => supprimerClasse(classeActive.id)}
          onAjouterEleve={(nom) => ajouterEleve(classeActive.id, nom)}
          onSupprimerEleve={(eleveId) =>
            supprimerEleve(classeActive.id, eleveId)
          }
          onRenommerEleve={(eleveId, nom) =>
            renommerEleve(classeActive.id, eleveId, nom)
          }
          onImporterEleves={(texte) => importerEleves(classeActive.id, texte)}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Crée une première classe pour commencer.
        </p>
      )}
    </div>
  );
}
