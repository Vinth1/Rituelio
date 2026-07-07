// Tests unitaires (runner Node natif : `npm test`).
import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliserReponse } from "./texte.ts";

test("trim + espaces internes réduits à un seul", () => {
  assert.equal(normaliserReponse("  le  chat   noir "), "le chat noir");
});

test("casse conservée par défaut", () => {
  assert.equal(normaliserReponse("Paris"), "Paris");
});

test("casse ignorée si demandé", () => {
  assert.equal(normaliserReponse("Paris", { ignorerCasse: true }), "paris");
});

test("accents conservés par défaut", () => {
  assert.equal(normaliserReponse("élève"), "élève");
});

test("accents retirés si demandé", () => {
  assert.equal(normaliserReponse("élève", { ignorerAccents: true }), "eleve");
});
