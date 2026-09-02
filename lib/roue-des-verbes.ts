// Logique de la « Roue des verbes » : réglages du tirage, tirage lui-même et
// phrase de correction. Aucune dépendance navigateur hors des deux fonctions de
// persistance, qui se gardent d'un rendu serveur.
//
// Imports RELATIFS avec extension .ts, comme le reste de la chaîne de
// conjugaison : `npm test` exécute ces fichiers avec le type-stripping de Node,
// qui ne connaît pas l'alias « @/ ».
import { conjuguer, verbes } from "../data/verbes.ts";
import { SUJETS, type GenreSujet, type Sujet } from "../data/sujets.ts";
import { melanger } from "./groupes.ts";
import {
  TEMPS_COLLEGE,
  cleTempsMode,
  type EntreeVerbe,
  type Groupe,
} from "./conjugueur.ts";

export type TempsMode = { temps: string; mode: string };

// L'impératif est écarté, comme dans le jeu « Conjugaison — entraînement » :
// il n'a que trois personnes et ne se dit pas avec un sujet exprimé.
export const TEMPS_ROUE: TempsMode[] = TEMPS_COLLEGE.filter(
  (tm) => tm.mode !== "impératif",
).map((tm) => ({ temps: tm.temps, mode: tm.mode }));

export const GROUPES: Groupe[] = ["1er groupe", "2e groupe", "3e groupe"];

// Libellé court, pensé pour tenir dans un secteur de roue : au mode indicatif on
// ne dit que le temps, ailleurs on abrège le mode (« subj. présent »).
export function libelleCourtTemps(tm: TempsMode): string {
  if (tm.mode === "indicatif") return tm.temps;
  if (tm.mode === "conditionnel") return `cond. ${tm.temps}`;
  if (tm.mode === "subjonctif") return `subj. ${tm.temps}`;
  return `${tm.temps} · ${tm.mode}`;
}

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------

export type ReglagesRoue = {
  temps: string[]; // clés `mode|temps` (cleTempsMode)
  genres: GenreSujet[];
  groupes: Groupe[];
};

const TOUS_LES_GENRES: GenreSujet[] = ["pronom", "groupe-nominal", "coordonne"];

export const REGLAGES_DEFAUT: ReglagesRoue = {
  temps: ["indicatif|présent", "indicatif|imparfait", "indicatif|futur simple"],
  genres: ["pronom", "groupe-nominal"],
  groupes: [...GROUPES],
};

const CLE_STOCKAGE = "rituelio.roue-des-verbes";

// Ne garde que les valeurs connues : un réglage venu du localStorage a pu être
// écrit par une version antérieure, ou à la main.
export function normaliserReglages(brut: unknown): ReglagesRoue {
  if (!brut || typeof brut !== "object") return REGLAGES_DEFAUT;
  const o = brut as Partial<Record<keyof ReglagesRoue, unknown>>;
  const filtrer = <T extends string>(valeur: unknown, connus: readonly T[]): T[] =>
    Array.isArray(valeur)
      ? connus.filter((c) => (valeur as unknown[]).includes(c))
      : [];
  return {
    temps: filtrer(o.temps, TEMPS_ROUE.map(cleTempsMode)),
    genres: filtrer(o.genres, TOUS_LES_GENRES),
    groupes: filtrer(o.groupes, GROUPES),
  };
}

export function chargerReglages(): ReglagesRoue {
  if (typeof window === "undefined") return REGLAGES_DEFAUT;
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return REGLAGES_DEFAUT;
    return normaliserReglages(JSON.parse(brut));
  } catch {
    return REGLAGES_DEFAUT;
  }
}

export function enregistrerReglages(r: ReglagesRoue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(r));
  } catch {
    /* quota plein ou stockage refusé : les réglages valent pour la séance */
  }
}

// ---------------------------------------------------------------------------
// Tirage
// ---------------------------------------------------------------------------

export type Tirage = { sujet: Sujet; verbe: EntreeVerbe; temps: TempsMode };

export function sujetsPossibles(r: ReglagesRoue): Sujet[] {
  return SUJETS.filter((s) => r.genres.includes(s.genre));
}

export function verbesPossibles(r: ReglagesRoue): EntreeVerbe[] {
  return verbes.filter((v) => r.groupes.includes(v.groupe));
}

export function tempsPossibles(r: ReglagesRoue): TempsMode[] {
  return TEMPS_ROUE.filter((tm) => r.temps.includes(cleTempsMode(tm)));
}

