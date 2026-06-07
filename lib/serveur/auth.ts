// Authentification prof (côté serveur uniquement — dépend de `./db` et `node:crypto`).
// Mot de passe haché en base avec scrypt (aucune dépendance externe). Sessions
// opaques : le cookie contient un jeton aléatoire ; on ne stocke en base que son
// hash SHA-256 (si la base fuit, les jetons ne sont pas réutilisables).
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";

// Identifiant du compte unique pour l'instant (la table accepte déjà plusieurs comptes).
const IDENTIFIANT_PROF = "prof";
// Durée de vie d'une session (30 jours).
const DUREE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT_KEYLEN = 64;

type ProfUser = { id: string; identifiant: string; password_hash: string };

// --- Hachage du mot de passe ---

// Renvoie une chaîne « scrypt$<selHex>$<cléHex> » stockable telle quelle en base.
export function hacherMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16);
  const cle = scryptSync(motDePasse, sel, SCRYPT_KEYLEN);
  return `scrypt$${sel.toString("hex")}$${cle.toString("hex")}`;
}

// Vérifie un mot de passe contre une chaîne produite par `hacherMotDePasse`.
export function verifierMotDePasse(motDePasse: string, stocke: string): boolean {
  const [algo, selHex, cleHex] = stocke.split("$");
  if (algo !== "scrypt" || !selHex || !cleHex) return false;
  const cleAttendue = Buffer.from(cleHex, "hex");
  const cleCalculee = scryptSync(motDePasse, Buffer.from(selHex, "hex"), cleAttendue.length);
  return (
    cleAttendue.length === cleCalculee.length &&
    timingSafeEqual(cleAttendue, cleCalculee)
  );
}

// --- Compte prof ---

function profParIdentifiant(identifiant: string): ProfUser | null {
  return (
    (db()
      .prepare("SELECT id, identifiant, password_hash FROM prof_users WHERE identifiant = ?")
      .get(identifiant) as ProfUser | undefined) ?? null
  );
}

// Crée le compte unique depuis PROF_MOT_DE_PASSE si la table est vide. Sans effet
// si un compte existe déjà, ou si la variable d'environnement n'est pas définie.
export function amorcerSiBesoin(): void {
  const compte = db().prepare("SELECT COUNT(*) AS n FROM prof_users").get() as { n: number };
  if (compte.n > 0) return;
  const motDePasse = process.env.PROF_MOT_DE_PASSE;
  if (!motDePasse) return;
  const maintenant = Date.now();
  db()
    .prepare(
      "INSERT INTO prof_users (id, identifiant, password_hash, created_at, updated_at) VALUES (?,?,?,?,?)",
    )
    .run(randomUUID(), IDENTIFIANT_PROF, hacherMotDePasse(motDePasse), maintenant, maintenant);
}

// True si au moins un compte prof est configuré (après amorçage éventuel).
export function compteProfConfigure(): boolean {
  amorcerSiBesoin();
  const compte = db().prepare("SELECT COUNT(*) AS n FROM prof_users").get() as { n: number };
  return compte.n > 0;
}

// Vérifie identifiant + mot de passe, renvoie l'utilisateur ou null.
export function verifierConnexion(
  identifiant: string,
  motDePasse: string,
): ProfUser | null {
  amorcerSiBesoin();
  const user = profParIdentifiant(identifiant.trim());
  if (!user) return null;
  return verifierMotDePasse(motDePasse, user.password_hash) ? user : null;
}

// Crée un nouveau compte prof (email + identifiant + mot de passe). Renvoie l'id
// du compte, ou une erreur si l'identifiant ou l'email est déjà pris.
export function creerCompte(p: {
  email: string;
  identifiant: string;
  motDePasse: string;
}): { ok: true; userId: string } | { ok: false; erreur: string } {
  const identifiant = p.identifiant.trim();
  const email = p.email.trim().toLowerCase();
  if (profParIdentifiant(identifiant)) {
    return { ok: false, erreur: "Ce nom d'utilisateur est déjà pris." };
  }
  if (db().prepare("SELECT 1 FROM prof_users WHERE email = ?").get(email)) {
    return { ok: false, erreur: "Cet email est déjà utilisé." };
  }
  const userId = randomUUID();
  const maintenant = Date.now();
  db()
    .prepare(
      "INSERT INTO prof_users (id, identifiant, email, password_hash, created_at, updated_at) VALUES (?,?,?,?,?,?)",
    )
    .run(userId, identifiant, email, hacherMotDePasse(p.motDePasse), maintenant, maintenant);
  return { ok: true, userId };
}

