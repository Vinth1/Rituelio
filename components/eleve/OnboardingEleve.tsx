"use client";

// Onboarding élève : l'élève crée (ou modifie) son profil — prénom + couleur.
// La bulle d'aperçu se met à jour en direct. « C'est parti » enregistre le
// profil via enregistrerProfil() puis prévient le parent (onTermine).
import { useState } from "react";
import {
  type ProfilEleve,
  COULEURS_PROFIL,
  COULEUR_PROFIL_DEFAUT,
  enregistrerProfil,
} from "@/lib/profil-eleve";
import BulleProfil from "./BulleProfil";

type Props = {
  // Profil existant si l'élève vient le modifier (sinon création).
  profilInitial?: ProfilEleve | null;
  onTermine: (profil: ProfilEleve) => void;
  // Présent uniquement en mode édition (depuis l'espace élève).
  onAnnuler?: () => void;
};

export default function OnboardingEleve({
  profilInitial,
  onTermine,
  onAnnuler,
}: Props) {
  const [prenom, setPrenom] = useState(profilInitial?.prenom ?? "");
  const [couleur, setCouleur] = useState(
    profilInitial?.couleur ?? COULEUR_PROFIL_DEFAUT,
  );

  const prenomValide = prenom.trim() !== "";
  const edition = Boolean(profilInitial);

  function valider(e: React.FormEvent) {
    e.preventDefault();
    const propre = prenom.trim();
    if (!propre) return;
    const profil: ProfilEleve = {
      prenom: propre,
      couleur,
      // On conserve la mascotte déjà choisie (fonctionnalité à venir).
      ...(profilInitial?.mascotte ? { mascotte: profilInitial.mascotte } : {}),
    };
    enregistrerProfil(profil);
    onTermine(profil);
  }

  return (
    <form
      onSubmit={valider}
      className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-carte border-2 border-ligne bg-surface p-8 shadow-sm"
    >
      <header className="text-center">
        <h1 className="font-titre text-2xl font-extrabold text-encre sm:text-3xl">
          {edition ? "Mon profil" : "Crée ton profil"}
        </h1>
        <p className="mt-1 text-sm text-encre-douce">
          Choisis ton prénom et ta couleur.
        </p>
      </header>

      {/* Aperçu en direct : la couleur remplit le fond, derrière l'initiale. */}
      <BulleProfil prenom={prenom} couleur={couleur} taille="grande" />

      {/* Champ prénom */}
      <div className="w-full">
        <label
          htmlFor="prenom-eleve"
          className="mb-1 block text-sm font-semibold text-encre"
        >
          Ton prénom
        </label>
        <input
          id="prenom-eleve"
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Ex. Camille"
          autoComplete="off"
          maxLength={20}
          autoFocus
          className="w-full rounded-moyen border border-ligne bg-fond px-4 py-2.5 text-center text-lg text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
      </div>

      {/* Sélecteur de couleur : rangée de pastilles cliquables. */}
      <fieldset className="w-full">
        <legend className="mb-2 text-sm font-semibold text-encre">
          Ta couleur
        </legend>
        <div className="flex flex-wrap justify-center gap-3">
          {COULEURS_PROFIL.map((c) => {
            const actif = c.valeur === couleur;
            return (
              <button
                key={c.valeur}
                type="button"
                aria-pressed={actif}
                aria-label={c.nom}
                title={c.nom}
                onClick={() => setCouleur(c.valeur)}
                style={{ backgroundColor: c.valeur }}
                className={`h-9 w-9 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                  actif
                    ? "scale-110 ring-2 ring-encre ring-offset-2 ring-offset-surface"
                    : "ring-1 ring-black/10 hover:scale-105"
                }`}
              />
            );
          })}
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex w-full flex-col gap-2">
        <button
          type="submit"
          disabled={!prenomValide}
          className="w-full rounded-moyen bg-encre px-5 py-3 text-base font-bold text-fond transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-40"
        >
          C’est parti
        </button>
        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            className="w-full rounded-moyen px-5 py-2 text-sm font-semibold text-encre-douce transition hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
