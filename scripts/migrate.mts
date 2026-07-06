// Applique le schéma Postgres (idempotent) : `npm run db:migrate`.
// Charge .env.local en dev ; en CI/prod, DATABASE_URL vient de l'environnement.
// Le compte prof est amorcé automatiquement par l'app au premier accès à /connexion
// si PROF_MOT_DE_PASSE est défini (voir lib/serveur/auth.ts::amorcerSiBesoin) — ce
// script se contente donc de créer/mettre à jour les tables.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local : DATABASE_URL doit venir de l'environnement.
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante — voir .env.example.");
  process.exit(1);
}

const ici = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(ici, "..", "lib", "serveur", "schema.sql"), "utf8");

const sql = postgres(url);
try {
  await sql.unsafe(schema);
  console.log("✅ Schéma Postgres appliqué.");
} catch (erreur) {
  console.error("❌ Échec de la migration :", erreur);
  process.exitCode = 1;
} finally {
  await sql.end();
}
