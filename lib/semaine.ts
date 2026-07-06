// Utilitaires de semaine et de dates (purs, sans dépendance). Convention alignée
// sur creneaux.jour (1 = lundi … 5 = vendredi). Les dates concrètes sont des
// chaînes ISO "AAAA-MM-JJ" (comme prepas_cours.date_iso), en heure LOCALE pour
// éviter les décalages de jour dus au fuseau.

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Date → "AAAA-MM-JJ" (heure locale).
export function isoDe(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "AAAA-MM-JJ" → Date locale (midi, pour éviter les bascules de fuseau).
export function deIso(iso: string): Date {
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(a, (m || 1) - 1, j || 1, 12, 0, 0);
}

// Lundi de la semaine contenant `d`, en ISO.
export function lundiDe(d: Date): string {
  const copie = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const js = copie.getDay(); // 0 = dimanche … 6 = samedi
  const delta = js === 0 ? -6 : 1 - js;
  copie.setDate(copie.getDate() + delta);
  return isoDe(copie);
}

// Ajoute n jours à une date ISO → nouvelle date ISO.
export function ajouterJours(iso: string, n: number): string {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}

// Les 5 dates ISO (lundi → vendredi) de la semaine dont le lundi est `lundiIso`.
export function datesSemaine(lundiIso: string): string[] {
  return [0, 1, 2, 3, 4].map((n) => ajouterJours(lundiIso, n));
}

// "14 au 18 septembre" (ou "29 septembre au 3 octobre" si mois différents).
export function formatSemaine(lundiIso: string): string {
  const lundi = deIso(lundiIso);
  const vendredi = deIso(ajouterJours(lundiIso, 4));
  const moisL = MOIS[lundi.getMonth()];
  const moisV = MOIS[vendredi.getMonth()];
  if (moisL === moisV) {
    return `${lundi.getDate()} au ${vendredi.getDate()} ${moisV}`;
  }
  return `${lundi.getDate()} ${moisL} au ${vendredi.getDate()} ${moisV}`;
}
