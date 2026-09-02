// Modèle et persistance du tableau des scores par équipe (outil de classe).
// Rien en base : c'est un compteur éphémère de séance. Il est simplement gardé
// dans le localStorage pour qu'un rechargement en plein cours ne l'efface pas.

import { nouvelId } from "@/lib/classes";

export type Equipe = {
  id: string;
  nom: string;
  score: number;
};

const CLE_STOCKAGE = "rituelio.outils.equipes";

// Crée `nombre` équipes vides, nommées « Équipe 1 », « Équipe 2 »…
export function creerEquipes(nombre: number): Equipe[] {
  return Array.from({ length: nombre }, (_, i) => ({
    id: nouvelId(),
    nom: `Équipe ${i + 1}`,
    score: 0,
  }));
}

// Charge les équipes depuis le localStorage (tableau vide si rien ou erreur).
export function chargerEquipes(): Equipe[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    const data: unknown = JSON.parse(brut);
    if (!Array.isArray(data)) return [];
    // Validation défensive : on ignore tout ce qui n'a pas la bonne forme.
    return data.filter(
      (e): e is Equipe =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Equipe).id === "string" &&
        typeof (e as Equipe).nom === "string" &&
        typeof (e as Equipe).score === "number",
    );
  } catch {
    return [];
  }
}

// Enregistre les équipes dans le localStorage.
export function enregistrerEquipes(equipes: Equipe[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(equipes));
}
