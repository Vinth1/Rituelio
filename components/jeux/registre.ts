// Registre des jeux jouables : relie le champ `composant` de data/jeux.ts
// au composant React correspondant. Pour brancher un nouveau jeu jouable,
// l'importer ici et l'ajouter à la table.
import type { ComponentType } from "react";
import ChaineLexicale from "./ChaineLexicale";
import ConjugaisonEleve from "./ConjugaisonEleve";
import ConjugaisonEntrainement from "./ConjugaisonEntrainement";
import DefiLecture from "./DefiLecture";
import MotDuJour from "./MotDuJour";
import Pendu from "./Pendu";
import QuestionsDeCours from "./QuestionsDeCours";
import QuizCulture from "./QuizCulture";
import RoueDuHasard from "./RoueDuHasard";

export const JEUX_JOUABLES: Record<string, ComponentType> = {
  ChaineLexicale,
  ConjugaisonEleve,
  ConjugaisonEntrainement,
  DefiLecture,
  MotDuJour,
  Pendu,
  QuestionsDeCours,
  QuizCulture,
  RoueDuHasard,
};
