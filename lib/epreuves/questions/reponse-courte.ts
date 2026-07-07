// Type de question « Réponse écrite courte » à correction automatique.
// config = liste de réponses acceptées (SECRET) + réglages de tolérance
// (casse, accents). Rien à révéler à l'élève (`versionPublique` = {}).
import type { DefinitionQuestion } from "./types.ts";
import { normaliserReponse } from "../texte.ts";

export type ConfigReponseCourte = {
  acceptees: string[]; // réponses considérées correctes (variantes)
  ignorerCasse: boolean;
  ignorerAccents: boolean;
};
export type PublicReponseCourte = Record<string, never>; // aucun secret à montrer
export type ReponseReponseCourte = { texte: string };

function lireAcceptees(brut: unknown): string[] {
  const src = (brut as { acceptees?: unknown } | null)?.acceptees;
  if (!Array.isArray(src)) return [];
  return src.filter((x): x is string => typeof x === "string");
}

export const reponseCourte: DefinitionQuestion<
  ConfigReponseCourte,
  PublicReponseCourte,
  ReponseReponseCourte
> = {
  type: "reponse-courte",
  label: "Réponse écrite courte (auto)",
  icone: "✏️",
  autoCorrige: true,

  configParDefaut: () => ({
    acceptees: [""],
    ignorerCasse: true,
    ignorerAccents: false,
  }),

  valideConfig(brut) {
    const acceptees = lireAcceptees(brut).filter((a) => a.trim() !== "");
    if (acceptees.length === 0) {
      return { ok: false, erreur: "Ajoute au moins une réponse acceptée." };
    }
    const src = brut as Partial<ConfigReponseCourte> | null;
    return {
      ok: true,
      config: {
        acceptees,
        ignorerCasse: src?.ignorerCasse !== false, // défaut true
        ignorerAccents: src?.ignorerAccents === true, // défaut false
      },
    };
  },

  versionPublique: () => ({}),

  valideReponse(brut) {
    const texte = (brut as { texte?: unknown } | null)?.texte;
    return { texte: typeof texte === "string" ? texte : String(texte ?? "") };
  },

  reponseVide: () => ({ texte: "" }),

  corrige(config, reponse, points) {
    const opts = {
      ignorerCasse: config.ignorerCasse,
      ignorerAccents: config.ignorerAccents,
    };
    const saisie = normaliserReponse(reponse.texte, opts);
    // Une saisie vide ne peut jamais être correcte (évite un faux positif si une
    // réponse acceptée était vide — déjà filtrée par valideConfig, ceinture+bretelles).
    const juste =
      saisie !== "" &&
      config.acceptees.some(
        (a) => a.trim() !== "" && normaliserReponse(a, opts) === saisie,
      );
    return { points: juste ? points : 0, max: points };
  },
};
