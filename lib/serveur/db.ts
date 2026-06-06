// Connexion SQLite (module SQLite intégré de Node, aucune dépendance externe).
// Module SERVEUR uniquement (importe `node:sqlite`/`node:fs` : il ne peut pas
// être empaqueté côté navigateur). Stocke UNIQUEMENT le côté évaluation
// (sessions + copies). La base est un fichier local `.data/rituelio.sqlite`
// (ignoré par Git). Singleton pour éviter de rouvrir la base à chaque requête /
// rechargement à chaud.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ouverte',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  infinitive TEXT NOT NULL,
  tense TEXT NOT NULL,
  grammatical_mode TEXT NOT NULL,
  order_index INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session_constraints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  teacher_comment TEXT NOT NULL DEFAULT '',
  forced_note INTEGER
);
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  line_index INTEGER NOT NULL,
  pronoun TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sentence_text TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS submission_constraints (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  validated INTEGER NOT NULL DEFAULT 0
);
`;

function ouvrir(): DatabaseSync {
  const dossier = join(process.cwd(), ".data");
  mkdirSync(dossier, { recursive: true });
  const base = new DatabaseSync(join(dossier, "rituelio.sqlite"));
  base.exec("PRAGMA journal_mode = WAL;");
  base.exec("PRAGMA foreign_keys = ON;");
  base.exec(SCHEMA);
  return base;
}

// On range l'instance sur globalThis pour la conserver entre rechargements à chaud.
const global = globalThis as unknown as { __rituelioDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!global.__rituelioDb) global.__rituelioDb = ouvrir();
  return global.__rituelioDb;
}

// Exécute `fn` dans une transaction (tout ou rien).
export function transaction<T>(fn: () => T): T {
  const base = db();
  base.exec("BEGIN");
  try {
    const resultat = fn();
    base.exec("COMMIT");
    return resultat;
  } catch (erreur) {
    base.exec("ROLLBACK");
    throw erreur;
  }
}
