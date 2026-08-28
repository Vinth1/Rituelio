import { test } from "node:test";
import assert from "node:assert/strict";
import { NIVEAUX, estJusqua, rangNiveau, type Niveau } from "./niveaux.ts";
import { mots } from "../data/mots.ts";

test("rangNiveau : l'ordre va du CM1 à la 4ᵉ", () => {
  assert.ok(rangNiveau("cm1") < rangNiveau("cm2"));
  assert.ok(rangNiveau("cm2") < rangNiveau("6e"));
  assert.ok(rangNiveau("6e") < rangNiveau("5e"));
  assert.ok(rangNiveau("5e") < rangNiveau("4e"));
});

test("estJusqua : un niveau est toujours à sa propre portée", () => {
  for (const n of NIVEAUX) {
    assert.equal(estJusqua(n.slug, n.slug), true);
  }
});

test("estJusqua : le filtre est cumulatif vers le bas, pas vers le haut", () => {
  // Une classe de 5ᵉ atteint tout ce qui est en dessous…
  assert.equal(estJusqua("cm1", "5e"), true);
  assert.equal(estJusqua("6e", "5e"), true);
  // … mais pas les mots réservés à la 4ᵉ.
  assert.equal(estJusqua("4e", "5e"), false);
  assert.equal(estJusqua("cm2", "cm1"), false);
});

test("filtre cumulatif : « CM2 » ne rend que du CM1 et du CM2", () => {
  const banque = mots.filter((m) => estJusqua(m.niveau, "cm2"));
  assert.ok(banque.length > 0);
  assert.ok(banque.every((m) => m.niveau === "cm1" || m.niveau === "cm2"));
});

test("filtre cumulatif : « 4ᵉ » ouvre toute la banque", () => {
  const banque = mots.filter((m) => estJusqua(m.niveau, "4e"));
  assert.equal(banque.length, mots.length);
});

// --- Garde-fous sur la banque de mots (data/mots.ts) ---

test("banque : aucun mot en double", () => {
  const vus = new Set<string>();
  const doublons: string[] = [];
  for (const m of mots) {
    if (vus.has(m.mot)) doublons.push(m.mot);
    vus.add(m.mot);
  }
  assert.deepEqual(doublons, [], `mots en double : ${doublons.join(", ")}`);
});

test("banque : chaque mot porte un niveau connu", () => {
  const connus = new Set<string>(NIVEAUX.map((n) => n.slug));
  for (const m of mots) {
    assert.ok(connus.has(m.niveau), `niveau inconnu pour « ${m.mot} » : ${m.niveau}`);
  }
});

// Minimum de mots propres à chaque niveau. CM1, CM2 et 6ᵉ sont les niveaux les
// plus utilisés et doivent tenir seuls : le CM1 ne bénéficie d'aucun niveau
// inférieur, il lui faut donc sa propre réserve. La 5ᵉ et la 4ᵉ héritent déjà de
// tout ce qui précède, un apport plus modeste leur suffit.
const MINIMUM_PAR_NIVEAU: Record<Niveau, number> = {
  cm1: 120,
  cm2: 120,
  "6e": 120,
  "5e": 30,
  "4e": 30,
};

test("banque : chaque niveau atteint son minimum de mots propres", () => {
  for (const n of NIVEAUX) {
    const compte = mots.filter((m) => m.niveau === n.slug).length;
    const minimum = MINIMUM_PAR_NIVEAU[n.slug];
    assert.ok(
      compte >= minimum,
      `${n.label} n'a que ${compte} mot(s), minimum attendu ${minimum}`,
    );
  }
});

test("banque : chaque niveau donne accès à au moins 120 mots", () => {
  // C'est le vrai critère côté classe : ce que le prof peut tirer une fois le
  // cumul appliqué (le CM1 est le cas le plus serré, il n'hérite de rien).
  for (const n of NIVEAUX) {
    const accessibles = mots.filter((m) => estJusqua(m.niveau, n.slug)).length;
    assert.ok(
      accessibles >= 120,
      `${n.label} n'ouvre que ${accessibles} mot(s)`,
    );
  }
});

test("banque : pas de ligature œ/æ ajoutée (illisible au Pendu)", () => {
  // « chœur » est la seule exception héritée : ses lettres ne sont pas
  // devinables au clavier A–Z du Pendu.
  const avecLigature = mots
    .filter((m) => /[œæ]/.test(m.mot))
    .map((m) => m.mot);
  assert.deepEqual(avecLigature, ["chœur"]);
});

test("banque : le niveau par défaut du jeu est le plus élevé", () => {
  // MotDuJour prend NIVEAUX[dernier] par défaut pour ouvrir toute la banque.
  const dernier: Niveau = NIVEAUX[NIVEAUX.length - 1].slug;
  assert.equal(dernier, "4e");
});
