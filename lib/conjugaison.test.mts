// Tests de la couche de correction et garde-fous sur la banque de verbes.
// La banque est GÉNÉRÉE : ces tests vérifient qu'aucune entrée ne pointe dans le
// vide et qu'aucun verbe ne sort une forme creuse — un trou passerait sinon
// inaperçu jusqu'à la classe.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculerNote,
  conjugaisonFigee,
  formeAcceptee,
  formeEstCorrecte,
  ligneCorrecte,
  normaliser,
  pronomEstCorrect,
  trouverConjugaison,
} from "./conjugaison.ts";
import { conjuguerTout, verbes } from "../data/verbes.ts";
import { TEMPS_COLLEGE } from "./conjugueur.ts";

// ===========================================================================
// La banque
// ===========================================================================

test("banque : plus de 300 verbes", () => {
  assert.ok(verbes.length > 300, `seulement ${verbes.length} verbes`);
});

test("banque : aucun infinitif en double", () => {
  const vus = new Set<string>();
  for (const v of verbes) {
    assert.ok(!vus.has(v.infinitif), `${v.infinitif} apparaît deux fois`);
    vus.add(v.infinitif);
  }
});

test("banque : chaque groupe est représenté", () => {
  const parGroupe = new Map<string, number>();
  for (const v of verbes) {
    parGroupe.set(v.groupe, (parGroupe.get(v.groupe) ?? 0) + 1);
  }
  assert.ok((parGroupe.get("1er groupe") ?? 0) >= 150, "1er groupe trop maigre");
  assert.ok((parGroupe.get("2e groupe") ?? 0) >= 40, "2e groupe trop maigre");
  assert.ok((parGroupe.get("3e groupe") ?? 0) >= 100, "3e groupe trop maigre");
});

test("banque : chaque verbe se conjugue à tous ses temps, sans forme vide", () => {
  for (const v of verbes) {
    const cases = conjuguerTout(v);
    assert.ok(
      cases.length >= 8,
      `${v.infinitif} : ${cases.length} temps seulement`,
    );
    for (const c of cases) {
      for (const i of c.lignes) {
        assert.ok(
          c.formes[i].trim().length > 0,
          `${v.infinitif} : ${c.mode} ${c.temps}, ligne ${i} vide`,
        );
      }
    }
  }
});

test("banque : les infinitifs sont en minuscules et sans espace", () => {
  for (const v of verbes) {
    assert.equal(v.infinitif, v.infinitif.toLowerCase(), v.infinitif);
    assert.ok(!/\s/.test(v.infinitif), `${v.infinitif} contient un espace`);
  }
});

// ===========================================================================
// trouverConjugaison — le chemin de la correction serveur
// ===========================================================================

test("trouverConjugaison retrouve un verbe de chaque groupe", () => {
  assert.equal(
    trouverConjugaison("manger", "imparfait", "indicatif")?.formes[3],
    "mangions",
  );
  assert.equal(
    trouverConjugaison("finir", "passé simple", "indicatif")?.formes[3],
    "finîmes",
  );
  assert.equal(
    trouverConjugaison("prendre", "présent", "subjonctif")?.formes[0],
    "prenne",
  );
  assert.equal(
    trouverConjugaison("aller", "passé composé", "indicatif")?.formes[3],
    "sommes allés",
  );
});

test("trouverConjugaison : verbe ou temps inconnu → null", () => {
  assert.equal(trouverConjugaison("brouzouf", "présent", "indicatif"), null);
  assert.equal(trouverConjugaison("parler", "futur antérieur", "indicatif"), null);
});

test("trouverConjugaison couvre les 8 temps à 6 personnes du jeu", () => {
  for (const tm of TEMPS_COLLEGE) {
    if (tm.mode === "impératif") continue;
    const c = trouverConjugaison("parler", tm.temps, tm.mode);
    assert.ok(c, `parler n'a pas de ${tm.mode} ${tm.temps}`);
    assert.equal(c.formes.length, 6);
  }
});

// ===========================================================================
// Correction
// ===========================================================================

test("normaliser ignore casse, accents et espaces", () => {
  assert.equal(normaliser("  Été "), "ete");
  assert.equal(normaliser("ai parlé"), "aiparle");
});

