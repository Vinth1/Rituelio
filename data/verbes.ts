// Banque de verbes du jeu « Conjugaison ». Les formes ne sont plus écrites à la
// main : elles sont produites par `lib/conjugueur.ts` à partir des listes
// ci-dessous. C'est ce qui permet plus de 300 verbes conjugués aux 9 temps du
// programme de collège, sans fichier de 16 000 formes.
//
// POUR AJOUTER UN VERBE :
//   - 1er groupe (-er) ou 2e groupe (-ir/-issons) → ajouter l'infinitif dans la
//     liste correspondante. Les alternances orthographiques (nous plaçons, il
//     jette, j'achète, je cède…) sont gérées toutes seules par le moteur.
//   - verbe qui se construit avec « être » au passé composé → l'ajouter aussi à
//     AUXILIAIRE_ETRE.
//   - 3e groupe → il lui faut un modèle dans `data/verbes-irreguliers.ts` ; il
//     apparaît alors automatiquement dans la banque.
//
// Imports RELATIFS avec extension .ts : `npm test` exécute ce fichier avec le
// type-stripping de Node, qui ne connaît pas l'alias « @/ ».
import {
  conjuguer as conjuguerVerbe,
  conjuguerTout as conjuguerToutVerbe,
  type Auxiliaire,
  type Conjugaison,
  type EntreeVerbe,
  type Groupe,
} from "../lib/conjugueur.ts";
import { MODELES } from "./verbes-irreguliers.ts";

export type { Auxiliaire, Conjugaison, EntreeVerbe, Groupe };

// Verbes qui se construisent avec « être » aux temps composés (« je suis allé »).
// Les autres prennent « avoir ».
const AUXILIAIRE_ETRE = new Set([
  // 1er groupe
  "arriver",
  "entrer",
  "rentrer",
  "monter",
  "remonter",
  "rester",
  "retourner",
  "tomber",
  // 3e groupe
  "aller",
  "venir",
  "devenir",
  "revenir",
  "parvenir",
  "survenir",
  "intervenir",
  "partir",
  "repartir",
  "sortir",
  "naître",
  "mourir",
  "descendre",
]);

// ---------------------------------------------------------------------------
// 1er groupe — verbes en -er
// ---------------------------------------------------------------------------
// Les familles orthographiques sont mélangées volontairement : le moteur les
// reconnaît à la finale, et les regrouper ici n'apporterait rien au prof.

const PREMIER_GROUPE = [
  // --- Vie de la classe et du quotidien ---
  "aimer", "ajouter", "allumer", "apporter", "approcher", "arrêter", "arriver",
  "attraper", "augmenter", "baisser", "bavarder", "blesser", "border", "boucher",
  "bousculer", "briller", "brûler", "cacher", "calculer", "camper", "casser",
  "causer", "cesser", "chanter", "chasser", "chauffer", "chercher", "chuchoter",
  "classer", "coller", "commander", "comparer", "composer", "compter",
  "conseiller", "conserver", "consoler", "continuer", "copier", "coucher",
  "couper", "coûter", "créer", "creuser", "crier", "critiquer", "cuisiner",
  "danser", "décider", "déclarer", "décorer", "dépenser", "dessiner", "deviner",
  "dévorer", "discuter", "distribuer", "donner", "doubler", "écouter",
  "embrasser", "emporter", "enseigner", "entourer", "entrer", "envelopper",
  "étonner", "étudier", "éviter", "examiner", "exister", "expliquer",
  "exprimer", "fabriquer", "fâcher", "fatiguer", "fermer", "féliciter", "fêter",
  "filmer", "fixer", "former", "frapper", "frotter", "gagner", "garder",
  "glisser", "gommer", "goûter", "grimper", "gronder", "guider", "habiller",
  "habiter", "hésiter", "imaginer", "imiter", "indiquer", "informer",
  "installer", "inventer", "inviter", "jouer", "laisser", "laver", "lier",
  "livrer", "louer", "manquer", "marcher", "marquer", "mesurer", "monter",
  "montrer", "mouiller", "naviguer", "noter", "observer", "occuper", "oublier",
  "pardonner", "parler", "passer", "patiner", "pêcher", "pencher", "penser",
  "photographier", "piquer", "pleurer", "plier", "porter", "poser", "pousser",
  "préparer", "présenter", "prêter", "prier", "proposer", "quitter",
  "raconter", "ramasser", "rater", "réciter", "refuser", "regarder",
  "regretter", "remarquer", "remercier", "rencontrer", "renverser", "rentrer",
  "réparer", "reposer", "respecter", "respirer", "ressembler", "rester",
  "retourner", "réveiller", "rêver", "rouler", "sauter", "sauver", "sembler",
  "séparer", "serrer", "siffler", "signer", "soigner", "souffler", "souhaiter",
  "soupirer", "stationner", "supporter", "surveiller", "taper", "téléphoner",
  "terminer", "tirer", "tomber", "toucher", "tourner", "tousser", "traîner",
  "travailler", "traverser", "trembler", "tricher", "tromper", "trouver",
  "tuer", "utiliser", "vérifier", "verser", "viser", "visiter", "voler",

  // --- Verbes en -cer : nous plaçons, je plaçais ---
  "agacer", "annoncer", "avancer", "commencer", "déplacer", "effacer",
  "forcer", "lancer", "menacer", "percer", "placer", "prononcer", "remplacer",
  "renoncer", "rincer", "tracer",

  // --- Verbes en -ger : nous mangeons, je mangeais ---
  "arranger", "bouger", "changer", "charger", "corriger", "déranger",
  "diriger", "encourager", "juger", "loger", "manger", "mélanger", "nager",
  "négliger", "obliger", "partager", "plonger", "ranger", "songer", "venger",
  "voyager",

  // --- Verbes en -yer : j'emploie, je nettoierai ---
  "aboyer", "appuyer", "balayer", "effrayer", "employer", "ennuyer", "essayer",
  "essuyer", "nettoyer", "payer", "tutoyer",

  // --- Verbes en -eler / -eter : il jette, j'appelle ---
  "appeler", "atteler", "épeler", "étinceler", "feuilleter", "jeter",
  "rappeler", "rejeter", "renouveler",

  // --- …et ceux de la liste à accent grave : j'achète, je gèle ---
  "acheter", "congeler", "geler", "haleter", "marteler", "modeler", "peler",
  "racheter",

  // --- Type « lever » : e devient è (je lève, nous levons) ---
  "achever", "amener", "élever", "emmener", "enlever", "lever", "mener",
  "peser", "promener", "ramener", "semer", "soulever",

  // --- Type « céder » : é devient è au présent, mais je céderai ---
  "célébrer", "céder", "compléter", "considérer", "espérer", "inquiéter",
  "libérer", "posséder", "préférer", "protéger", "récupérer", "régler",
  "répéter", "révéler", "sécher", "suggérer",
];

