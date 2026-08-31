// Tests du moteur de conjugaison. C'est LE garde-fou du projet : la banque de
// verbes est générée, donc une règle fausse se propage à des centaines de mots
// d'un coup. On teste une famille orthographique par cas, puis chaque modèle
// irrégulier sur ses formes réputées piégeuses.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TEMPS_COLLEGE,
  accordsParticipe,
  cleTempsMode,
  conjuguer,
  conjuguerTout,
  groupeDevine,
  tempsModeDepuisCle,
  type Auxiliaire,
  type EntreeVerbe,
} from "./conjugueur.ts";
import { MODELES } from "../data/verbes-irreguliers.ts";

// --- Fabriques d'entrées de test ---
const er = (infinitif: string): EntreeVerbe => ({ infinitif, groupe: "1er groupe" });
const ir2 = (infinitif: string): EntreeVerbe => ({ infinitif, groupe: "2e groupe" });
const irr = (
  infinitif: string,
  modele = infinitif,
  auxiliaire?: Auxiliaire,
): EntreeVerbe => ({ infinitif, groupe: "3e groupe", modele, auxiliaire });

// Formes d'un verbe à un temps donné.
function f(v: EntreeVerbe, temps: string, mode = "indicatif"): string[] {
  const c = conjuguer(v, temps, mode, MODELES);
  assert.ok(c, `${v.infinitif} : ${mode} ${temps} introuvable`);
  return c.formes;
}

// Une seule personne (0 = je … 5 = ils).
function p(v: EntreeVerbe, temps: string, i: number, mode = "indicatif"): string {
  return f(v, temps, mode)[i];
}

// ===========================================================================
// 1er groupe — les familles orthographiques
// ===========================================================================

test("1er groupe régulier : parler à tous les temps", () => {
  const v = er("parler");
  assert.deepEqual(f(v, "présent"), [
    "parle", "parles", "parle", "parlons", "parlez", "parlent",
  ]);
  assert.deepEqual(f(v, "imparfait"), [
    "parlais", "parlais", "parlait", "parlions", "parliez", "parlaient",
  ]);
  assert.deepEqual(f(v, "futur simple"), [
    "parlerai", "parleras", "parlera", "parlerons", "parlerez", "parleront",
  ]);
  assert.deepEqual(f(v, "passé simple"), [
    "parlai", "parlas", "parla", "parlâmes", "parlâtes", "parlèrent",
  ]);
  assert.deepEqual(f(v, "passé composé"), [
    "ai parlé", "as parlé", "a parlé", "avons parlé", "avez parlé", "ont parlé",
  ]);
  assert.deepEqual(f(v, "plus-que-parfait"), [
    "avais parlé", "avais parlé", "avait parlé",
    "avions parlé", "aviez parlé", "avaient parlé",
  ]);
  assert.deepEqual(f(v, "présent", "conditionnel"), [
    "parlerais", "parlerais", "parlerait",
    "parlerions", "parleriez", "parleraient",
  ]);
  assert.deepEqual(f(v, "présent", "subjonctif"), [
    "parle", "parles", "parle", "parlions", "parliez", "parlent",
  ]);
});

test("verbes en -cer : la cédille n'apparaît que devant a et o", () => {
  const v = er("placer");
  assert.equal(p(v, "présent", 3), "plaçons");
  assert.equal(p(v, "présent", 4), "placez");
  assert.equal(p(v, "imparfait", 0), "plaçais");
  assert.equal(p(v, "imparfait", 3), "placions"); // « ions » : pas de cédille
  assert.equal(p(v, "passé simple", 0), "plaçai");
  assert.equal(p(v, "passé simple", 3), "plaçâmes"); // « âmes » compte comme un a
  assert.equal(p(v, "passé simple", 5), "placèrent"); // « èrent » : pas de cédille
});

test("verbes en -ger : le e de soutien n'apparaît que devant a et o", () => {
  const v = er("manger");
  assert.equal(p(v, "présent", 3), "mangeons");
  assert.equal(p(v, "imparfait", 0), "mangeais");
  assert.equal(p(v, "imparfait", 3), "mangions");
  assert.equal(p(v, "passé simple", 3), "mangeâmes");
  assert.equal(p(v, "passé simple", 5), "mangèrent");
  assert.equal(p(v, "futur simple", 0), "mangerai");
});

