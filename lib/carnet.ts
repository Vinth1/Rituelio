// Types partagés du carnet de notes (client + serveur) et calculs PURS.
// % et grade (échelle ITSW) et moyennes ne sont JAMAIS stockés : calculés ici.

export type Matiere = { id: string; nom: string };

export type Tache = {
  id: string;
  matiereId: string;
  trimestre: number;
  dateISO: string;
  nom: string;
  bareme: number;
  ponderation: number;
  origine: string | null; // "manuel" ici ; "rituelio" plus tard
};

export type NoteEleve = {
  tacheId: string;
  eleveId: string;
  points: number | null; // NULL = absent / non noté (exclu du calcul, pas 0)
  commentaire: string;
};

// % d'une note (null si non noté / absent ou barème invalide).
export function pourcentage(points: number | null, bareme: number): number | null {
  if (points === null || !(bareme > 0)) return null;
  return (points / bareme) * 100;
}

// Grade 1–6 selon l'échelle ITSW : 100→6, 81-99→5, 61-80→4, 41-60→3, 31-40→2, ≤30→1.
export function gradeITSW(pct: number | null): number | null {
  if (pct === null) return null;
  if (pct >= 100) return 6;
  if (pct >= 81) return 5;
  if (pct >= 61) return 4;
  if (pct >= 41) return 3;
  if (pct >= 31) return 2;
  return 1;
}

// Moyenne de trimestre d'un élève = Σ(% × pondération) sur les tâches NOTÉES,
// renormalisée par la somme des pondérations notées → les absents/non notés sont
// exclus (pas comptés comme 0). Si toutes les pondérations valent 1 et aucune
// absence, on retrouve Σ(% × pondération). null si aucune note.
export function moyenneTrimestre(
  items: { pct: number | null; ponderation: number }[],
): number | null {
  let somme = 0;
  let sommePond = 0;
  for (const it of items) {
    if (it.pct === null) continue;
    somme += it.pct * it.ponderation;
    sommePond += it.ponderation;
  }
  if (sommePond <= 0) return null;
  return somme / sommePond;
}

// Arrondi d'affichage (1 décimale) pour les pourcentages/moyennes.
export function arrondi1(x: number): number {
  return Math.round(x * 10) / 10;
}