// Un élément au hasard, en écartant `exclu` DÈS QU'il reste un autre choix :
// c'est ce qui évite de retomber deux fois de suite sur la même valeur.
// Hors composant, comme dans les autres jeux : le compilateur React refuse un
// appel direct à Math.random dans le corps d'un composant.
export function piocher<T>(
  liste: T[],
  cle: (t: T) => string,
  exclu?: string,
): T | null {
  if (liste.length === 0) return null;
  const restants =
    exclu === undefined || liste.length < 2
      ? liste
      : liste.filter((t) => cle(t) !== exclu);
  const utile = restants.length > 0 ? restants : liste;
  return utile[Math.floor(Math.random() * utile.length)];
}

// `taille` candidats au hasard, en garantissant la présence de `impose` (le
// gagnant). C'est ce qui permet d'afficher huit verbes sur une roue qui en
// compte plus de trois cents : l'échantillon change au DÉPART de la rotation,
// jamais à l'arrivée.
export function echantillonner<T>(
  liste: T[],
  cle: (t: T) => string,
  taille: number,
  impose?: T,
): T[] {
  if (liste.length <= taille) return melanger(liste);
  const autres = melanger(
    impose ? liste.filter((t) => cle(t) !== cle(impose)) : liste,
  );
  const retenus = impose
    ? [impose, ...autres.slice(0, taille - 1)]
    : autres.slice(0, taille);
  return melanger(retenus);
}

export const cleSujet = (s: Sujet): string => s.id;
export const cleVerbe = (v: EntreeVerbe): string => v.infinitif;
export const cleTemps = (tm: TempsMode): string => cleTempsMode(tm);

// Les trois roues d'un coup. `precedent` sert à ne pas répéter le tirage
// précédent ; `null` si un réglage a vidé l'une des trois roues.
export function tirer(r: ReglagesRoue, precedent?: Tirage | null): Tirage | null {
  const sujet = piocher(sujetsPossibles(r), cleSujet, precedent?.sujet.id);
  const verbe = piocher(verbesPossibles(r), cleVerbe, precedent?.verbe.infinitif);
  const temps = piocher(
    tempsPossibles(r),
    cleTemps,
    precedent ? cleTempsMode(precedent.temps) : undefined,
  );
  return sujet && verbe && temps ? { sujet, verbe, temps } : null;
}

// ---------------------------------------------------------------------------
// Correction
// ---------------------------------------------------------------------------

// Verbes à « h » aspiré de la banque : « je hais », « je halète » ne s'élident
// pas, contrairement à « j'habite » ou « j'hésite ».
const H_ASPIRE = new Set(["haïr", "haleter"]);

function commenceParVoyelle(mot: string, hMuet: boolean): boolean {
  const premiere =
    mot
      .trim()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()[0] ?? "";
  if (premiere === "h") return hMuet;
  return "aeiouy".includes(premiere);
}

// Élide un petit mot terminé par « e » (« je », « que ») devant une voyelle.
function joindre(mot: string, suivant: string, hMuet = true): string {
  return commenceParVoyelle(suivant, hMuet)
    ? `${mot.slice(0, -1)}'${suivant}`
    : `${mot} ${suivant}`;
}

// Forme attendue pour ce tirage. Un sujet féminin prend la variante accordée du
// conjugueur quand elle existe (« ma sœur est arrivée »).
export function formeAttendue(t: Tirage): string | null {
  const conj = conjuguer(t.verbe, t.temps.temps, t.temps.mode);
  if (!conj) return null;
  const ligne = t.sujet.ligne;
  if (!conj.lignes.includes(ligne)) return null;
  const accordee =
    t.sujet.feminin && (ligne === 2 || ligne === 5)
      ? conj.variantes?.[ligne]?.[0]
      : undefined;
  return accordee ?? conj.formes[ligne];
}

// La réponse telle qu'on l'écrirait au tableau : « les élèves finissaient »,
// « j'ai aimé », « qu'il finisse ».
export function phraseReponse(t: Tirage): string | null {
  const forme = formeAttendue(t);
  if (!forme) return null;
  const hMuet = !H_ASPIRE.has(t.verbe.infinitif);
  const groupe =
    t.sujet.id === "je"
      ? joindre("je", forme, hMuet)
      : `${t.sujet.libelle} ${forme}`;
  return t.temps.mode === "subjonctif" ? joindre("que", groupe) : groupe;
}
