import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES_QUESTION, typeQuestion, estTypeConnu } from "./registre.ts";

test("registre : contient qcm et reponse-courte", () => {
  assert.ok(TYPES_QUESTION.qcm);
  assert.ok(TYPES_QUESTION["reponse-courte"]);
});

test("registre : typeQuestion renvoie la définition attendue", () => {
  assert.equal(typeQuestion("qcm")?.type, "qcm");
  assert.equal(typeQuestion("inconnu"), undefined);
});

test("registre : estTypeConnu", () => {
  assert.equal(estTypeConnu("reponse-courte"), true);
  assert.equal(estTypeConnu("nope"), false);
});

test("registre : chaque définition expose l'API du plugin", () => {
  for (const def of Object.values(TYPES_QUESTION)) {
    assert.equal(typeof def.corrige, "function");
    assert.equal(typeof def.versionPublique, "function");
    assert.equal(typeof def.valideConfig, "function");
    assert.equal(typeof def.configParDefaut, "function");
    assert.equal(typeof def.autoCorrige, "boolean");
  }
});
