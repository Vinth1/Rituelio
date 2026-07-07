import { test } from "node:test";
import assert from "node:assert/strict";
import { reponseCourte, type ConfigReponseCourte } from "./reponse-courte.ts";

function cfg(p: Partial<ConfigReponseCourte> = {}): ConfigReponseCourte {
  return { acceptees: ["Paris"], ignorerCasse: true, ignorerAccents: false, ...p };
}

test("réponse courte : correspondance insensible à la casse", () => {
  assert.deepEqual(reponseCourte.corrige(cfg(), { texte: "paris" }, 1), {
    points: 1,
    max: 1,
  });
});

test("réponse courte : espaces superflus tolérés (réponse multi-mots)", () => {
  const c = cfg({ acceptees: ["cheval de Troie"] });
  assert.deepEqual(reponseCourte.corrige(c, { texte: "  cheval   de   troie " }, 1), {
    points: 1,
    max: 1,
  });
});

test("réponse courte : accents significatifs par défaut", () => {
  const c = cfg({ acceptees: ["élève"] });
  assert.deepEqual(reponseCourte.corrige(c, { texte: "eleve" }, 1), {
    points: 0,
    max: 1,
  });
});

test("réponse courte : accents ignorés si le réglage est activé", () => {
  const c = cfg({ acceptees: ["élève"], ignorerAccents: true });
  assert.deepEqual(reponseCourte.corrige(c, { texte: "eleve" }, 1), {
    points: 1,
    max: 1,
  });
});

test("réponse courte : plusieurs variantes acceptées", () => {
  const c = cfg({ acceptees: ["Léa", "Lea Martin"] });
  assert.equal(reponseCourte.corrige(c, { texte: "léa" }, 1)?.points, 1);
  assert.equal(reponseCourte.corrige(c, { texte: "lea martin" }, 1)?.points, 1);
});

test("réponse courte : réponse vide → 0", () => {
  assert.deepEqual(reponseCourte.corrige(cfg(), { texte: "   " }, 1), {
    points: 0,
    max: 1,
  });
});

test("réponse courte : rien à révéler publiquement", () => {
  assert.deepEqual(reponseCourte.versionPublique(cfg()), {});
});

test("réponse courte : valideConfig rejette une liste vide", () => {
  const r = reponseCourte.valideConfig({
    acceptees: ["  "],
    ignorerCasse: true,
    ignorerAccents: false,
  });
  assert.equal(r.ok, false);
});