// Vérifie le code d'inscription (CLE_INSCRIPTION). Sans variable d'environnement,
// l'inscription est désactivée (renvoie toujours false).
export function verifierCleInscription(cle: string): boolean {
  const attendu = process.env.CLE_INSCRIPTION;
  if (!attendu) return false;
  const a = Buffer.from(cle);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Change le mot de passe d'un compte (re-haché en base).
export function changerMotDePasse(userId: string, nouveau: string): void {
  db()
    .prepare("UPDATE prof_users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .run(hacherMotDePasse(nouveau), Date.now(), userId);
}

// Change le nom d'utilisateur d'un compte (≥ 3 caractères, unique).
export function changerIdentifiant(
  userId: string,
  nouveau: string,
): { ok: true } | { ok: false; raison: "court" | "pris" } {
  const identifiant = nouveau.trim();
  if (identifiant.length < 3) return { ok: false, raison: "court" };
  const existant = db()
    .prepare("SELECT id FROM prof_users WHERE identifiant = ?")
    .get(identifiant) as { id: string } | undefined;
  if (existant && existant.id !== userId) return { ok: false, raison: "pris" };
  db()
    .prepare("UPDATE prof_users SET identifiant = ?, updated_at = ? WHERE id = ?")
    .run(identifiant, Date.now(), userId);
  return { ok: true };
}

export function userParId(userId: string): ProfUser | null {
  return (
    (db()
      .prepare("SELECT id, identifiant, password_hash FROM prof_users WHERE id = ?")
      .get(userId) as ProfUser | undefined) ?? null
  );
}

// Infos affichables d'un compte (pseudo + email), sans le hash du mot de passe.
export function infosCompte(
  userId: string,
): { identifiant: string; email: string | null } | null {
  return (
    (db()
      .prepare("SELECT identifiant, email FROM prof_users WHERE id = ?")
      .get(userId) as { identifiant: string; email: string | null } | undefined) ??
    null
  );
}

// --- Sessions ---

function hashJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

// Crée une session pour `userId` et renvoie le jeton brut (à poser dans le cookie).
export function creerSession(userId: string): string {
  const jeton = randomBytes(32).toString("hex");
  const maintenant = Date.now();
  db()
    .prepare(
      "INSERT INTO prof_sessions (id, user_id, created_at, expires_at) VALUES (?,?,?,?)",
    )
    .run(hashJeton(jeton), userId, maintenant, maintenant + DUREE_SESSION_MS);
  return jeton;
}

// Renvoie le userId si le jeton correspond à une session valide (non expirée).
// Purge au passage les sessions expirées correspondantes.
export function userIdDeSession(jeton: string): string | null {
  const ligne = db()
    .prepare("SELECT user_id, expires_at FROM prof_sessions WHERE id = ?")
    .get(hashJeton(jeton)) as { user_id: string; expires_at: number } | undefined;
  if (!ligne) return null;
  if (ligne.expires_at < Date.now()) {
    db().prepare("DELETE FROM prof_sessions WHERE id = ?").run(hashJeton(jeton));
    return null;
  }
  return ligne.user_id;
}

export function supprimerSession(jeton: string): void {
  db().prepare("DELETE FROM prof_sessions WHERE id = ?").run(hashJeton(jeton));
}

// Métadonnées de session (utiles ailleurs si besoin d'éviter un import cyclique).
export const COOKIE_SESSION = "rituelio_prof";
export const MAXAGE_SESSION_S = Math.floor(DUREE_SESSION_MS / 1000);
