import { test } from "node:test";
import assert from "node:assert/strict";
import { qcm, type ConfigQcm } from "./qcm.ts";

const config: ConfigQcm = {
  options: [
    { id: "a", texte: "Un nom" },
    { id: "b", texte: "Un adverbe" },
    { id: "c", texte: "Un adjectif" },
  ],
  bonneOption: "b",
};

test("qcm : bonne réponse → tous les points", () => {
  assert.deepEqual(qcm.corrige(config, { choix: "b" }, 2), { points: 2, max: 2 });
});

test("qcm : mauvaise réponse → 0", () => {
  assert.deepEqual(qcm.corrige(config, { choix: "a" }, 2), { points: 0, max: 2 });
});

test("qcm : pas de réponse → 0", () => {
  assert.deepEqual(qcm.corrige(config, { choix: null }, 2), { points: 0, max: 2 });
});

test("qcm : versionPublique retire la bonne réponse", () => {
  const pub = qcm.versionPublique(config);
  assert.equal(JSON.stringify(pub).includes("bonneOption"), false);
  assert.equal(pub.options.length, 3);
});

test("qcm : valideConfig rejette moins de deux options", () => {
  const r = qcm.valideConfig({ options: [{ id: "a", texte: "x" }], bonneOption: "a" });
  assert.equal(r.ok, false);
});

test("qcm : valideConfig rejette une bonne option inexistante", () => {
  const r = qcm.valideConfig({
    options: [
      { id: "a", texte: "x" },
      { id: "b", texte: "y" },
    ],
    bonneOption: "z",
  });
  assert.equal(r.ok, false);
});

test("qcm : valideConfig ignore les options vides", () => {
  const r = qcm.valideConfig({
    options: [
      { id: "a", texte: "x" },
      { id: "b", texte: "  " },
      { id: "c", texte: "z" },
    ],
    bonneOption: "c",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.config.options.length, 2);
});

test("qcm : valideConfig accepte une config correcte", () => {
  assert.equal(qcm.valideConfig(config).ok, true);
});
