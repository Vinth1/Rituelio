// Connexion Postgres — seule source de vérité de Rituelio.
// Managé en production (Neon / Vercel Postgres, via la DATABASE_URL « pooled ») ;
// en local, un conteneur Docker Postgres (voir README). Module SERVEUR uniquement
// (dépend de `postgres` + `DATABASE_URL` : il ne peut pas être empaqueté côté
// navigateur). Remplace l'ancien stockage SQLite fichier. Le client est rangé sur
// globalThis pour réutiliser le pool de connexions entre requêtes et rechargements
// à chaud.
import postgres from "postgres";

// Réutilise la même connexion entre les rechargements à chaud du serveur de dev.
const global = globalThis as unknown as { __rituelioSql?: postgres.Sql };

function ouvrir(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL manquante : définis-la dans .env.local (voir .env.example).",
    );
  }
  return postgres(url, {
    // Un pooler managé (Neon) limite les connexions : on reste modeste.
    max: 10,
    idle_timeout: 20,
    // Nos horodatages sont des epoch-ms stockés en BIGINT (oid 20), toujours
    // < 2^53 : on les relit en `number` (et non en chaîne) pour garder la même
    // logique applicative qu'avant (comparaisons `< Date.now()`, etc.).
    types: {
      bigintNombre: {
        to: 20,
        from: [20],
        serialize: (v: number) => v.toString(),
        parse: (v: string) => Number(v),
      },
    },
  });
}

// Client tag-template : `await sql`SELECT ... WHERE id = ${id}`` (paramétré, sûr).
export function sql(): postgres.Sql {
  if (!global.__rituelioSql) global.__rituelioSql = ouvrir();
  return global.__rituelioSql;
}

// Exécute `fn` dans une transaction (tout ou rien). IMPORTANT : `fn` reçoit le
// client transactionnel `tx` et doit l'utiliser pour TOUTES ses requêtes — utiliser
// `sql()` à la place les ferait tourner hors transaction, sur une autre connexion.
export async function transaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return sql().begin(fn) as Promise<T>;
}
