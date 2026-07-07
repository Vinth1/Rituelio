// Registre PUR des types de question : associe chaque clé de type à sa
// définition. Aucune dépendance React ni serveur → importable côté serveur
// (correction, sérialisation publique) comme côté client (éditeur, passation).
//
// AJOUTER UN TYPE = créer `./<type>.ts` (+ ses composants UI dans
// `components/epreuves/`) puis ajouter UNE ligne ci-dessous. Aucune migration :
// la config type-spécifique vit en JSONB.
import type { DefinitionQuestion } from "./types.ts";
import { qcm } from "./qcm.ts";
import { reponseCourte } from "./reponse-courte.ts";

export const TYPES_QUESTION: Record<string, DefinitionQuestion> = {
  [qcm.type]: qcm,
  [reponseCourte.type]: reponseCourte,
};

// Définition d'un type, ou `undefined` si le type est inconnu.
export function typeQuestion(type: string): DefinitionQuestion | undefined {
  return TYPES_QUESTION[type];
}

export function estTypeConnu(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(TYPES_QUESTION, type);
}
