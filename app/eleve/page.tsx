import { jeux } from "@/data/jeux";
import BasculeEspace from "@/components/BasculeEspace";
import CarteJeuEleve from "@/components/CarteJeuEleve";

// Espace élève : la même liste de jeux, simplifiée et plus grande.
// On ne montre rien qui soit réservé au prof.
export default function EspaceEleve() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <BasculeEspace />

      <h1 className="font-titre text-2xl font-bold text-encre sm:text-3xl">
        Choisis un jeu
      </h1>
      <p className="mt-1 mb-6 text-encre-douce">
        Clique sur un jeu pour voir comment y jouer.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {jeux
          .filter((jeu) => !jeu.profSeulement)
          .map((jeu) => (
            <CarteJeuEleve key={jeu.id} jeu={jeu} />
          ))}
      </div>
    </div>
  );
}
