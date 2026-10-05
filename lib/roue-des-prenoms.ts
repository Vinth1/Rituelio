// Persistance de la « Roue des prénoms » (outil de classe). Rien en base : le
// réglage « sans remise » et, par classe, les élèves déjà passés sont gardés dans
// le localStorage. Le tour continue ainsi d'une séance à l'autre : personne ne
// repasse tant que toute la classe n'est pas passée ou que le prof n'a pas
// réinitialisé. On ne stocke que des identifiants d'élèves, jamais de noms.

export type EtatRoue = {
  sansRemise: boolean;
  passes: Record<string, string[]>; // id de classe → ids des élèves déjà passés
};

const CLE_STOCKAGE = "rituelio.outils.roue-des-prenoms";

const ETAT_VIDE: EtatRoue = { sansRemise: false, passes: {} };

// Charge l'état depuis le localStorage (état vide si rien ou erreur).
export function chargerEtatRoue(): EtatRoue {
  if (typeof window === "undefined") return ETAT_VIDE;
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return ETAT_VIDE;
    const data: unknown = JSON.parse(brut);
    if (typeof data !== "object" || data === null) return ETAT_VIDE;
    const o = data as { sansRemise?: unknown; passes?: unknown };
    // Validation défensive : on ignore tout ce qui n'a pas la bonne forme.
    const passes: Record<string, string[]> = {};
    if (typeof o.passes === "object" && o.passes !== null) {
      for (const [classeId, ids] of Object.entries(o.passes)) {
        if (Array.isArray(ids)) {
          passes[classeId] = ids.filter((id): id is string => typeof id === "string");
        }
      }
    }
    return { sansRemise: o.sansRemise === true, passes };
  } catch {
    return ETAT_VIDE;
  }
}

// Enregistre l'état dans le localStorage.
export function enregistrerEtatRoue(etat: EtatRoue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
  } catch {
    /* quota plein ou stockage refusé : l'état vaut pour la séance */
  }
}
