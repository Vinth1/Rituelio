// Connexion prof : POST /api/auth/connexion { identifiant, motDePasse }
//  - succès → crée une session, pose le cookie httpOnly, { ok: true }
//  - mot de passe faux → 401 ; compte non configuré → 503
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import {
  COOKIE_SESSION,
  MAXAGE_SESSION_S,
  creerSession,
  verifierConnexion,
} from "@/lib/serveur/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    identifiant?: string;
    motDePasse?: string;
  } | null;
  const identifiant =
    typeof body?.identifiant === "string" ? body.identifiant : "";
  const motDePasse = typeof body?.motDePasse === "string" ? body.motDePasse : "";
  if (!identifiant.trim() || !motDePasse) {
    return Response.json(
      { erreur: "Identifiant et mot de passe requis." },
      { status: 400 },
    );
  }
  const user = verifierConnexion(identifiant, motDePasse);
  if (!user) {
    return Response.json(
      { erreur: "Identifiant ou mot de passe incorrect." },
      { status: 401 },
    );
  }
  const jeton = creerSession(user.id);
  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAXAGE_SESSION_S,
  });
  return Response.json({ ok: true });
}
