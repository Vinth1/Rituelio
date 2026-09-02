// Tests de la « Roue des verbes ». L'essentiel se joue sur deux points : le
// tirage doit respecter les réglages et ne pas se répéter, et la phrase de
// correction doit tomber sur la bonne ligne de conjugaison — un décalage d'une
// ligne donnerait une réponse fausse au tableau.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GROUPES,
  REGLAGES_DEFAUT,
  TEMPS_ROUE,
  formeAttendue,
  libelleCourtTemps,
  normaliserReglages,
  phraseReponse,
  piocher,
  sujetsPossibles,
  tempsPossibles,
  tirer,
  verbesPossibles,
  type ReglagesRoue,
  type Tirage,
} from "./roue-des-verbes.ts";
import { SUJETS } from "../data/sujets.ts";
import { trouverEntree } from "../data/verbes.ts";
import { cleTempsMode } from "./conjugueur.ts";

const TOUT: ReglagesRoue = {
  temps: TEMPS_ROUE.map(cleTempsMode),
  genres: ["pronom", "groupe-nominal", "coordonne"],
  groupes: [...GROUPES],
};

function tirage(
  sujetId: string,
  infinitif: string,
  temps: string,
  mode: string,
): Tirage {
  const sujet = SUJETS.find((s) => s.id === sujetId);
  const verbe = trouverEntree(infinitif);
  assert.ok(sujet && verbe, `${sujetId} / ${infinitif} introuvable`);
  return { sujet, verbe, temps: { temps, mode } };
}

// ===========================================================================
// La banque de sujets
// ===========================================================================

test("sujets : lignes valides et identifiants uniques", () => {
  const vus = new Set<string>();
  for (const s of SUJETS) {
    assert.ok(
      Number.isInteger(s.ligne) && s.ligne >= 0 && s.ligne <= 5,
      s.libelle,
    );
    assert.ok(!vus.has(s.id), `id en double : ${s.id}`);
    vus.add(s.id);
  }
});

test("sujets : chaque genre est représenté", () => {
  for (const genre of ["pronom", "groupe-nominal", "coordonne"] as const) {
    assert.ok(
      SUJETS.some((s) => s.genre === genre),
      genre,
    );
  }
});

test("sujets : un féminin ne l'est qu'à la 3e personne", () => {
  for (const s of SUJETS.filter((s) => s.feminin)) {
    assert.ok(s.ligne === 2 || s.ligne === 5, `${s.libelle} (ligne ${s.ligne})`);
  }
});

// ===========================================================================
// Les temps
// ===========================================================================

test("temps : l'impératif est écarté de la roue", () => {
  assert.equal(TEMPS_ROUE.length, 8);
  assert.ok(!TEMPS_ROUE.some((tm) => tm.mode === "impératif"));
});

test("temps : libellé court lisible", () => {
  assert.equal(
    libelleCourtTemps({ temps: "imparfait", mode: "indicatif" }),
    "imparfait",
  );
  assert.equal(
    libelleCourtTemps({ temps: "présent", mode: "subjonctif" }),
    "subj. présent",
  );
  assert.equal(
    libelleCourtTemps({ temps: "présent", mode: "conditionnel" }),
    "cond. présent",
  );
});

// ===========================================================================
// Les réglages
// ===========================================================================

test("réglages : les valeurs par défaut sont cohérentes", () => {
  assert.deepEqual(normaliserReglages(REGLAGES_DEFAUT), REGLAGES_DEFAUT);
  assert.ok(tirer(REGLAGES_DEFAUT));
});

test("réglages : une entrée cassée retombe sur les valeurs par défaut", () => {
  assert.deepEqual(normaliserReglages(null), REGLAGES_DEFAUT);
  assert.deepEqual(normaliserReglages("nawak"), REGLAGES_DEFAUT);
});

test("réglages : les valeurs inconnues sont écartées", () => {
  const r = normaliserReglages({
    temps: ["indicatif|imparfait", "indicatif|passé antérieur"],
    genres: ["pronom", "extraterrestre"],
    groupes: ["2e groupe", "42e groupe"],
  });
  assert.deepEqual(r, {
    temps: ["indicatif|imparfait"],
    genres: ["pronom"],
    groupes: ["2e groupe"],
  });
});

// ===========================================================================
// Le tirage
// ===========================================================================

