import { jeux } from "@/data/jeux";
import CarteJeuEleve from "@/components/CarteJeuEleve";
import PorteEleve from "@/components/eleve/PorteEleve";

// Espace élève : la même liste de jeux, simplifiée et plus grande.
// PorteEleve gère l'onboarding (profil prénom + couleur) avant d'afficher
// la grille. On ne montre rien qui soit réservé au prof.
export default function EspaceEleve() {
  return (
    <PorteEleve>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {jeux
          .filter((jeu) => !jeu.profSeulement)
          .map((jeu) => (
            <CarteJeuEleve key={jeu.id} jeu={jeu} />
          ))}
      </div>
    </PorteEleve>
  );
}