test("protéger cumule les deux règles : -ger ET é → è", () => {
  const v = er("protéger");
  assert.equal(p(v, "présent", 0), "protège");
  assert.equal(p(v, "présent", 3), "protégeons");
  assert.equal(p(v, "présent", 5), "protègent");
  assert.equal(p(v, "futur simple", 0), "protégerai");
});

test("verbes en -yer : y devient i devant un e muet", () => {
  const v = er("nettoyer");
  assert.equal(p(v, "présent", 0), "nettoie");
  assert.equal(p(v, "présent", 3), "nettoyons");
  assert.equal(p(v, "présent", 5), "nettoient");
  assert.equal(p(v, "futur simple", 0), "nettoierai");
});

test("verbes en -ayer : « je paie » et « je paye » sont tous deux justes", () => {
  const v = er("payer");
  const c = conjuguer(v, "présent", "indicatif", MODELES);
  assert.ok(c);
  assert.equal(c.formes[0], "paie");
  assert.deepEqual(c.variantes?.[0], ["paye"]);
  assert.equal(c.formes[3], "payons");
  assert.equal(c.variantes?.[3], undefined);
});

test("verbes en -eler/-eter : doublement de la consonne", () => {
  const appeler = er("appeler");
  assert.equal(p(appeler, "présent", 0), "appelle");
  assert.equal(p(appeler, "présent", 3), "appelons");
  assert.equal(p(appeler, "futur simple", 0), "appellerai");

  const jeter = er("jeter");
  assert.equal(p(jeter, "présent", 0), "jette");
  assert.equal(p(jeter, "présent", 3), "jetons");
  assert.equal(p(jeter, "futur simple", 0), "jetterai");
});

test("verbes en -eler/-eter de la liste d'exception : accent grave", () => {
  const acheter = er("acheter");
  assert.equal(p(acheter, "présent", 0), "achète");
  assert.equal(p(acheter, "présent", 3), "achetons");
  assert.equal(p(acheter, "futur simple", 0), "achèterai");

  const geler = er("geler");
  assert.equal(p(geler, "présent", 0), "gèle");
  assert.equal(p(geler, "futur simple", 0), "gèlerai");
});

test("type lever : e devient è devant une syllabe muette", () => {
  const v = er("lever");
  assert.equal(p(v, "présent", 0), "lève");
  assert.equal(p(v, "présent", 3), "levons");
  assert.equal(p(v, "futur simple", 0), "lèverai");
  assert.equal(p(v, "présent", 3, "subjonctif"), "levions");
});

test("type céder : è au présent, mais é conservé au futur", () => {
  const v = er("céder");
  assert.equal(p(v, "présent", 0), "cède");
  assert.equal(p(v, "présent", 3), "cédons");
  assert.equal(p(v, "présent", 5), "cèdent");
  // Orthographe traditionnelle, celle des manuels de collège.
  assert.equal(p(v, "futur simple", 0), "céderai");
  assert.equal(p(v, "présent", 0, "conditionnel"), "céderais");
});

test("répéter : le é l'emporte sur la règle -eter (pas « répette »)", () => {
  const v = er("répéter");
  assert.equal(p(v, "présent", 0), "répète");
  assert.equal(p(v, "présent", 3), "répétons");
});

test("regretter : le tt de l'infinitif ne déclenche aucun accent", () => {
  const v = er("regretter");
  assert.equal(p(v, "présent", 0), "regrette");
  assert.equal(p(v, "présent", 3), "regrettons");
  assert.equal(p(v, "futur simple", 0), "regretterai");
});

test("envoyer : présent régulier en -yer, mais futur en enverr-", () => {
  const v: EntreeVerbe = { infinitif: "envoyer", groupe: "1er groupe", modele: "envoyer" };
  assert.equal(p(v, "présent", 0), "envoie");
  assert.equal(p(v, "présent", 3), "envoyons");
  assert.equal(p(v, "futur simple", 0), "enverrai");
  assert.equal(p(v, "passé simple", 0), "envoyai");
});

