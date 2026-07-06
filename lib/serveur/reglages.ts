// Réglages « Ma classe » (côté serveur) : URLs Vulkan / ClassDojo (table
// reglages_prof) et dates des trimestres de l'année (table trimestres). Scopé
// user_id. Module serveur uniquement (dépend de `./db`).
import { sql, transaction } from "./db";

// URLs par défaut proposées dans le formulaire (pages d'accueil génériques ;
// le prof peut les remplacer par un lien profond vers sa classe).
export const VULKAN_DEFAUT = "https://uonetplus.vulcan.net.pl/";
export const CLASSDOJO_DEFAUT = "https://home.classdojo.com/";
// Année scolaire gérée pour cette PR (les trimestres y sont rattachés).
export const ANNEE_COURANTE = "2026-2027";

export type Trimestre = { numero: number; dateDebut: string; dateFin: string };
export type ReglagesMaClasse = {
  urlVulkan: string;
  urlClassdojo: string;
  trimestres: Trimestre[]; // toujours 3 (numéros 1,2,3), dates "" si absentes
};

// Vrai si l'URL est ouvrable en toute sécurité (schéma http/https uniquement).
export function urlOuvrable(u: string): boolean {
  return /^https?:\/\//i.test(u.trim());
}

export async function reglagesDeProf(userId: string): Promise<ReglagesMaClasse> {
  const [r] = await sql()`
    SELECT url_vulkan, url_classdojo FROM reglages_prof WHERE user_id = ${userId}
  `;
  const reglages = r as
    | { url_vulkan: string | null; url_classdojo: string | null }
    | undefined;
  const rows = (await sql()`
    SELECT numero, date_debut, date_fin FROM trimestres
    WHERE user_id = ${userId} AND annee = ${ANNEE_COURANTE} ORDER BY numero
  `) as unknown as { numero: number; date_debut: string; date_fin: string }[];
  const trimestres: Trimestre[] = [1, 2, 3].map((n) => {
    const t = rows.find((x) => x.numero === n);
    return { numero: n, dateDebut: t?.date_debut ?? "", dateFin: t?.date_fin ?? "" };
  });
  return {
    urlVulkan: reglages?.url_vulkan ?? "",
    urlClassdojo: reglages?.url_classdojo ?? "",
    trimestres,
  };
}

export async function enregistrerReglages(
  userId: string,
  data: { urlVulkan: string; urlClassdojo: string; trimestres: Trimestre[] },
): Promise<void> {
  await transaction(async (tx) => {
    await tx`
      INSERT INTO reglages_prof (user_id, url_vulkan, url_classdojo)
      VALUES (${userId}, ${data.urlVulkan}, ${data.urlClassdojo})
      ON CONFLICT (user_id) DO UPDATE
        SET url_vulkan = EXCLUDED.url_vulkan, url_classdojo = EXCLUDED.url_classdojo
    `;
    // Remplace les trimestres de l'année : on ne garde que ceux ayant au moins
    // une date (évite des lignes vides).
    await tx`DELETE FROM trimestres WHERE user_id = ${userId} AND annee = ${ANNEE_COURANTE}`;
    for (const t of data.trimestres) {
      if (!t.dateDebut && !t.dateFin) continue;
      await tx`
        INSERT INTO trimestres (id, user_id, annee, numero, date_debut, date_fin)
        VALUES (${crypto.randomUUID()}, ${userId}, ${ANNEE_COURANTE}, ${t.numero}, ${t.dateDebut}, ${t.dateFin})
      `;
    }
  });
}