// « envoyer » : présent régulier en -yer, mais futur en « enverr- ». Seul verbe
// du 1er groupe à réclamer un modèle.
const PREMIER_GROUPE_A_MODELE = ["envoyer"];

// ---------------------------------------------------------------------------
// 2e groupe — verbes en -ir qui font « nous -issons »
// ---------------------------------------------------------------------------

const DEUXIEME_GROUPE = [
  "aboutir", "accomplir", "adoucir", "agir", "applaudir", "atterrir",
  "avertir", "bâtir", "blanchir", "bondir", "choisir", "définir", "démolir",
  "désobéir", "durcir", "élargir", "embellir", "envahir", "épaissir",
  "établir", "finir", "fleurir", "fournir", "franchir", "garantir", "grandir",
  "grossir", "guérir", "jaunir", "maigrir", "mûrir", "munir", "noircir",
  "nourrir", "obéir", "obscurcir", "pâlir", "punir", "rajeunir", "ralentir",
  "réagir", "réfléchir", "refroidir", "remplir", "rétrécir", "réunir",
  "réussir", "rougir", "saisir", "salir", "subir", "surgir", "trahir", "unir",
  "verdir", "vieillir",
];

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------

function entree(infinitif: string, groupe: Groupe, modele?: string): EntreeVerbe {
  const e: EntreeVerbe = { infinitif, groupe };
  if (modele) e.modele = modele;
  if (AUXILIAIRE_ETRE.has(infinitif)) e.auxiliaire = "être";
  return e;
}

// Le 3e groupe, c'est exactement la table des modèles : chaque modèle porte le
// nom de son verbe. Construire la liste comme ça garantit qu'aucune entrée ne
// pointe vers un modèle inexistant.
const TROISIEME_GROUPE = Object.keys(MODELES)
  .filter((inf) => !PREMIER_GROUPE_A_MODELE.includes(inf))
  .sort((a, b) => a.localeCompare(b, "fr"));

export const verbes: EntreeVerbe[] = [
  ...PREMIER_GROUPE.map((inf) => entree(inf, "1er groupe")),
  ...PREMIER_GROUPE_A_MODELE.map((inf) => entree(inf, "1er groupe", inf)),
  ...DEUXIEME_GROUPE.map((inf) => entree(inf, "2e groupe")),
  ...TROISIEME_GROUPE.map((inf) => entree(inf, "3e groupe", inf)),
].sort((a, b) => a.infinitif.localeCompare(b.infinitif, "fr"));

// Index par infinitif : la recherche d'un verbe est sur le chemin de la
// correction serveur, on évite un parcours linéaire.
const PAR_INFINITIF = new Map(verbes.map((v) => [v.infinitif, v]));

export function trouverEntree(infinitif: string): EntreeVerbe | null {
  return PAR_INFINITIF.get(infinitif.trim().toLowerCase()) ?? null;
}

// Conjugue une entrée de la banque (ou un verbe personnalisé) en lui passant la
// table des modèles — évite à chaque appelant de l'importer.
export function conjuguer(
  v: EntreeVerbe,
  temps: string,
  mode: string,
): Conjugaison | null {
  return conjuguerVerbe(v, temps, mode, MODELES);
}

export function conjuguerTout(v: EntreeVerbe): Conjugaison[] {
  return conjuguerToutVerbe(v, MODELES);
}
