// Persistance (localStorage) des champs lexicaux personnalisés du jeu « Chaîne
// lexicale ». Calqué sur lib/classes.ts : pas de back-end, tout est stocké dans
// le navigateur, sur une clé dédiée. Le type est celui des thèmes livrés
// (data/champs-lexicaux.ts) : les deux listes se concatènent telles quelles.

import type { ChampLexical } from "@/data/champs-lexicaux";

const CLE_STOCKAGE = "rituelio.champs-perso";

// Charge les thèmes personnalisés (tableau vide si rien ou erreur).
export function chargerChampsPerso(): ChampLexical[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    const data: unknown = JSON.parse(brut);
    if (!Array.isArray(data)) return [];
    return data as ChampLexical[];
  } catch {
    return [];
  }
}

// Enregistre les thèmes personnalisés.
export function enregistrerChampsPerso(liste: ChampLexical[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(liste));
}
