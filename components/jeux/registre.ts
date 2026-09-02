// Registre des jeux jouables : relie le champ `composant` de data/jeux.ts
// au composant React correspondant. Pour brancher un nouveau jeu jouable,
// l'importer ici et l'ajouter à la table.
import type { ComponentType } from "react";
import ChaineLexicale from "./ChaineLexicale";
import ConjugaisonEleve from "./ConjugaisonEleve";
import ConjugaisonEntrainement from "./ConjugaisonEntrainement";
import DefiLecture from "./DefiLecture";
import DicteeDuJour from "./DicteeDuJour";
import MotDuJour from "./MotDuJour";
import Pendu from "./Pendu";
import QuizCulture from "./QuizCulture";
import RoueDesVerbes from "./RoueDesVerbes";

export const JEUX_JOUABLES: Record<string, ComponentType> = {
  ChaineLexicale,
  ConjugaisonEleve,
  ConjugaisonEntrainement,
  DefiLecture,
  DicteeDuJour,
  MotDuJour,
  Pendu,
  QuizCulture,
  RoueDesVerbes,
};
