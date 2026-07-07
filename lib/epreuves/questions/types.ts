// Cœur PUR de l'architecture à plugins des types de question (module
// « Évaluations » générique, namespace `epreuves`). Aucune dépendance React ni
// serveur : ce fichier est importable À LA FOIS côté serveur (routes de
// correction, sérialisation publique) ET côté client (éditeur, passation) —
// exactement le partage déjà en place avec `lib/conjugaison.ts`.
//
// Chaque TYPE de question (QCM, réponse courte, …) fournit une `DefinitionQuestion`
// qui décrit ses trois surfaces logiques : composer (config + bonnes réponses),
// dépouiller pour l'élève (`versionPublique`, qui RETIRE les bonnes réponses) et
// corriger (`corrige`, ou `null` = correction manuelle). L'UI (Éditeur/Saisie)
// vit à part dans `components/epreuves/` et n'a pas sa place ici.

// Résultat de la correction automatique d'une question.
export type ResultatCorrection = {
  points: number; // points obtenus (toujours ≥ 0)
  max: number; // points maximum de la question
  details?: unknown; // infos par-type pour l'affichage prof (ex. options justes)
};

// Retour de `valideConfig` : la base ne valide pas le JSONB, la validation se
// fait donc ici, à l'écriture, et renvoie une config nettoyée et typée.
export type Validation<Config> =
  | { ok: true; config: Config }
  | { ok: false; erreur: string };

// Contrat d'un type de question. Les méthodes sont volontairement en syntaxe
// « méthode » (et non champs-fonctions) pour que le registre puisse stocker des
// définitions hétérogènes (`DefinitionQuestion` aux génériques `unknown`).
export interface DefinitionQuestion<
  Config = unknown,
  Public = unknown,
  Reponse = unknown,
> {
  readonly type: string; // clé de plugin, ex. "qcm" — unique dans le registre
  readonly label: string; // libellé FR affiché au prof (menu « ajouter »)
  readonly icone: string; // emoji ou nom d'icône
  readonly autoCorrige: boolean; // false → file de correction manuelle

  // Config d'une nouvelle question vierge (appelée par l'éditeur).
  configParDefaut(): Config;
  // Valide/nettoie la config saisie par le prof avant enregistrement.
  valideConfig(brut: unknown): Validation<Config>;

  // Retire les bonnes réponses : SEULE forme envoyée à l'élève.
  versionPublique(config: Config): Public;

  // Normalise/borne la réponse brute de l'élève avant enregistrement.
  valideReponse(brut: unknown): Reponse;
  // Réponse « non répondue » par défaut.
  reponseVide(): Reponse;

  // Corrige automatiquement. `null` = non auto-corrigeable (correction manuelle).
  corrige(config: Config, reponse: Reponse, points: number): ResultatCorrection | null;
}
