// Types PARTAGÉS du mode évaluation, sans aucune dépendance serveur (pas de
// `node:sqlite`). Importés par la couche serveur (`lib/serveur/evaluations.ts`)
// ET par les composants client (page élève, suivi prof).

export type VerbeRef = { infinitif: string; temps: string; mode: string };

export type LigneSaisie = { pronom: string; forme: string };

// Ce que reçoit l'élève (aucune réponse correcte).
export type EvaluationPublique = {
  code: string;
  name: string;
  date: string;
  status: string;
  verbes: VerbeRef[];
  contraintes: string[];
};

// Ce qu'envoie l'élève.
export type CopieEntrante = {
  prenom: string;
  tableaux: { lignes: LigneSaisie[] }[]; // 2 tableaux × 6 lignes
  phrase: string;
};

// Une ligne corrigée (vue prof).
export type LigneCorrigee = {
  pronom: string;
  forme: string;
  attendue: string;
  correcte: boolean;
};

// Une copie corrigée (vue prof).
export type CopieCorrigee = {
  id: string;
  prenom: string;
  rendueLe: number;
  tableaux: { verbe: VerbeRef; lignes: LigneCorrigee[] }[];
  phrase: string;
  contraintes: { label: string; validee: boolean }[];
  formesCorrectes: number;
  brut: number;
  max: number;
  noteAuto: number;
  noteForcee: number | null;
  note: number;
  commentaire: string;
};

// Résumé d'une évaluation (historique par classe).
export type ResumeEvaluation = {
  code: string;
  name: string;
  date: string;
  status: string;
  classeId: string;
  classeNom: string;
  verbes: VerbeRef[];
  contraintes: string[];
  nbCopies: number;
};
