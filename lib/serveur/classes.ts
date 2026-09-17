// Couche d'accès aux classes & élèves (côté serveur). Source de vérité unique,
// remplace le localStorage pour la persistance (le navigateur n'en garde qu'un
// miroir de lecture pour les jeux pas encore migrés). Module serveur uniquement.
import { sql, transaction } from "./db";
import type { Classe } from "@/lib/classes";

// Toutes les classes d'un prof, avec leurs élèves (forme identique au type client).
export async function classesDeProf(userId: string): Promise<Classe[]> {
  const classes = (await sql()`
    SELECT id, nom FROM classes WHERE user_id = ${userId} ORDER BY created_at
  `) as unknown as { id: string; nom: string }[];
  if (classes.length === 0) return [];
  const ids = classes.map((c) => c.id);
  const eleves = (await sql()`
    SELECT id, classe_id, nom FROM eleves
    WHERE classe_id = ANY(${ids}) ORDER BY ordre, created_at
  `) as unknown as { id: string; classe_id: string; nom: string }[];
  return classes.map((c) => ({
    id: c.id,
    nom: c.nom,
    eleves: eleves
      .filter((e) => e.classe_id === c.id)
      .map((e) => ({ id: e.id, nom: e.nom })),
  }));
}

// Synchronise l'état complet des classes d'un prof avec celui envoyé par le client
// (modèle « on enregistre tout le tableau »). Diff plutôt que delete+reinsert :
// on conserve les lignes existantes (ids stables) pour préserver les futures
// références (notes, copies…). Tout ou rien via transaction.
//
// Les ids viennent du navigateur : s'il en envoie un qui appartient à un autre
// prof, un upsert sur `id` écraserait sa classe ou son élève (et la purge des
// élèves effacerait, en cascade, ses notes et faits de comportement). On refuse
// donc tout l'envoi AVANT la moindre écriture.
export async function remplacerClasses(
  userId: string,
  classes: Classe[],
): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const maintenant = Date.now();
  const classeIds = classes.map((c) => c.id);
  const tousEleveIds = classes.flatMap((c) => c.eleves.map((e) => e.id));
  return transaction(async (tx) => {
    const [classeEtrangere] = await tx`
      SELECT 1 FROM classes WHERE id = ANY(${classeIds}) AND user_id <> ${userId} LIMIT 1
    `;
    const [eleveEtranger] = await tx`
      SELECT 1 FROM eleves e JOIN classes c ON c.id = e.classe_id
      WHERE e.id = ANY(${tousEleveIds}) AND c.user_id <> ${userId} LIMIT 1
    `;
    if (classeEtrangere || eleveEtranger) {
      return {
        ok: false as const,
        erreur:
          "Certaines classes ou certains élèves appartiennent à un autre compte : rien n'a été enregistré.",
      };
    }

    // Supprime les classes retirées côté client (cascade → leurs élèves).
    await tx`DELETE FROM classes WHERE user_id = ${userId} AND id != ALL(${classeIds})`;
    for (const c of classes) {
      // Le WHERE double le contrôle ci-dessus : jamais de mise à jour d'une
      // classe d'un autre prof.
      await tx`
        INSERT INTO classes (id, user_id, nom, created_at)
        VALUES (${c.id}, ${userId}, ${c.nom}, ${maintenant})
        ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom
          WHERE classes.user_id = EXCLUDED.user_id
      `;
      const eleveIds = c.eleves.map((e) => e.id);
      await tx`
        DELETE FROM eleves
        WHERE classe_id = ${c.id} AND id != ALL(${eleveIds})
          AND classe_id IN (SELECT id FROM classes WHERE user_id = ${userId})
      `;
      for (let i = 0; i < c.eleves.length; i++) {
        const e = c.eleves[i];
        await tx`
          INSERT INTO eleves (id, classe_id, nom, ordre, created_at)
          VALUES (${e.id}, ${c.id}, ${e.nom}, ${i}, ${maintenant})
          ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom, ordre = EXCLUDED.ordre
        `;
      }
    }
    return { ok: true as const };
  });
}

// Vrai si la classe existe ET appartient à ce prof (garde-fou pour les liens FK).
export async function classeAppartientA(
  userId: string,
  classeId: string,
): Promise<boolean> {
  const [row] = await sql()`
    SELECT 1 FROM classes WHERE id = ${classeId} AND user_id = ${userId}
  `;
  return !!row;
}
