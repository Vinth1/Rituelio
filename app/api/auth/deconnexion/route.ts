// Déconnexion prof : POST /api/auth/deconnexion
// Invalide la session en base et supprime le cookie.
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { COOKIE_SESSION, supprimerSession } from "@/lib/serveur/auth";

export async function POST() {
  const store = await cookies();
  const jeton = store.get(COOKIE_SESSION)?.value;
  if (jeton) await supprimerSession(jeton);
  store.delete(COOKIE_SESSION);
  return Response.json({ ok: true });
}
