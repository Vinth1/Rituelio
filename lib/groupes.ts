// Constitution de groupes au hasard dans une liste (binômes, trinômes…).
// Fonctions PURES et génériques, sans dépendance : testables et réutilisables.

// Copie mélangée d'une liste (Fisher-Yates). N'altère pas l'original.
export function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// Répartit `membres` au hasard en groupes d'environ `taille` personnes.
//
// On calcule d'abord le NOMBRE de groupes, puis on distribue en tourniquet :
// les tailles ne diffèrent alors jamais de plus de 1. C'est ce qui évite le
// groupe bancal — 13 élèves en trinômes donnent 3, 3, 3, 2, 2 et non
// 3, 3, 3, 3, 1.
//
// Le nombre de groupes est plafonné à ⌊effectif / 2⌋ : personne ne doit se
// retrouver SEUL. 15 élèves en binômes font donc 7 groupes (six paires et un
// trio) et non 8 groupes dont un élève sans partenaire. Un groupe peut ainsi
// compter une personne de plus que demandé, jamais moins de deux.
export function constituerGroupes<T>(membres: T[], taille: number): T[][] {
  if (membres.length === 0 || taille < 1) return [];
  const nombre =
    membres.length < 2
      ? 1
      : Math.min(Math.ceil(membres.length / taille), Math.floor(membres.length / 2));
  const groupes: T[][] = Array.from({ length: nombre }, () => []);
  melanger(membres).forEach((membre, i) => {
    groupes[i % nombre].push(membre);
  });
  return groupes;
}
