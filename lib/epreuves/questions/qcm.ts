// Type de question « QCM (une seule bonne réponse) ». Module pur.
// config = liste d'options + l'id de la bonne option (SECRET) ; la version
// publique envoyée à l'élève ne contient que les options (sans la bonne).
import type { DefinitionQuestion } from "./types.ts";

export type OptionQcm = { id: string; texte: string };
export type ConfigQcm = { options: OptionQcm[]; bonneOption: string };
export type PublicQcm = { options: OptionQcm[] };
export type ReponseQcm = { choix: string | null }; // id de l'option choisie

function nouvelleOption(): OptionQcm {
  return { id: crypto.randomUUID(), texte: "" };
}

// Lit défensivement une liste d'options depuis du JSONB non fiable.
function lireOptions(brut: unknown): OptionQcm[] {
  const src = (brut as { options?: unknown } | null)?.options;
  if (!Array.isArray(src)) return [];
  const out: OptionQcm[] = [];
  for (const o of src) {
    if (o && typeof o === "object") {
      const id = (o as Record<string, unknown>).id;
      const texte = (o as Record<string, unknown>).texte;
      if (typeof id === "string" && typeof texte === "string") {
        out.push({ id, texte });
      }
    }
  }
  return out;
}

export const qcm: DefinitionQuestion<ConfigQcm, PublicQcm, ReponseQcm> = {
  type: "qcm",
  label: "QCM (une seule réponse)",
  icone: "🔘",
  autoCorrige: true,

  configParDefaut: () => ({
    options: [nouvelleOption(), nouvelleOption()],
    bonneOption: "",
  }),

  valideConfig(brut) {
    const options = lireOptions(brut).filter((o) => o.texte.trim() !== "");
    if (options.length < 2) {
      return { ok: false, erreur: "Ajoute au moins deux propositions." };
    }
    const brutBonne = (brut as { bonneOption?: unknown } | null)?.bonneOption;
    const bonneOption = typeof brutBonne === "string" ? brutBonne : "";
    if (!options.some((o) => o.id === bonneOption)) {
      return { ok: false, erreur: "Choisis la bonne réponse parmi les propositions." };
    }
    return { ok: true, config: { options, bonneOption } };
  },

  // Retire `bonneOption` : l'élève ne reçoit que les propositions.
  versionPublique: (config) => ({
    options: config.options.map((o) => ({ id: o.id, texte: o.texte })),
  }),

  valideReponse(brut) {
    const choix = (brut as { choix?: unknown } | null)?.choix;
    return { choix: typeof choix === "string" ? choix : null };
  },

  reponseVide: () => ({ choix: null }),

  corrige(config, reponse, points) {
    const juste = reponse.choix != null && reponse.choix === config.bonneOption;
    return { points: juste ? points : 0, max: points };
  },
};
