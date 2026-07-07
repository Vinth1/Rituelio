"use client";

// Registre UI (client) des types de question : associe une clé de type à son
// composant d'ÉDITION. La logique pure (correction, config par défaut, libellé)
// vit à part dans `lib/epreuves/questions/` (registre PUR). Ajouter un type =
// créer son Éditeur ici + 1 ligne. (Le composant de PASSATION `Saisie` viendra
// avec la PR passation.)
import type { ComponentType } from "react";
import QcmEditeur from "./QcmEditeur";
import ReponseCourteEditeur from "./ReponseCourteEditeur";

// Props communes à tous les éditeurs de question. `config` est `unknown` :
// chaque éditeur la restreint à son propre type.
export type PropsEditeurQuestion = {
  idQuestion: string; // pour des identifiants uniques (groupes de radios, etc.)
  config: unknown;
  onChange: (config: unknown) => void;
};

type EntreeUi = { Editeur: ComponentType<PropsEditeurQuestion> };

export const UI_QUESTION: Record<string, EntreeUi> = {
  qcm: { Editeur: QcmEditeur },
  "reponse-courte": { Editeur: ReponseCourteEditeur },
};
