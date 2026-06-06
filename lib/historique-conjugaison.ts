// Persistance (localStorage) de l'historique des séances de « Conjugaison —
// entraînement », rangé par classe. Calqué sur lib/classes.ts : pas de back-end,
// tout est stocké dans le navigateur, sur une clé dédiée.

export type LigneSauvee = {
  pronom: string;
  forme: string;
  correcte: boolean;
};

export type TableauSauve = {
  infinitif: string;
  temps: string;
  mode: string;
  lignes: LigneSauvee[]; // les 6 personnes telles que complétées
};

export type SeanceConj = {
  id: string;
  classeId: string;
  date: string; // format AAAA-MM-JJ
  tableaux: TableauSauve[]; // les 2 verbes travaillés
  contraintesValidees: string[];
  phraseCorrigee: string;
};

const CLE_STOCKAGE = "rituelio.historique-conjugaison";

// Charge tout l'historique (tableau vide si rien ou erreur).
export function chargerHistorique(): SeanceConj[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    const data: unknown = JSON.parse(brut);
    if (!Array.isArray(data)) return [];
    return data as SeanceConj[];
  } catch {
    return [];
  }
}

// Enregistre tout l'historique.
export function enregistrerHistorique(seances: SeanceConj[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(seances));
}

// Ajoute une séance à l'historique.
export function ajouterSeance(seance: SeanceConj): void {
  enregistrerHistorique([...chargerHistorique(), seance]);
}

// Séances d'une classe donnée, de la plus récente à la plus ancienne.
export function seancesDeClasse(classeId: string): SeanceConj[] {
  return chargerHistorique()
    .filter((s) => s.classeId === classeId)
    .reverse();
}