// ===========================================================================
// 2e groupe
// ===========================================================================

test("2e groupe : finir à tous les temps", () => {
  const v = ir2("finir");
  assert.deepEqual(f(v, "présent"), [
    "finis", "finis", "finit", "finissons", "finissez", "finissent",
  ]);
  assert.deepEqual(f(v, "imparfait"), [
    "finissais", "finissais", "finissait",
    "finissions", "finissiez", "finissaient",
  ]);
  // Piège classique : au passé simple, les 3 premières personnes sont
  // identiques à celles du présent.
  assert.deepEqual(f(v, "passé simple"), [
    "finis", "finis", "finit", "finîmes", "finîtes", "finirent",
  ]);
  assert.equal(p(v, "futur simple", 0), "finirai");
  assert.equal(p(v, "présent", 0, "subjonctif"), "finisse");
  assert.equal(p(v, "passé composé", 0), "ai fini");
});

// ===========================================================================
// Auxiliaires et grands irréguliers
// ===========================================================================

test("être : le seul verbe dont l'imparfait ne sort pas du « nous »", () => {
  const v = irr("être");
  assert.deepEqual(f(v, "présent"), ["suis", "es", "est", "sommes", "êtes", "sont"]);
  assert.deepEqual(f(v, "imparfait"), [
    "étais", "étais", "était", "étions", "étiez", "étaient",
  ]);
  assert.deepEqual(f(v, "passé simple"), [
    "fus", "fus", "fut", "fûmes", "fûtes", "furent",
  ]);
  assert.equal(p(v, "futur simple", 0), "serai");
  assert.equal(p(v, "présent", 0, "conditionnel"), "serais");
  assert.deepEqual(f(v, "présent", "subjonctif"), [
    "sois", "sois", "soit", "soyons", "soyez", "soient",
  ]);
  assert.equal(p(v, "passé composé", 0), "ai été");
});

test("avoir", () => {
  const v = irr("avoir");
  assert.deepEqual(f(v, "présent"), ["ai", "as", "a", "avons", "avez", "ont"]);
  assert.equal(p(v, "imparfait", 0), "avais");
  assert.equal(p(v, "passé simple", 0), "eus");
  assert.equal(p(v, "futur simple", 0), "aurai");
  assert.deepEqual(f(v, "présent", "subjonctif"), [
    "aie", "aies", "ait", "ayons", "ayez", "aient",
  ]);
});

test("aller : futur en ir-, passé simple du 1er groupe, auxiliaire être", () => {
  const v = irr("aller");
  assert.deepEqual(f(v, "présent"), ["vais", "vas", "va", "allons", "allez", "vont"]);
  assert.equal(p(v, "imparfait", 0), "allais");
  assert.equal(p(v, "passé simple", 0), "allai");
  assert.equal(p(v, "futur simple", 0), "irai");
  assert.equal(p(v, "présent", 0, "conditionnel"), "irais");
  assert.deepEqual(f(v, "présent", "subjonctif"), [
    "aille", "ailles", "aille", "allions", "alliez", "aillent",
  ]);
  assert.deepEqual(f(v, "passé composé"), [
    "suis allé", "es allé", "est allé",
    "sommes allés", "êtes allés", "sont allés",
  ]);
});

test("faire : « vous faites », « ils font », futur fer-, subjonctif fass-", () => {
  const v = irr("faire");
  assert.deepEqual(f(v, "présent"), [
    "fais", "fais", "fait", "faisons", "faites", "font",
  ]);
  assert.equal(p(v, "imparfait", 0), "faisais");
  assert.equal(p(v, "passé simple", 0), "fis");
  assert.equal(p(v, "futur simple", 0), "ferai");
  assert.equal(p(v, "présent", 0, "subjonctif"), "fasse");
});

test("dire : « vous dites », mais « vous contredisez »", () => {
  assert.equal(p(irr("dire"), "présent", 4), "dites");
  assert.equal(p(irr("redire"), "présent", 4), "redites");
  assert.equal(p(irr("contredire"), "présent", 4), "contredisez");
});

