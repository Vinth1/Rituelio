import { test } from "node:test";
import assert from "node:assert/strict";
import { constituerGroupes, melanger } from "./groupes.ts";

// Une classe fictive de 13 « élèves » (des nombres suffisent : la fonction est
// générique et ne regarde jamais le contenu).
const classe = Array.from({ length: 13 }, (_, i) => i + 1);

test("melanger : garde exactement les mêmes éléments et n'altère pas la source", () => {
  const source = [...classe];
  const melangee = melanger(source);
  assert.deepEqual(source, classe);
  assert.deepEqual([...melangee].sort((a, b) => a - b), classe);
});

test("constituerGroupes : personne n'est perdu ni dupliqué", () => {
  for (const taille of [2, 3, 4, 5, 6]) {
    const plat = constituerGroupes(classe, taille).flat();
    assert.equal(plat.length, classe.length, `taille ${taille}`);
    assert.equal(new Set(plat).size, classe.length, `taille ${taille}`);
  }
});

test("constituerGroupes : aucun groupe ne dépasse la taille demandée", () => {
  for (const effectif of [1, 5, 13, 24, 31]) {
    const eleves = Array.from({ length: effectif }, (_, i) => i);
    for (const taille of [2, 3, 4, 5, 6]) {
      for (const groupe of constituerGroupes(eleves, taille)) {
        assert.ok(
          groupe.length <= taille,
          `${effectif} élèves par ${taille} : groupe de ${groupe.length}`,
        );
      }
    }
  }
});

test("constituerGroupes : les tailles ne diffèrent jamais de plus de 1", () => {
  // 13 en trinômes → 3, 3, 3, 2, 2 : jamais un élève tout seul.
  for (const effectif of [1, 5, 13, 24, 31]) {
    const eleves = Array.from({ length: effectif }, (_, i) => i);
    for (const taille of [2, 3, 4, 5, 6]) {
      const tailles = constituerGroupes(eleves, taille).map((g) => g.length);
      assert.ok(
        Math.max(...tailles) - Math.min(...tailles) <= 1,
        `${effectif} élèves par ${taille} : ${tailles.join("/")}`,
      );
    }
  }
});

test("constituerGroupes : cas limites (liste vide, un seul élève, taille absurde)", () => {
  assert.deepEqual(constituerGroupes([], 3), []);
  assert.deepEqual(constituerGroupes([7], 3), [[7]]);
  assert.deepEqual(constituerGroupes(classe, 0), []);
});
