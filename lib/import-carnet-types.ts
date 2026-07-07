// Types PARTAGÉS du pont « évaluation → carnet », sans dépendance serveur.
// Importés par la couche serveur (`lib/serveur/import-carnet.ts`) ET par le
// composant client d'envoi (`components/evaluation/EnvoiVersCarnet.tsx`).

// Une copie prête à envoyer : identifiant de rendu, prénom saisi, note /20.
export type CopieAImporter = {
  submissionId: string;
  prenom: string;
  note: number;
};

// Tâche déjà issue de la même session (signalée pour éviter un doublon).
export type Doublon = { tacheId: string; nom: string; matiereNom: string };

// Ce dont le formulaire d'envoi a besoin (chargé au montant de la fenêtre).
export type PreparationImport = {
  session: {
    code: string;
    name: string;
    date: string;
    classeId: string | null;
    classeNom: string;
  };
  copies: CopieAImporter[];
  bareme: number;
  trimestreSuggere: number;
  dejaImporte: Doublon | null;
};

// Un appariement confirmé copie → élève du carnet.
export type AttributionImport = { submissionId: string; eleveId: string };

// Le corps de la requête d'import (validé côté serveur).
export type ParamsImport = {
  matiereId: string;
  trimestre: number;
  dateISO: string;
  nom: string;
  ponderation: number;
  attributions: AttributionImport[];
  absents: string[];
  forcer: boolean;
};

// Résultat de l'import : succès (comptes) ou échec (avec doublon éventuel).
export type ResultatImport =
  | { ok: true; tacheId: string; nbNotes: number; nbAbsents: number }
  | { ok: false; erreur: string; doublon?: Doublon };