test("prendre : « il prend » sans terminaison, subjonctif prenn-/pren-", () => {
  const v = irr("prendre");
  assert.deepEqual(f(v, "présent"), [
    "prends", "prends", "prend", "prenons", "prenez", "prennent",
  ]);
  assert.equal(p(v, "imparfait", 0), "prenais");
  assert.equal(p(v, "passé simple", 0), "pris");
  assert.equal(p(v, "futur simple", 0), "prendrai");
  assert.deepEqual(f(v, "présent", "subjonctif"), [
    "prenne", "prennes", "prenne", "prenions", "preniez", "prennent",
  ]);
  assert.equal(p(v, "passé composé", 0), "ai pris");
});

test("venir et tenir : passé simple en -ins", () => {
  const venir = irr("venir");
  assert.deepEqual(f(venir, "passé simple"), [
    "vins", "vins", "vint", "vînmes", "vîntes", "vinrent",
  ]);
  assert.equal(p(venir, "futur simple", 0), "viendrai");
  assert.equal(p(venir, "présent", 0, "subjonctif"), "vienne");
  assert.equal(p(venir, "présent", 3, "subjonctif"), "venions");
  assert.equal(p(venir, "passé composé", 0), "suis venu");

  const tenir = irr("tenir");
  assert.equal(p(tenir, "passé simple", 0), "tins");
  assert.equal(p(tenir, "futur simple", 0), "tiendrai");
  assert.equal(p(tenir, "passé composé", 0), "ai tenu"); // tenir prend avoir
});

test("verbes en -oir", () => {
  const pouvoir = irr("pouvoir");
  assert.deepEqual(f(pouvoir, "présent"), [
    "peux", "peux", "peut", "pouvons", "pouvez", "peuvent",
  ]);
  assert.equal(p(pouvoir, "futur simple", 0), "pourrai");
  assert.equal(p(pouvoir, "passé simple", 0), "pus");
  assert.equal(p(pouvoir, "présent", 0, "subjonctif"), "puisse");
  assert.equal(conjuguer(pouvoir, "présent", "impératif", MODELES), null);

  const vouloir = irr("vouloir");
  assert.equal(p(vouloir, "futur simple", 0), "voudrai");
  assert.equal(p(vouloir, "présent", 0, "subjonctif"), "veuille");
  assert.equal(p(vouloir, "présent", 3, "subjonctif"), "voulions");

  const savoir = irr("savoir");
  assert.equal(p(savoir, "futur simple", 0), "saurai");
  assert.equal(p(savoir, "présent", 3, "subjonctif"), "sachions");

  const voir = irr("voir");
  assert.equal(p(voir, "futur simple", 0), "verrai");
  assert.equal(p(voir, "passé simple", 0), "vis");
  assert.equal(p(voir, "présent", 0, "subjonctif"), "voie");
  assert.equal(p(voir, "présent", 3, "subjonctif"), "voyions");

  const devoir = irr("devoir");
  assert.equal(p(devoir, "passé composé", 0), "ai dû");
  assert.equal(p(devoir, "futur simple", 0), "devrai");

  const recevoir = irr("recevoir");
  assert.deepEqual(f(recevoir, "présent"), [
    "reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent",
  ]);
  assert.equal(p(recevoir, "passé simple", 0), "reçus");
  assert.equal(p(recevoir, "présent", 3, "subjonctif"), "recevions");

  const valoir = irr("valoir");
  assert.equal(p(valoir, "futur simple", 0), "vaudrai");
  assert.equal(p(valoir, "présent", 0, "subjonctif"), "vaille");
});

