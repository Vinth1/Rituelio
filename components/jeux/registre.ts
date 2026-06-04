// Registre des jeux jouables : relie le champ `composant` de data/jeux.ts
// au composant React correspondant. Pour brancher un nouveau jeu jouable,
// l'importer ici et l'ajouter à la table.
import type { ComponentType } from "react";
import QuizCulture from "./QuizCulture";

export const JEUX_JOUABLES: Record<string, ComponentType> = {
  QuizCulture,
};