test("tirage : respecte les filtres", () => {
  const r: ReglagesRoue = {
    temps: ["indicatif|imparfait"],
    genres: ["coordonne"],
    groupes: ["2e groupe"],
  };
  for (let i = 0; i < 60; i++) {
    const t = tirer(r);
    assert.ok(t);
    assert.equal(t.sujet.genre, "coordonne");
    assert.equal(t.verbe.groupe, "2e groupe");
    assert.deepEqual(t.temps, { temps: "imparfait", mode: "indicatif" });
  }
});

test("tirage : une roue vide annule le tirage", () => {
  assert.equal(tirer({ ...TOUT, genres: [] }), null);
  assert.equal(tirer({ ...TOUT, groupes: [] }), null);
  assert.equal(tirer({ ...TOUT, temps: [] }), null);
});

test("tirage : ne répète jamais la valeur précédente", () => {
  const precedent = tirage("je", "finir", "imparfait", "indicatif");
  for (let i = 0; i < 60; i++) {
    const t = tirer(TOUT, precedent);
    assert.ok(t);
    assert.notEqual(t.sujet.id, precedent.sujet.id);
    assert.notEqual(t.verbe.infinitif, precedent.verbe.infinitif);
    assert.notEqual(cleTempsMode(t.temps), cleTempsMode(precedent.temps));
  }
});

test("piocher : un seul candidat se retire quand même", () => {
  assert.equal(
    piocher(["a"], (s) => s, "a"),
    "a",
  );
  assert.equal(
    piocher([], (s) => s),
    null,
  );
});

test("candidats : les listes suivent les réglages", () => {
  assert.ok(verbesPossibles(TOUT).length > 300);
  assert.equal(sujetsPossibles({ ...TOUT, genres: ["pronom"] }).length, 9);
  assert.equal(tempsPossibles({ ...TOUT, temps: ["indicatif|présent"] }).length, 1);
});

// ===========================================================================
// La correction
// ===========================================================================

test("correction : la ligne du sujet est bien celle de la forme", () => {
  assert.equal(
    formeAttendue(tirage("gn-eleves", "finir", "imparfait", "indicatif")),
    "finissaient",
  );
  assert.equal(
    formeAttendue(tirage("co-lea-moi", "finir", "imparfait", "indicatif")),
    "finissions",
  );
  assert.equal(
    formeAttendue(tirage("co-toi-voisin", "finir", "présent", "indicatif")),
    "finissez",
  );
});

test("correction : accord du participe pour un sujet féminin", () => {
  assert.equal(
    phraseReponse(tirage("gn-soeur", "arriver", "passé composé", "indicatif")),
    "ma sœur est arrivée",
  );
  assert.equal(
    phraseReponse(tirage("gn-fleurs", "arriver", "passé composé", "indicatif")),
    "les fleurs sont arrivées",
  );
  assert.equal(
    phraseReponse(tirage("il", "arriver", "passé composé", "indicatif")),
    "il est arrivé",
  );
});

test("correction : élision de « je »", () => {
  assert.equal(
    phraseReponse(tirage("je", "aimer", "imparfait", "indicatif")),
    "j'aimais",
  );
  assert.equal(
    phraseReponse(tirage("je", "habiter", "imparfait", "indicatif")),
    "j'habitais",
  );
  assert.equal(
    phraseReponse(tirage("je", "finir", "passé composé", "indicatif")),
    "j'ai fini",
  );
  assert.equal(
    phraseReponse(tirage("je", "finir", "imparfait", "indicatif")),
    "je finissais",
  );
});

test("correction : « h » aspiré, pas d'élision", () => {
  assert.equal(
    phraseReponse(tirage("je", "haleter", "présent", "indicatif")),
    "je halète",
  );
  assert.equal(
    phraseReponse(tirage("je", "haïr", "présent", "indicatif")),
    "je hais",
  );
});

test("correction : le subjonctif s'annonce avec « que »", () => {
  assert.equal(
    phraseReponse(tirage("il", "finir", "présent", "subjonctif")),
    "qu'il finisse",
  );
  assert.equal(
    phraseReponse(tirage("on", "finir", "présent", "subjonctif")),
    "qu'on finisse",
  );
  assert.equal(
    phraseReponse(tirage("gn-eleves", "finir", "présent", "subjonctif")),
    "que les élèves finissent",
  );
  assert.equal(
    phraseReponse(tirage("je", "aimer", "présent", "subjonctif")),
    "que j'aime",
  );
});

test("correction : tout tirage possible produit une phrase", () => {
  for (let i = 0; i < 400; i++) {
    const t = tirer(TOUT);
    assert.ok(t);
    const phrase = phraseReponse(t);
    assert.ok(phrase && phrase.trim().length > 0, JSON.stringify(t));
  }
});
