// Modèle de données et persistance (localStorage) des classes et de leurs élèves.
// Pas de back-end : tout est stocké dans le navigateur. Ces listes serviront
// plus tard à la « roue du hasard ».

export type Eleve = {
  id: string;
  nom: string;
};

export type Classe = {
  id: string;
  nom: string;
  eleves: Eleve[];
};

const CLE_STOCKAGE = "rituelio.classes";

// Génère un identifiant unique (avec repli si crypto.randomUUID indisponible).
export function nouvelId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Charge les classes depuis le localStorage (tableau vide si rien ou erreur).
export function chargerClasses(): Classe[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return [];
    const data: unknown = JSON.parse(brut);
    if (!Array.isArray(data)) return [];
    return data as Classe[];
  } catch {
    return [];
  }
}

// Enregistre les classes dans le localStorage.
export function enregistrerClasses(classes: Classe[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(classes));
}
