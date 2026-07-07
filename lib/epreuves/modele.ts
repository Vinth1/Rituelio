// Types PARTAGÉS du module « Évaluations » (côté client ET serveur), sans aucune
// dépendance serveur ni React. La `config` d'une question est typée `unknown`
// ici : sa forme dépend du type de question et est validée par le plugin
// correspondant (voir `lib/epreuves/questions/`).

// Une question telle que stockée/relue (avec son id et son ordre).
export type QuestionEpreuve = {
  id: string;
  type: string; // clé de plugin ("qcm", "reponse-courte", …)
  enonce: string;
  points: number;
  config: unknown; // config type-spécifique (inclut les bonnes réponses)
  ordre: number;
};

// Une épreuve complète (modèle réutilisable).
export type Epreuve = {
  id: string;
  titre: string;
  description: string;
  melangeQuestions: boolean;
  questions: QuestionEpreuve[];
  creeLe: number;
  majLe: number;
};

// Résumé pour la liste des épreuves.
export type ResumeEpreuve = {
  id: string;
  titre: string;
  nbQuestions: number;
  majLe: number;
};

// Ce que l'éditeur envoie pour enregistrer : le serveur (ré)assigne ids et ordre.
export type QuestionEntrante = {
  type: string;
  enonce: string;
  points: number;
  config: unknown;
};

export type EpreuveEntrante = {
  titre: string;
  description: string;
  melangeQuestions: boolean;
  questions: QuestionEntrante[];
};
