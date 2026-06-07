// Grille responsive de cartes : reçoit la liste (déjà filtrée) de jeux à afficher.
import type { Jeu } from "@/data/jeux";
import CarteJeu from "./CarteJeu";

export default function GrilleJeux({ jeux }: { jeux: Jeu[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {jeux.map((jeu) => (
        <CarteJeu key={jeu.id} jeu={jeu} />
      ))}
    </div>
  );
}
