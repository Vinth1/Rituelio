"use client";

// Panneau des élèves de la classe active : renommer/supprimer la classe,
// ajouter un élève, renommer/supprimer chaque élève, et importer une liste
// (un nom par ligne).
import { useState } from "react";
import type { Classe } from "@/lib/classes";

type Props = {
  classe: Classe;
  onRenommerClasse: (nom: string) => void;
  onSupprimerClasse: () => void;
  onAjouterEleve: (nom: string) => void;
  onSupprimerEleve: (eleveId: string) => void;
  onRenommerEleve: (eleveId: string, nom: string) => void;
  onImporterEleves: (texte: string) => void;
};

export default function PanneauEleves({
  classe,
  onRenommerClasse,
  onSupprimerClasse,
  onAjouterEleve,
  onSupprimerEleve,
  onRenommerEleve,
  onImporterEleves,
}: Props) {
  const [nouvelEleve, setNouvelEleve] = useState("");
  const [importTexte, setImportTexte] = useState("");

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    onAjouterEleve(nouvelEleve);
    setNouvelEleve("");
  }

  function importer() {
    onImporterEleves(importTexte);
    setImportTexte("");
  }

  function supprimerClasse() {
    const ok = window.confirm(
      `Supprimer la classe « ${classe.nom || "Sans nom"} » et ses ${classe.eleves.length} élève(s) ?`,
    );
    if (ok) onSupprimerClasse();
  }

  return (
    <section className="flex flex-col gap-5 rounded-carte border border-ligne bg-surface p-5">
      {/* En-tête : nom de classe éditable + suppression */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={classe.nom}
          onChange={(e) => onRenommerClasse(e.target.value)}
          aria-label="Nom de la classe"
          className="min-w-0 flex-1 rounded-moyen border border-transparent bg-transparent px-1 text-lg font-semibold text-encre hover:border-ligne focus:border-ligne focus:outline-none"
        />
        <button
          type="button"
          onClick={supprimerClasse}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-500/10"
        >
          Supprimer la classe
        </button>
      </div>

      {/* Ajout manuel d'un élève */}
      <form onSubmit={ajouter} className="flex gap-2">
        <input
          type="text"
          value={nouvelEleve}
          onChange={(e) => setNouvelEleve(e.target.value)}
          placeholder="Nom de l'élève"
          aria-label="Nom du nouvel élève"
          className="w-full rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
        <button
          type="submit"
          className="shrink-0 rounded-moyen bg-principal px-4 py-1.5 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Ajouter
        </button>
      </form>

      {/* Liste des élèves */}
      {classe.eleves.length === 0 ? (
        <p className="text-sm text-encre-douce">
          Aucun élève pour l’instant. Ajoute-les un par un, ou colle une liste
          ci-dessous.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {classe.eleves.map((eleve, i) => (
            <li key={eleve.id} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right text-xs text-encre-douce">
                {i + 1}
              </span>
              <input
                type="text"
                value={eleve.nom}
                onChange={(e) => onRenommerEleve(eleve.id, e.target.value)}
                aria-label={`Nom de l'élève ${i + 1}`}
                className="w-full rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              />
              <button
                type="button"
                onClick={() => onSupprimerEleve(eleve.id)}
                aria-label={`Supprimer ${eleve.nom || "l'élève"}`}
                className="shrink-0 rounded-moyen px-2 py-1.5 text-encre-douce transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-500/10"
              >
                <span aria-hidden="true">🗑</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Import rapide par copier-coller */}
      <div className="flex flex-col gap-2 border-t border-ligne pt-4">
        <label
          htmlFor="import-eleves"
          className="text-sm font-medium text-encre-douce"
        >
          Import rapide (un nom par ligne)
        </label>
        <textarea
          id="import-eleves"
          value={importTexte}
          onChange={(e) => setImportTexte(e.target.value)}
          rows={4}
          placeholder={"Alice\nBob\nChloé"}
          className="w-full rounded-moyen border border-ligne bg-surface px-3 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
        <button
          type="button"
          onClick={importer}
          disabled={!importTexte.trim()}
          className="self-start rounded-moyen bg-encre px-4 py-1.5 text-sm font-semibold text-fond transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          Importer
        </button>
      </div>
    </section>
  );
}
