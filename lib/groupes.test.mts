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

test("constituerGroupes : un groupe ne dépasse jamais la taille demandée de plus de 1", () => {
  // Le dépassement n'arrive que pour absorber un reste (15 par 2 → un trio).
  for (const effectif of [1, 5, 13, 24, 31]) {
    const eleves = Array.from({ length: effectif }, (_, i) => i);
    for (const taille of [2, 3, 4, 5, 6]) {
      for (const groupe of constituerGroupes(eleves, taille)) {
        assert.ok(
          groupe.length <= taille + 1,
          `${effectif} élèves par ${taille} : groupe de ${groupe.length}`,
        );
      }
    }
  }
});

test("constituerGroupes : personne ne reste seul dès qu'on est au moins deux", () => {
  for (let effectif = 2; effectif <= 35; effectif++) {
    const eleves = Array.from({ length: effectif }, (_, i) => i);
    for (const taille of [2, 3, 4, 5, 6]) {
      const tailles = constituerGroupes(eleves, taille).map((g) => g.length);
      assert.ok(
        Math.min(...tailles) >= 2,
        `${effectif} élèves par ${taille} : ${tailles.join("/")}`,
      );
    }
  }
});

test("constituerGroupes : 15 élèves en binômes font 7 groupes, dont un trio", () => {
  const tailles = constituerGroupes(
    Array.from({ length: 15 }, (_, i) => i),
    2,
  )
    .map((g) => g.length)
    .sort();
  assert.deepEqual(tailles, [2, 2, 2, 2, 2, 2, 3]);
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