test("familles construites : -endre, -indre, -uire, -aître, -crire, -ttre", () => {
  assert.deepEqual(f(irr("rendre"), "présent"), [
    "rends", "rends", "rend", "rendons", "rendez", "rendent",
  ]);
  assert.equal(p(irr("rendre"), "passé composé", 0), "ai rendu");
  assert.equal(p(irr("répondre"), "présent", 2), "répond");
  assert.equal(p(irr("perdre"), "passé composé", 0), "ai perdu");

  assert.deepEqual(f(irr("craindre"), "présent"), [
    "crains", "crains", "craint", "craignons", "craignez", "craignent",
  ]);
  assert.equal(p(irr("craindre"), "passé composé", 0), "ai craint");
  assert.equal(p(irr("peindre"), "présent", 3), "peignons");
  assert.equal(p(irr("joindre"), "présent", 2), "joint");
  assert.equal(p(irr("atteindre"), "présent", 2), "atteint");

  assert.deepEqual(f(irr("conduire"), "présent"), [
    "conduis", "conduis", "conduit", "conduisons", "conduisez", "conduisent",
  ]);
  assert.equal(p(irr("conduire"), "passé simple", 0), "conduisis");
  assert.equal(p(irr("cuire"), "présent", 2), "cuit");

  assert.deepEqual(f(irr("connaître"), "présent"), [
    "connais", "connais", "connaît", "connaissons", "connaissez", "connaissent",
  ]);
  assert.equal(p(irr("connaître"), "passé simple", 0), "connus");
  assert.equal(p(irr("paraître"), "présent", 2), "paraît");

  assert.deepEqual(f(irr("écrire"), "présent"), [
    "écris", "écris", "écrit", "écrivons", "écrivez", "écrivent",
  ]);
  assert.equal(p(irr("écrire"), "passé simple", 0), "écrivis");
  assert.equal(p(irr("écrire"), "passé composé", 0), "ai écrit");
  assert.equal(p(irr("décrire"), "présent", 3), "décrivons");

  assert.deepEqual(f(irr("mettre"), "présent"), [
    "mets", "mets", "met", "mettons", "mettez", "mettent",
  ]);
  assert.equal(p(irr("mettre"), "passé simple", 0), "mis");
  assert.equal(p(irr("battre"), "présent", 2), "bat");
  assert.equal(p(irr("battre"), "passé composé", 0), "ai battu");

  assert.deepEqual(f(irr("partir"), "présent"), [
    "pars", "pars", "part", "partons", "partez", "partent",
  ]);
  assert.equal(p(irr("dormir"), "présent", 2), "dort");
  assert.equal(p(irr("servir"), "présent", 2), "sert");
  assert.equal(p(irr("sentir"), "présent", 2), "sent");

  assert.deepEqual(f(irr("ouvrir"), "présent"), [
    "ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent",
  ]);
  assert.equal(p(irr("ouvrir"), "passé composé", 0), "ai ouvert");
  assert.equal(p(irr("offrir"), "passé composé", 0), "ai offert");
  assert.equal(p(irr("souffrir"), "présent", 0), "souffre");
  assert.equal(p(irr("souffrir"), "passé composé", 0), "ai souffert");
  assert.equal(p(irr("cueillir"), "futur simple", 0), "cueillerai");
});

test("irréguliers isolés", () => {
  assert.equal(p(irr("boire"), "présent", 3), "buvons");
  assert.equal(p(irr("boire"), "imparfait", 0), "buvais");
  assert.equal(p(irr("boire"), "présent", 0, "subjonctif"), "boive");
  assert.equal(p(irr("boire"), "présent", 3, "subjonctif"), "buvions");

  assert.equal(p(irr("croire"), "présent", 3), "croyons");
  assert.equal(p(irr("croire"), "présent", 0, "subjonctif"), "croie");

  assert.equal(p(irr("vivre"), "passé simple", 0), "vécus");
  assert.equal(p(irr("suivre"), "passé composé", 0), "ai suivi");
  assert.equal(p(irr("courir"), "futur simple", 0), "courrai");
  assert.equal(p(irr("mourir"), "futur simple", 0), "mourrai");
  assert.equal(p(irr("mourir"), "présent", 0), "meurs");
  assert.equal(p(irr("rire"), "imparfait", 0), "riais");
  assert.equal(p(irr("rire"), "présent", 3, "subjonctif"), "riions");
  assert.equal(p(irr("vaincre"), "présent", 2), "vainc");
  assert.equal(p(irr("vaincre"), "présent", 3), "vainquons");
  assert.equal(p(irr("haïr"), "présent", 2), "hait");
  assert.equal(p(irr("haïr"), "présent", 3), "haïssons");
  assert.equal(p(irr("fuir"), "présent", 3), "fuyons");
  assert.equal(p(irr("apercevoir"), "présent", 0), "aperçois");
});

