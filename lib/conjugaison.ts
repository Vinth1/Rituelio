// Logique de correction de conjugaison, PARTAGÉE entre le jeu d'entraînement
// (côté navigateur) et la correction des évaluations (côté serveur). Aucune
// dépendance navigateur : importe seulement la banque de verbes.
import { verbes, type Conjugaison } from "@/data/verbes";

// Pronoms acceptés pour chaque ligne (gère l'élision « j' » et les variantes).
export const PRONOMS_ACCEPTES: string[][] = [
  ["je", "j"],
  ["tu"],
  ["il", "elle", "on"],
  ["nous"],
  ["vous"],
  ["ils", "elles"],
];

// Insensible à la casse, aux accents et aux espaces.
export function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

// Pour les pronoms : on enlève en plus tout ce qui n'est pas une lettre (« j' »).
export function normaliserPronom(s: string): string {
  return normaliser(s).replace(/[^a-z]/g, "");
}

export function pronomEstCorrect(saisie: string, ligne: number): boolean {
  return PRONOMS_ACCEPTES[ligne]?.includes(normaliserPronom(saisie)) ?? false;
}

export function formeEstCorrecte(saisie: string, attendue: string): boolean {
  return normaliser(saisie) === normaliser(attendue);
}

// Une ligne est correcte si le pronom ET la forme sont corrects (entraînement).
export function ligneCorrecte(
  pronom: string,
  forme: string,
  conj: Conjugaison,
  ligne: number,
): boolean {
  return pronomEstCorrect(pronom, ligne) && formeEstCorrecte(forme, conj.formes[ligne]);
}

// Retrouve la conjugaison (verbe + temps + mode) dans la banque, ou null.
export function trouverConjugaison(
  infinitif: string,
  temps: string,
  mode: string,
): Conjugaison | null {
  const verbe = verbes.find((v) => v.infinitif === infinitif);
  if (!verbe) return null;
  return (
    verbe.conjugaisons.find((c) => c.temps === temps && c.mode === mode) ?? null
  );
}

// Note /20 du mode évaluation :
//   brut = formes correctes + contraintes validées
//   max  = 12 (2 verbes × 6 formes) + nombre de contraintes
//   note = plancher( brut / max × 20 )
export function calculerNote(
  formesCorrectes: number,
  contraintesValidees: number,
  nbContraintes: number,
): { brut: number; max: number; note: number } {
  const brut = formesCorrectes + contraintesValidees;
  const max = 12 + nbContraintes;
  const note = max > 0 ? Math.floor((brut / max) * 20) : 0;
  return { brut, max, note };
}
