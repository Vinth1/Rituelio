// Logique pure de la « Dictée du jour » : découpage d'un texte en mots à
// corriger, comparaison d'une épellation avec la graphie attendue, et
// normalisation des tags. Module PUR (aucune dépendance serveur ni React) :
// même code côté API et côté navigateur, et testable par `npm test`.
//
// Import relatif avec extension explicite : `node --test` exécute ce fichier
// sans résoudre l'alias `@/` (même convention que lib/epreuves/questions/*).
import { normaliserReponse } from "./epreuves/texte.ts";

// Un mot du parcours de correction, avec ce qui l'entoure dans le texte.
// Concaténer `avant + mot + apres` de tous les mots redonne le texte source à
// l'identique : la vue de correction peut donc réafficher le texte entier en ne
// masquant que les `mot` pas encore traités.
export type MotDictee = {
  index: number; // position dans le parcours (0, 1, 2…)
  mot: string; // la graphie attendue, sans ponctuation : « devint »
  avant: string; // espaces et ponctuation ouvrante qui le précèdent : « « »
  apres: string; // ponctuation qui lui est accolée : « , », « ! »
};

// Une dictée telle que l'API la renvoie. Déclarée dans ce module pur pour que
// les composants clients puissent la typer sans importer `lib/serveur/**`.
export type Dictee = {
  id: string;
  titre: string;
  texte: string;
  tags: string[];
  modifieeLe: number;
};

export const MAX_LONGUEUR_TAG = 32;
export const MAX_TAGS = 12;

// Un mot = suite de lettres ou de chiffres, éventuellement liée par des
// apostrophes ou des traits d'union internes. « l'orage » et « peut-être »
// comptent donc chacun pour UN mot : c'est bien une seule graphie à épeler.
const MOT = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;

// Les apostrophes typographiques saisies par le prof (ou collées depuis un
// traitement de texte) doivent valoir l'apostrophe droite.
function unifierApostrophes(s: string): string {
  return s.replace(/[‘’‛]/g, "'");
}

export function decouperEnMots(texte: string): MotDictee[] {
  const source = unifierApostrophes(texte ?? "");
  const mots: MotDictee[] = [];
  let finPrecedente = 0;

  MOT.lastIndex = 0;
  let trouve: RegExpExecArray | null;
  while ((trouve = MOT.exec(source)) !== null) {
    const separateur = source.slice(finPrecedente, trouve.index);
    // Ce qui suit immédiatement le mot précédent, avant le premier blanc, lui
    // est accolé (« ciel, » plutôt que « ciel » puis « , devint »).
    const blanc = separateur.search(/\s/);
    const colle = blanc === -1 ? separateur : separateur.slice(0, blanc);
    const reste = blanc === -1 ? "" : separateur.slice(blanc);

    if (mots.length > 0) mots[mots.length - 1].apres = colle;
    mots.push({
      index: mots.length,
      mot: trouve[0],
      avant: mots.length === 0 ? separateur : reste,
      apres: "",
    });
    finPrecedente = trouve.index + trouve[0].length;
  }

  if (mots.length > 0) mots[mots.length - 1].apres = source.slice(finPrecedente);
  return mots;
}

// Prépare une graphie pour la comparaison : apostrophes unifiées, espaces
// supprimés (le prof peut taper « d e v i n t » à mesure que l'élève épelle),
// puis casse et accents ignorés — c'est le réglage retenu pour l'épellation
// orale, où « E accent aigu » n'est pas toujours annoncé.
function preparer(graphie: string, garderTirets: boolean): string {
  let t = unifierApostrophes(graphie ?? "").replace(/\s+/g, "");
  // Les traits d'union ne sont retirés que si le mot attendu n'en contient
  // pas : sinon « peut-être » ne serait plus distinguable de « peutêtre ».
  if (!garderTirets) t = t.replace(/-/g, "");
  return normaliserReponse(t, { ignorerAccents: true, ignorerCasse: true });
}

export function comparerEpellation(saisie: string, attendu: string): boolean {
  const garderTirets = attendu.includes("-");
  const a = preparer(saisie, garderTirets);
  const b = preparer(attendu, garderTirets);
  return a !== "" && a === b;
}

// « #Passé Composé » → « passé-composé ». Les accents sont CONSERVÉS : le tag
// est aussi son libellé affiché, et « #passe-compose » se lit mal. La recherche
// passe par `replierTag` pour rester tolérante aux accents.
export function normaliserTag(brut: string): string {
  return unifierApostrophes(String(brut ?? ""))
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LONGUEUR_TAG)
    .replace(/-+$/, "");
}

export function normaliserTags(bruts: unknown): string[] {
  if (!Array.isArray(bruts)) return [];
  const vus = new Set<string>();
  const tags: string[] = [];
  for (const brut of bruts) {
    if (typeof brut !== "string") continue;
    const tag = normaliserTag(brut);
    if (!tag || vus.has(tag)) continue;
    vus.add(tag);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

// Forme repliée d'un tag, pour comparer sans accents : taper « passe » doit
// proposer « #passé-composé » dans l'autocomplétion.
export function replierTag(tag: string): string {
  return normaliserReponse(normaliserTag(tag), {
    ignorerAccents: true,
    ignorerCasse: true,
  });
}
