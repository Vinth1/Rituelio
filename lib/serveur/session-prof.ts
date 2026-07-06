// Accès à la session prof courante (côté serveur). Utilisable dans les server
// components (pages) ET les route handlers : les deux tournent en runtime Node,
// où `cookies()` et SQLite sont disponibles. Enveloppé dans `cache()` pour ne
// valider qu'une fois par requête.
import { cookies } from "next/headers";
import { cache } from "react";
import { COOKIE_SESSION, infosCompte, userIdDeSession } from "./auth";

export type SessionProf = { userId: string };
export type ProfConnecte = {
  userId: string;
  identifiant: string;
  email: string | null;
};

export const sessionProf = cache(async (): Promise<SessionProf | null> => {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton) return null;
  const userId = await userIdDeSession(jeton);
  return userId ? { userId } : null;
});

// Session + infos affichables du compte (pseudo, email). Pour l'en-tête et /profil.
export const profConnecte = cache(async (): Promise<ProfConnecte | null> => {
  const session = await sessionProf();
  if (!session) return null;
  const infos = await infosCompte(session.userId);
  return infos ? { userId: session.userId, ...infos } : null;
});

// Renvoie une réponse 401 prête à l'emploi pour les route handlers protégés,
// ou null si le prof est bien authentifié.
export async function refuserSiNonProf(): Promise<Response | null> {
  const session = await sessionProf();
  if (session) return null;
  return Response.json({ erreur: "Non autorisé" }, { status: 401 });
}