test("verbes composés bâtis par préfixation", () => {
  assert.equal(p(irr("apprendre"), "présent", 2), "apprend");
  assert.equal(p(irr("apprendre"), "passé composé", 0), "ai appris");
  assert.equal(p(irr("comprendre"), "présent", 5), "comprennent");
  assert.equal(p(irr("devenir"), "futur simple", 0), "deviendrai");
  assert.equal(p(irr("devenir"), "passé simple", 0), "devins");
  assert.equal(p(irr("obtenir"), "présent", 2), "obtient");
  assert.equal(p(irr("permettre"), "passé composé", 0), "ai permis");
  assert.equal(p(irr("reconnaître"), "présent", 2), "reconnaît");
  assert.equal(p(irr("disparaître"), "présent", 2), "disparaît");
  assert.equal(p(irr("sourire"), "présent", 0), "souris");
  assert.equal(p(irr("refaire"), "présent", 4), "refaites");
});

// ===========================================================================
// Naissance, mort et accord du participe passé
// ===========================================================================

test("naître : passé simple en naqu-, participe « né », auxiliaire être", () => {
  const v = irr("naître");
  assert.equal(p(v, "présent", 2), "naît");
  assert.equal(p(v, "passé simple", 0), "naquis");
  assert.deepEqual(f(v, "passé composé"), [
    "suis né", "es né", "est né", "sommes nés", "êtes nés", "sont nés",
  ]);
});

test("accordsParticipe : masculin, féminin, pluriels", () => {
  assert.deepEqual(accordsParticipe("allé"), {
    ms: "allé", fs: "allée", mp: "allés", fp: "allées",
  });
  // Un participe déjà terminé par s ou x ne prend pas de s de plus.
  assert.deepEqual(accordsParticipe("pris"), {
    ms: "pris", fs: "prise", mp: "pris", fp: "prises",
  });
  assert.deepEqual(accordsParticipe("mort"), {
    ms: "mort", fs: "morte", mp: "morts", fp: "mortes",
  });
  // « dû » perd son circonflexe au féminin : d'où le champ explicite.
  assert.deepEqual(accordsParticipe("dû", "due"), {
    ms: "dû", fs: "due", mp: "dûs", fp: "dues",
  });
});

test("participe passé : le féminin est accepté en variante après « être »", () => {
  const c = conjuguer(irr("aller"), "passé composé", "indicatif", MODELES);
  assert.ok(c);
  assert.equal(c.formes[0], "suis allé");
  assert.deepEqual(c.variantes?.[0], ["suis allée"]);
  assert.equal(c.formes[3], "sommes allés");
  assert.deepEqual(c.variantes?.[3], ["sommes allées"]);
  // « vous » accepte aussi le singulier : vouvoiement de politesse.
  assert.deepEqual(c.variantes?.[4], ["êtes allées", "êtes allé", "êtes allée"]);
});

test("participe passé : avec « avoir », aucune variante", () => {
  const c = conjuguer(er("parler"), "passé composé", "indicatif", MODELES);
  assert.ok(c);
  assert.equal(c.variantes, undefined);
});

test("l'auxiliaire de l'entrée prime sur celui du modèle", () => {
  // « descendre » se conjugue comme « rendre » mais se construit avec être.
  const v = irr("descendre", "descendre", "être");
  assert.equal(p(v, "passé composé", 0), "suis descendu");
  assert.equal(p(v, "passé composé", 3), "sommes descendus");
  // Sans surcharge, le modèle garde « avoir ».
  assert.equal(p(irr("rendre"), "passé composé", 0), "ai rendu");
});

// ===========================================================================
// Impératif
// ===========================================================================

