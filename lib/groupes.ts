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
// On calcule d'abord le NOMBRE de groupes (⌈effectif / taille⌉), puis on
// distribue en tourniquet : les tailles ne diffèrent alors jamais de plus de 1.
// C'est ce qui évite le groupe orphelin — 13 élèves en trinômes donnent
// 3, 3, 3, 2, 2 et non 3, 3, 3, 3, 1.
export function constituerGroupes<T>(membres: T[], taille: number): T[][] {
  if (membres.length === 0 || taille < 1) return [];
  const nombre = Math.ceil(membres.length / taille);
  const groupes: T[][] = Array.from({ length: nombre }, () => []);
  melanger(membres).forEach((membre, i) => {
    groupes[i % nombre].push(membre);
  });
  return groupes;
}