test("pronomEstCorrect accepte les variantes de chaque ligne", () => {
  assert.ok(pronomEstCorrect("j'", 0));
  assert.ok(pronomEstCorrect("Je", 0));
  assert.ok(pronomEstCorrect("elle", 2));
  assert.ok(pronomEstCorrect("on", 2));
  assert.ok(pronomEstCorrect("elles", 5));
  assert.ok(!pronomEstCorrect("nous", 2));
});

test("formeAcceptee tolère l'accord féminin du participe passé", () => {
  const c = trouverConjugaison("aller", "passé composé", "indicatif");
  assert.ok(c);
  assert.ok(formeAcceptee("suis allé", c, 0));
  assert.ok(formeAcceptee("suis allée", c, 0));
  assert.ok(formeAcceptee("sommes allés", c, 3));
  assert.ok(formeAcceptee("sommes allées", c, 3));
  // « vous » accepte aussi le singulier : vouvoiement de politesse.
  assert.ok(formeAcceptee("êtes allé", c, 4));
  // Mais pas n'importe quoi.
  assert.ok(!formeAcceptee("sommes allé", c, 3));
});

test("formeAcceptee tolère « je paye » à côté de « je paie »", () => {
  const c = trouverConjugaison("payer", "présent", "indicatif");
  assert.ok(c);
  assert.ok(formeAcceptee("paie", c, 0));
  assert.ok(formeAcceptee("paye", c, 0));
  assert.ok(!formeAcceptee("payes", c, 0));
});

test("formeEstCorrecte reste une comparaison stricte, sans variantes", () => {
  assert.ok(formeEstCorrecte("mangeais", "mangeais"));
  assert.ok(formeEstCorrecte("MANGEAIS", "mangeais"));
  assert.ok(!formeEstCorrecte("sommes allées", "sommes allés"));
});

test("ligneCorrecte exige le pronom ET la forme", () => {
  const c = trouverConjugaison("parler", "présent", "indicatif");
  assert.ok(c);
  assert.ok(ligneCorrecte("je", "parle", c, 0));
  assert.ok(!ligneCorrecte("tu", "parle", c, 0)); // mauvais pronom
  assert.ok(!ligneCorrecte("je", "parles", c, 0)); // mauvaise forme
});

// ===========================================================================
// Formes figées (snapshot d'évaluation)
// ===========================================================================

test("conjugaisonFigee accepte un JSONB bien formé", () => {
  const c = conjugaisonFigee("présent", "indicatif", {
    formes: ["bous", "bous", "bout", "bouillons", "bouillez", "bouillent"],
  });
  assert.ok(c);
  assert.equal(c.formes[2], "bout");
  assert.deepEqual(c.lignes, [0, 1, 2, 3, 4, 5]);
});

test("conjugaisonFigee refuse une donnée cassée (repli sur la banque)", () => {
  assert.equal(conjugaisonFigee("présent", "indicatif", null), null);
  assert.equal(conjugaisonFigee("présent", "indicatif", {}), null);
  assert.equal(
    conjugaisonFigee("présent", "indicatif", { formes: ["a", "b"] }),
    null,
  );
  assert.equal(
    conjugaisonFigee("présent", "indicatif", { formes: [1, 2, 3, 4, 5, 6] }),
    null,
  );
});

test("conjugaisonFigee conserve les variantes acceptées", () => {
  const c = conjugaisonFigee("passé composé", "indicatif", {
    formes: ["suis allé", "es allé", "est allé", "sommes allés", "êtes allés", "sont allés"],
    variantes: [["suis allée"], null, null, null, null, null],
  });
  assert.ok(c);
  assert.ok(formeAcceptee("suis allée", c, 0));
});

// ===========================================================================
// Note
// ===========================================================================

test("calculerNote : 12 formes par défaut, comme les 2 tableaux du jeu", () => {
  assert.deepEqual(calculerNote(12, 0, 0), { brut: 12, max: 12, note: 20 });
  assert.deepEqual(calculerNote(6, 0, 0), { brut: 6, max: 12, note: 10 });
  assert.deepEqual(calculerNote(12, 2, 2), { brut: 14, max: 14, note: 20 });
  assert.deepEqual(calculerNote(0, 0, 0), { brut: 0, max: 12, note: 0 });
});

test("calculerNote : le nombre de formes peut être forcé", () => {
  assert.deepEqual(calculerNote(3, 0, 0, 6), { brut: 3, max: 6, note: 10 });
});