test("impératif : trois lignes seulement, et chute du -s après « es »", () => {
  const c = conjuguer(er("manger"), "présent", "impératif", MODELES);
  assert.ok(c);
  assert.deepEqual(c.lignes, [1, 3, 4]);
  assert.equal(c.formes[1], "mange"); // « tu manges » → « mange »
  assert.equal(c.formes[3], "mangeons");
  assert.equal(c.formes[4], "mangez");

  // La règle porte sur la forme du présent, pas sur l'infinitif : ouvrir se
  // conjugue comme un -er, donc il perd aussi son -s.
  assert.equal(f(irr("ouvrir"), "présent", "impératif")[1], "ouvre");
  // …tandis que finir et prendre le gardent.
  assert.equal(f(ir2("finir"), "présent", "impératif")[1], "finis");
  assert.equal(f(irr("prendre"), "présent", "impératif")[1], "prends");
  // Exceptions stockées en clair.
  assert.equal(f(irr("aller"), "présent", "impératif")[1], "va");
  assert.equal(f(irr("être"), "présent", "impératif")[1], "sois");
  assert.equal(f(irr("avoir"), "présent", "impératif")[3], "ayons");
  assert.equal(f(irr("savoir"), "présent", "impératif")[1], "sache");
});

// ===========================================================================
// API
// ===========================================================================

test("cleTempsMode fait l'aller-retour", () => {
  for (const tm of TEMPS_COLLEGE) {
    assert.deepEqual(tempsModeDepuisCle(cleTempsMode(tm)), {
      temps: tm.temps,
      mode: tm.mode,
    });
  }
});

test("groupeDevine : heuristique du verbe personnalisé", () => {
  assert.equal(groupeDevine("chanter"), "1er groupe");
  assert.equal(groupeDevine("bondir"), "2e groupe");
  assert.equal(groupeDevine("résoudre"), "3e groupe");
});

test("les formes corrigées à la main écrasent le moteur", () => {
  const v: EntreeVerbe = {
    infinitif: "bouillir",
    groupe: "2e groupe",
    formesCorrigees: {
      [cleTempsMode({ temps: "présent", mode: "indicatif" })]: [
        "bous", "bous", "bout", "bouillons", "bouillez", "bouillent",
      ],
    },
  };
  assert.equal(p(v, "présent", 2), "bout");
  // Les autres temps restent produits par le moteur.
  assert.equal(p(v, "futur simple", 0), "bouillirai");
});

test("un 3e groupe sans modèle ne se conjugue pas (le prof saisit les formes)", () => {
  const v: EntreeVerbe = { infinitif: "résoudre", groupe: "3e groupe" };
  assert.equal(conjuguer(v, "présent", "indicatif", MODELES), null);
});

// ===========================================================================
// Cohérence de la table des modèles
// ===========================================================================

test("chaque modèle est complet et se conjugue sans trou", () => {
  const noms = Object.keys(MODELES);
  assert.ok(noms.length >= 80, `seulement ${noms.length} modèles`);

  for (const nom of noms) {
    const m = MODELES[nom];
    assert.equal(m.present.length, 6, `${nom} : présent incomplet`);
    for (const forme of m.present) {
      assert.ok(forme.length > 0, `${nom} : forme de présent vide`);
    }
    assert.ok(m.participePasse.length > 0, `${nom} : participe passé manquant`);
    assert.ok(m.radicalFutur.length > 0, `${nom} : radical du futur manquant`);
    assert.ok(m.radicalPasseSimple.length > 0, `${nom} : radical du passé simple manquant`);
    assert.ok(
      ["a", "i", "u", "in"].includes(m.voyellePasseSimple),
      `${nom} : voyelle de passé simple inconnue`,
    );

    // Toutes les cases du verbe doivent sortir remplies.
    const cases = conjuguerTout(irr(nom), MODELES);
    assert.ok(cases.length >= 8, `${nom} : ${cases.length} temps seulement`);
    for (const c of cases) {
      for (const i of c.lignes) {
        assert.ok(
          c.formes[i].trim().length > 0,
          `${nom} : ${c.mode} ${c.temps}, ligne ${i} vide`,
        );
      }
    }
  }
});

test("aucun modèle composé ne recopie mot pour mot un préfixe fautif", () => {
  // Garde-fou : ces trois-là ne sont PAS des préfixations de leur voisin.
  assert.equal(MODELES.souffrir.present[0], "souffre");
  assert.equal(MODELES.décrire.present[3], "décrivons");
  assert.equal(MODELES.apercevoir.present[0], "aperçois");
});
