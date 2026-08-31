// Logique de correction de conjugaison, PARTAGÉE entre le jeu d'entraînement
// (côté navigateur) et la correction des évaluations (côté serveur). Aucune
// dépendance navigateur : importe seulement la banque de verbes et le moteur.
//
// Imports RELATIFS avec extension .ts, comme le reste de la chaîne de
// conjugaison : `npm test` exécute ces fichiers avec le type-stripping de Node,
// qui ne connaît pas l'alias « @/ ».
import { conjuguer, trouverEntree } from "../data/verbes.ts";
import type { Conjugaison } from "./conjugueur.ts";

export type { Conjugaison };

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

// Vrai si la saisie correspond à la forme attendue OU à l'une de ses variantes
// légitimes : accord du participe passé après « être » (« sommes allés » accepte
// « sommes allées »), « je paye » à côté de « je paie ». C'est cette fonction, et
// non `formeEstCorrecte`, que doivent utiliser l'entraînement et la correction.
export function formeAcceptee(
  saisie: string,
  conj: Conjugaison,
  ligne: number,
): boolean {
  if (formeEstCorrecte(saisie, conj.formes[ligne])) return true;
  const variantes = conj.variantes?.[ligne];
  return variantes ? variantes.some((v) => formeEstCorrecte(saisie, v)) : false;
}

// Une ligne est correcte si le pronom ET la forme sont corrects (entraînement).
export function ligneCorrecte(
  pronom: string,
  forme: string,
  conj: Conjugaison,
  ligne: number,
): boolean {
  return pronomEstCorrect(pronom, ligne) && formeAcceptee(forme, conj, ligne);
}

// Retrouve la conjugaison (verbe + temps + mode) dans la banque, ou null.
// Ne voit QUE la banque officielle : un verbe personnalisé, propre à un prof,
// n'y figure pas. Côté serveur, la correction s'appuie donc en priorité sur les
// formes figées à la création de l'évaluation (voir `conjugaisonFigee`).
export function trouverConjugaison(
  infinitif: string,
  temps: string,
  mode: string,
): Conjugaison | null {
  const entree = trouverEntree(infinitif);
  return entree ? conjuguer(entree, temps, mode) : null;
}

// Reconstruit une conjugaison depuis le JSONB figé en base (colonne
// `session_items.formes`). Valide la structure : une donnée cassée ou absente
// renvoie null, et l'appelant retombe sur `trouverConjugaison`.
export function conjugaisonFigee(
  temps: string,
  mode: string,
  brut: unknown,
): Conjugaison | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as {
    formes?: unknown;
    lignes?: unknown;
    variantes?: unknown;
  };
  if (!Array.isArray(o.formes) || o.formes.length !== 6) return null;
  if (!o.formes.every((f) => typeof f === "string")) return null;

  const lignes =
    Array.isArray(o.lignes) && o.lignes.every((n) => typeof n === "number")
      ? (o.lignes as number[])
      : [0, 1, 2, 3, 4, 5];

  const variantes = Array.isArray(o.variantes)
    ? o.variantes.map((v) =>
        Array.isArray(v) && v.every((x) => typeof x === "string")
          ? (v as string[])
          : undefined,
      )
    : undefined;

  return {
    temps,
    mode,
    formes: o.formes as Conjugaison["formes"],
    lignes,
    variantes,
  };
}

// Note /20 du mode évaluation :
//   brut = formes correctes + contraintes validées
//   max  = nombre de formes demandées (12 = 2 verbes × 6) + nombre de contraintes
//   note = plancher( brut / max × 20 )
export function calculerNote(
  formesCorrectes: number,
  contraintesValidees: number,
  nbContraintes: number,
  nbFormes = 12,
): { brut: number; max: number; note: number } {
  const brut = formesCorrectes + contraintesValidees;
  const max = nbFormes + nbContraintes;
  const note = max > 0 ? Math.floor((brut / max) * 20) : 0;
  return { brut, max, note };
}
