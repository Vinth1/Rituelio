// Type partagé d'une prépa de cours (client + serveur, sans dépendance) et
// métadonnées d'affichage du statut.

export type StatutPrepa = "a-preparer" | "prete" | "faite";

export type PrepaCours = {
  id: string;
  creneauId: string;
  dateISO: string;
  titre: string;
  objectifs: string;
  deroule: string;
  materiel: string;
  activitesRituelio: string[]; // ids d'activités du catalogue (data/jeux.ts)
  statut: StatutPrepa;
  notesApres: string;
};

export const STATUTS: StatutPrepa[] = ["a-preparer", "prete", "faite"];

// Libellé + classes de badge (chaînes littérales — règle Tailwind v4).
export const STATUT_INFO: Record<
  StatutPrepa,
  { libelle: string; badge: string }
> = {
  "a-preparer": {
    libelle: "À préparer",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  },
  prete: {
    libelle: "Prête",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200",
  },
  faite: {
    libelle: "Faite",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
};
