"use client";

// « Porte » d'entrée de l'espace élève : on lit le profil dans le localStorage
// au montage. Pas de profil → onboarding. Profil existant → on entre directement
// et on affiche la grille de jeux (children) avec une bulle cliquable pour
// modifier son profil.
import { useEffect, useState } from "react";
import BasculeEspace from "@/components/BasculeEspace";
import OnboardingEleve from "./OnboardingEleve";
import BulleProfil from "./BulleProfil";
import { type ProfilEleve, chargerProfil } from "@/lib/profil-eleve";

export default function PorteEleve({ children }: { children: React.ReactNode }) {
  const [profil, setProfil] = useState<ProfilEleve | null>(null);
  const [charge, setCharge] = useState(false);
  const [edition, setEdition] = useState(false);

  // Lecture du profil côté client uniquement (le serveur n'a pas le localStorage).
  // On initialise dans un effet pour éviter un décalage d'hydratation.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setProfil(chargerProfil());
    setCharge(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <BasculeEspace />

      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : !profil || edition ? (
        <OnboardingEleve
          profilInitial={profil}
          onTermine={(p) => {
            setProfil(p);
            setEdition(false);
          }}
          // Le bouton « Annuler » n'a de sens qu'en modification d'un profil existant.
          onAnnuler={profil ? () => setEdition(false) : undefined}
        />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-titre text-2xl font-bold text-encre sm:text-3xl">
                Salut {profil.prenom} !
              </h1>
              <p className="mt-1 text-encre-douce">
                Clique sur un jeu pour voir comment y jouer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEdition(true)}
              aria-label="Modifier mon profil"
              title="Modifier mon profil"
              className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              <BulleProfil
                prenom={profil.prenom}
                couleur={profil.couleur}
                taille="petite"
              />
            </button>
          </div>

          {children}
        </>
      )}
    </div>
  );
}
