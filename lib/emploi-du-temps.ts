// Utilitaires purs de l'emploi du temps (aucune dépendance serveur ni navigateur) :
// jours, conversion "HH:MM" ↔ minutes, chevauchement, jour courant. Partagés par la
// couche serveur (validation) et les composants client (grille, dashboard).

// Jours travaillés : index 0 → lundi (jour 1) … index 4 → vendredi (jour 5).
export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;

// Durée par défaut d'un cours (minutes), pré-remplie à la saisie de l'heure de début.
export const DUREE_DEFAUT = 45;

// "08:45" → 525. Renvoie NaN si le format est invalide.
export function enMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

// 525 → "08:45" (borné à 00:00–23:59).
export function enHHMM(minutes: number): string {
  const borne = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const h = Math.floor(borne / 60);
  const mn = borne % 60;
  return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

// Ajoute des minutes à une heure "HH:MM" (pour la durée par défaut).
export function ajouterMinutes(hhmm: string, minutes: number): string {
  const base = enMinutes(hhmm);
  return Number.isNaN(base) ? hhmm : enHHMM(base + minutes);
}

// Vrai si deux plages [début,fin[ se chevauchent. Comparaison sur des "HH:MM"
// zéro-paddés → l'ordre lexicographique suffit.
export function chevauche(
  aDebut: string,
  aFin: string,
  bDebut: string,
  bFin: string,
): boolean {
  return aDebut < bFin && bDebut < aFin;
}

// Jour de la semaine courant au format 1–5 (lundi–vendredi), ou null le week-end.
export function jourCourant(maintenant: Date = new Date()): number | null {
  const js = maintenant.getDay(); // 0 = dimanche, 1 = lundi … 6 = samedi
  return js >= 1 && js <= 5 ? js : null;
}
