// Authentification prof (côté serveur uniquement — dépend de `./db` et `node:crypto`).
// Mot de passe haché en base avec scrypt (aucune dépendance externe). Sessions
// opaques : le cookie contient un jeton aléatoire ; on ne stocke en base que son
// hash SHA-256 (si la base fuit, les jetons ne sont pas réutilisables).
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { sql } from "./db";

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

async function profParIdentifiant(identifiant: string): Promise<ProfUser | null> {
  const [row] = await sql()`
    SELECT id, identifiant, password_hash FROM prof_users WHERE identifiant = ${identifiant}
  `;
  return (row as ProfUser | undefined) ?? null;
}

// Crée le compte unique depuis PROF_MOT_DE_PASSE si la table est vide. Sans effet
// si un compte existe déjà, ou si la variable d'environnement n'est pas définie.
export async function amorcerSiBesoin(): Promise<void> {
  const [compte] = await sql()`SELECT COUNT(*)::int AS n FROM prof_users`;
  if ((compte as { n: number }).n > 0) return;
  const motDePasse = process.env.PROF_MOT_DE_PASSE;
  if (!motDePasse) return;
  const maintenant = Date.now();
  await sql()`
    INSERT INTO prof_users (id, identifiant, password_hash, created_at, updated_at)
    VALUES (${randomUUID()}, ${IDENTIFIANT_PROF}, ${hacherMotDePasse(motDePasse)}, ${maintenant}, ${maintenant})
  `;
}

// True si au moins un compte prof est configuré (après amorçage éventuel).
export async function compteProfConfigure(): Promise<boolean> {
  await amorcerSiBesoin();
  const [compte] = await sql()`SELECT COUNT(*)::int AS n FROM prof_users`;
  return (compte as { n: number }).n > 0;
}

// Vérifie identifiant + mot de passe, renvoie l'utilisateur ou null.
export async function verifierConnexion(
  identifiant: string,
  motDePasse: string,
): Promise<ProfUser | null> {
  await amorcerSiBesoin();
  const user = await profParIdentifiant(identifiant.trim());
  if (!user) return null;
  return verifierMotDePasse(motDePasse, user.password_hash) ? user : null;
}

// Crée un nouveau compte prof (email + identifiant + mot de passe). Renvoie l'id
// du compte, ou une erreur si l'identifiant ou l'email est déjà pris.
export async function creerCompte(p: {
  email: string;
  identifiant: string;
  motDePasse: string;
}): Promise<{ ok: true; userId: string } | { ok: false; erreur: string }> {
  const identifiant = p.identifiant.trim();
  const email = p.email.trim().toLowerCase();
  if (await profParIdentifiant(identifiant)) {
    return { ok: false, erreur: "Ce nom d'utilisateur est déjà pris." };
  }
  const [dejaEmail] = await sql()`SELECT 1 FROM prof_users WHERE email = ${email}`;
  if (dejaEmail) {
    return { ok: false, erreur: "Cet email est déjà utilisé." };
  }
  const userId = randomUUID();
  const maintenant = Date.now();
  await sql()`
    INSERT INTO prof_users (id, identifiant, email, password_hash, created_at, updated_at)
    VALUES (${userId}, ${identifiant}, ${email}, ${hacherMotDePasse(p.motDePasse)}, ${maintenant}, ${maintenant})
  `;
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
export async function changerMotDePasse(userId: string, nouveau: string): Promise<void> {
  await sql()`
    UPDATE prof_users SET password_hash = ${hacherMotDePasse(nouveau)}, updated_at = ${Date.now()}
    WHERE id = ${userId}
  `;
}

// Change le nom d'utilisateur d'un compte (≥ 3 caractères, unique).
export async function changerIdentifiant(
  userId: string,
  nouveau: string,
): Promise<{ ok: true } | { ok: false; raison: "court" | "pris" }> {
  const identifiant = nouveau.trim();
  if (identifiant.length < 3) return { ok: false, raison: "court" };
  const [existant] = await sql()`
    SELECT id FROM prof_users WHERE identifiant = ${identifiant}
  `;
  if (existant && (existant as { id: string }).id !== userId) {
    return { ok: false, raison: "pris" };
  }
  await sql()`
    UPDATE prof_users SET identifiant = ${identifiant}, updated_at = ${Date.now()}
    WHERE id = ${userId}
  `;
  return { ok: true };
}

export async function userParId(userId: string): Promise<ProfUser | null> {
  const [row] = await sql()`
    SELECT id, identifiant, password_hash FROM prof_users WHERE id = ${userId}
  `;
  return (row as ProfUser | undefined) ?? null;
}

// Infos affichables d'un compte (pseudo + email), sans le hash du mot de passe.
export async function infosCompte(
  userId: string,
): Promise<{ identifiant: string; email: string | null } | null> {
  const [row] = await sql()`
    SELECT identifiant, email FROM prof_users WHERE id = ${userId}
  `;
  return (row as { identifiant: string; email: string | null } | undefined) ?? null;
}

// --- Sessions ---

function hashJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

// Crée une session pour `userId` et renvoie le jeton brut (à poser dans le cookie).
export async function creerSession(userId: string): Promise<string> {
  const jeton = randomBytes(32).toString("hex");
  const maintenant = Date.now();
  await sql()`
    INSERT INTO prof_sessions (id, user_id, created_at, expires_at)
    VALUES (${hashJeton(jeton)}, ${userId}, ${maintenant}, ${maintenant + DUREE_SESSION_MS})
  `;
  return jeton;
}

// Renvoie le userId si le jeton correspond à une session valide (non expirée).
// Purge au passage la session expirée correspondante.
export async function userIdDeSession(jeton: string): Promise<string | null> {
  const [ligne] = await sql()`
    SELECT user_id, expires_at FROM prof_sessions WHERE id = ${hashJeton(jeton)}
  `;
  if (!ligne) return null;
  const { user_id, expires_at } = ligne as { user_id: string; expires_at: number };
  if (expires_at < Date.now()) {
    await sql()`DELETE FROM prof_sessions WHERE id = ${hashJeton(jeton)}`;
    return null;
  }
  return user_id;
}

export async function supprimerSession(jeton: string): Promise<void> {
  await sql()`DELETE FROM prof_sessions WHERE id = ${hashJeton(jeton)}`;
}

// Métadonnées de session (utiles ailleurs si besoin d'éviter un import cyclique).
export const COOKIE_SESSION = "rituelio_prof";
export const MAXAGE_SESSION_S = Math.floor(DUREE_SESSION_MS / 1000);
