"use client";

// Partie interactive de l'accueil : gère l'onglet actif (filtre) et compose
// les onglets, la tuile à la une et la grille filtrée.
import { useMemo, useState } from "react";
import type { Jeu } from "@/data/jeux";
import { categoriesPresentes } from "@/lib/categories";
import BarreOnglets, { type FiltreCategorie } from "./BarreOnglets";
import TuileALaUne from "./TuileALaUne";
import GrilleJeux from "./GrilleJeux";

export default function Catalogue({ jeux }: { jeux: Jeu[] }) {
  const [filtre, setFiltre] = useState<FiltreCategorie>("tous");

  const categories = useMemo(() => categoriesPresentes(jeux), [jeux]);

  const jeuxFiltres = useMemo(
    () =>
      filtre === "tous" ? jeux : jeux.filter((j) => j.categorie === filtre),
    [jeux, filtre],
  );

  // Le rituel à la une reste le premier jeu de la liste (non filtré).
  const aLaUne = jeux[0];

  return (
    <div className="flex flex-col gap-6">
      <BarreOnglets categories={categories} active={filtre} onChange={setFiltre} />
      {aLaUne && <TuileALaUne jeu={aLaUne} />}
      <GrilleJeux jeux={jeuxFiltres} />
    </div>
  );
}
