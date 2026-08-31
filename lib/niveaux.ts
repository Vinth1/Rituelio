// Niveaux de classe (du CM1 à la 4ᵉ) : liste ordonnée, libellés et comparaison.
// Même principe que `lib/categories.ts` : les données ne stockent qu'un slug, le
// libellé lisible vit ici. L'ordre du tableau EST l'ordre de difficulté, ce qui
// permet un filtrage « cumulatif » (voir `rangNiveau`).

export type InfoNiveau = {
  slug: Niveau;
  label: string;
};

export const NIVEAUX = [
  { slug: "cm1", label: "CM1" },
  { slug: "cm2", label: "CM2" },
  { slug: "6e", label: "6ᵉ" },
  { slug: "5e", label: "5ᵉ" },
  { slug: "4e", label: "4ᵉ" },
] as const satisfies readonly { slug: string; label: string }[];

export type Niveau = (typeof NIVEAUX)[number]["slug"];

// Rang d'un niveau : 0 pour le CM1 … 4 pour la 4ᵉ. Sert à comparer deux niveaux
// pour un filtrage cumulatif — « jusqu'à la 5ᵉ » garde tout ce dont le rang est
// inférieur ou égal à celui de la 5ᵉ, donc CM1, CM2, 6ᵉ et 5ᵉ.
export function rangNiveau(niveau: Niveau): number {
  return NIVEAUX.findIndex((n) => n.slug === niveau);
}

// Vrai si `niveau` est à la portée d'une classe de niveau `plafond`,
// c'est-à-dire s'il se situe à ce niveau ou en dessous.
export function estJusqua(niveau: Niveau, plafond: Niveau): boolean {
  return rangNiveau(niveau) <= rangNiveau(plafond);
}

// Retourne le libellé lisible d'un niveau (ou le slug en dernier recours).
export function libelleNiveau(slug: Niveau): string {
  return NIVEAUX.find((n) => n.slug === slug)?.label ?? slug;
}
