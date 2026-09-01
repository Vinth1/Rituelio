// Tests de la logique pure de la dictée (`npm test`).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comparerEpellation,
  decouperEnMots,
  normaliserTag,
  normaliserTags,
  replierTag,
} from "./dictee.ts";

// Le texte doit pouvoir être réaffiché à l'identique en concaténant les mots
// et ce qui les entoure : c'est ce qui permet de masquer mot à mot.
function recomposer(texte: string): string {
  return decouperEnMots(texte)
    .map((m) => m.avant + m.mot + m.apres)
    .join("");
}

test("decouperEnMots : découpe une phrase simple", () => {
  const mots = decouperEnMots("Le ciel devint soudain noir.");
  assert.deepEqual(
    mots.map((m) => m.mot),
    ["Le", "ciel", "devint", "soudain", "noir"],
  );
  assert.deepEqual(
    mots.map((m) => m.index),
    [0, 1, 2, 3, 4],
  );
});

test("decouperEnMots : la ponctuation est accolée au mot qu'elle suit", () => {
  const mots = decouperEnMots("Le ciel, soudain, devint noir.");
  assert.equal(mots[1].mot, "ciel");
  assert.equal(mots[1].apres, ",");
  assert.equal(mots[2].avant, " ");
  assert.equal(mots.at(-1)?.apres, ".");
});

test("decouperEnMots : apostrophe et trait d'union font un seul mot", () => {
  assert.deepEqual(
    decouperEnMots("L'orage s'annonce peut-être.").map((m) => m.mot),
    ["L'orage", "s'annonce", "peut-être"],
  );
});

test("decouperEnMots : l'apostrophe typographique vaut l'apostrophe droite", () => {
  assert.deepEqual(
    decouperEnMots("L’orage").map((m) => m.mot),
    ["L'orage"],
  );
});

test("decouperEnMots : les guillemets ouvrants restent devant le mot", () => {
  const mots = decouperEnMots('Il dit « bonjour » puis partit.');
  const bonjour = mots.find((m) => m.mot === "bonjour");
  assert.equal(bonjour?.avant, " « ");
  assert.equal(bonjour?.apres, "");
});

test("decouperEnMots : les retours à la ligne sont conservés", () => {
  const texte = "Premier paragraphe.\n\nSecond paragraphe.";
  assert.equal(recomposer(texte), texte);
  assert.equal(decouperEnMots(texte).length, 4);
});

test("decouperEnMots : le texte est recomposable à l'identique", () => {
  const texte = "  Le ciel, « soudain » devint noir : l'orage montait !  ";
  assert.equal(recomposer(texte), texte);
});

test("decouperEnMots : texte vide ou sans mot", () => {
  assert.deepEqual(decouperEnMots(""), []);
  assert.deepEqual(decouperEnMots("   ...   "), []);
});

test("comparerEpellation : casse et accents sont ignorés", () => {
  assert.equal(comparerEpellation("Elodie", "Élodie"), true);
  assert.equal(comparerEpellation("élodie", "Élodie"), true);
  assert.equal(comparerEpellation("ELODIE", "Élodie"), true);
});

test("comparerEpellation : une lettre en moins est fausse", () => {
  assert.equal(comparerEpellation("Élodi", "Élodie"), false);
  assert.equal(comparerEpellation("devin", "devint"), false);
});

test("comparerEpellation : les lettres peuvent être espacées", () => {
  assert.equal(comparerEpellation("d e v i n t", "devint"), true);
  assert.equal(comparerEpellation("  devint  ", "devint"), true);
});

test("comparerEpellation : une saisie vide n'est jamais juste", () => {
  assert.equal(comparerEpellation("", "devint"), false);
  assert.equal(comparerEpellation("   ", "devint"), false);
});

test("comparerEpellation : le trait d'union du mot attendu compte", () => {
  assert.equal(comparerEpellation("peut-être", "peut-être"), true);
  assert.equal(comparerEpellation("peutetre", "peut-être"), false);
});

test("comparerEpellation : un trait d'union en trop est ignoré si le mot n'en a pas", () => {
  assert.equal(comparerEpellation("d-e-v-i-n-t", "devint"), true);
});

test("comparerEpellation : l'apostrophe est comparée, quel que soit son tracé", () => {
  assert.equal(comparerEpellation("l’orage", "L'orage"), true);
  assert.equal(comparerEpellation("lorage", "L'orage"), false);
});

test("normaliserTag : minuscules, dièse retiré, espaces en traits d'union", () => {
  assert.equal(normaliserTag("#Passé Composé"), "passé-composé");
  assert.equal(normaliserTag("  #IMPARFAIT  "), "imparfait");
  assert.equal(
    normaliserTag("compléments circonstanciels"),
    "compléments-circonstanciels",
  );
});

test("normaliserTag : les accents sont conservés", () => {
  assert.equal(normaliserTag("présent"), "présent");
});

test("normaliserTag : ponctuation et tirets superflus disparaissent", () => {
  assert.equal(normaliserTag("### "), "");
  assert.equal(normaliserTag("--adjectifs--"), "adjectifs");
  assert.equal(normaliserTag("accord du participe passé !"), "accord-du-participe-passé");
});

test("normaliserTag : la longueur est bornée, sans trait d'union final", () => {
  assert.equal(normaliserTag("a".repeat(40)).length, 32);
  assert.equal(normaliserTag(`${"a".repeat(31)}-bcd`), "a".repeat(31));
});

test("normaliserTags : dédoublonne et ignore les entrées vides", () => {
  assert.deepEqual(
    normaliserTags(["#Présent", "présent", "", "Imparfait", 42, null]),
    ["présent", "imparfait"],
  );
});

test("normaliserTags : plafonnés à douze, et tolérants à une entrée invalide", () => {
  const beaucoup = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
  assert.equal(normaliserTags(beaucoup).length, 12);
  assert.deepEqual(normaliserTags("pas un tableau"), []);
});

test("replierTag : forme sans accent, pour une recherche tolérante", () => {
  assert.equal(replierTag("#Passé Composé"), "passe-compose");
  assert.equal(replierTag("présent"), replierTag("PRESENT"));
});
