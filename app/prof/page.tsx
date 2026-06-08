import Link from "next/link";
import { redirect } from "next/navigation";
import { jeux } from "@/data/jeux";
import BasculeEspace from "@/components/BasculeEspace";
import Catalogue from "@/components/Catalogue";
import { sessionProf } from "@/lib/serveur/session-prof";

// Espace prof : l'interface ludique complète (onglets + tuile à la une + grille),
// réutilisée telle quelle. Accès à la gestion des classes. Réservé : si non
// connecté, on redirige vers la page de connexion.
export default async function EspaceProf() {
  if (!(await sessionProf())) redirect("/connexion?next=/prof");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BasculeEspace />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-bold text-encre">Espace prof</h1>
          <p className="text-sm text-encre-douce">
            Choisis un rituel à préparer ou à projeter.
          </p>
        </div>
        <Link
          href="/classe"
          className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          👥 Mes classes
        </Link>
      </div>

      <Catalogue jeux={jeux.filter((jeu) => !jeu.eleveSeulement)} />
    </div>
  );
}
