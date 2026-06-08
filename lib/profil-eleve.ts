// Profil de l'élève (onboarding) : prénom + couleur (+ mascotte à venir),
// persisté dans le localStorage. Calqué sur lib/classes.ts : pas de back-end,
// tout est stocké dans le navigateur.

export type ProfilEleve = {
  prenom: string;
  couleur: string; // valeur hex issue de COULEURS_PROFIL
  mascotte?: string; // réservé pour plus tard (non utilisé pour l'instant)
};

// Palette FIXE de couleurs vives et lisibles (pensées pour du texte blanc).
// Valeurs écrites en dur : on ne peut pas construire une classe Tailwind v4
// dynamiquement (cf. lib/couleurs.ts), donc la bulle utilisera un style inline.
export const COULEURS_PROFIL = [
  { valeur: "#ef4444", nom: "Rouge" },
  { valeur: "#f97316", nom: "Orange" },
  { valeur: "#eab308", nom: "Jaune" },
  { valeur: "#22c55e", nom: "Vert" },
  { valeur: "#14b8a6", nom: "Turquoise" },
  { valeur: "#3b82f6", nom: "Bleu" },
  { valeur: "#8b5cf6", nom: "Violet" },
  { valeur: "#ec4899", nom: "Rose" },
] as const;

export const COULEUR_PROFIL_DEFAUT = COULEURS_PROFIL[0].valeur;

const CLE_STOCKAGE = "rituelio.profil-eleve";

// Initiale affichée dans la bulle : 1re lettre du prénom en majuscule,
// ou « ? » si le prénom est vide (placeholder discret).
export function initialeDe(prenom: string): string {
  const propre = prenom.trim();
  return propre ? propre.charAt(0).toUpperCase() : "?";
}

// Charge le profil de l'élève depuis le localStorage (null si rien ou erreur).
export function chargerProfil(): ProfilEleve | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const data: unknown = JSON.parse(brut);
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as ProfilEleve).prenom !== "string" ||
      typeof (data as ProfilEleve).couleur !== "string"
    ) {
      return null;
    }
    return data as ProfilEleve;
  } catch {
    return null;
  }
}

// Enregistre le profil de l'élève dans le localStorage.
export function enregistrerProfil(profil: ProfilEleve): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(profil));
}
