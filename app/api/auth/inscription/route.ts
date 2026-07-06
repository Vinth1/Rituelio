// Création d'un compte prof : POST /api/auth/inscription
//   { email, identifiant, motDePasse, cleInscription }
// Exige un code d'inscription valide (CLE_INSCRIPTION). En cas de succès, crée le
// compte, ouvre une session et pose le cookie (connexion automatique).
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import {
  COOKIE_SESSION,
  MAXAGE_SESSION_S,
  creerCompte,
  creerSession,
  verifierCleInscription,
} from "@/lib/serveur/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    identifiant?: string;
    motDePasse?: string;
    cleInscription?: string;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const identifiant =
    typeof body?.identifiant === "string" ? body.identifiant.trim() : "";
  const motDePasse = typeof body?.motDePasse === "string" ? body.motDePasse : "";
  const cle = typeof body?.cleInscription === "string" ? body.cleInscription : "";

  if (!verifierCleInscription(cle)) {
    return Response.json(
      { erreur: "Code d'inscription invalide." },
      { status: 403 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ erreur: "Email invalide." }, { status: 400 });
  }
  if (identifiant.length < 3) {
    return Response.json(
      { erreur: "Le nom d'utilisateur doit faire au moins 3 caractères." },
      { status: 400 },
    );
  }
  if (motDePasse.length < 6) {
    return Response.json(
      { erreur: "Le mot de passe doit faire au moins 6 caractères." },
      { status: 400 },
    );
  }

  const res = await creerCompte({ email, identifiant, motDePasse });
  if (!res.ok) {
    return Response.json({ erreur: res.erreur }, { status: 409 });
  }

  const jeton = await creerSession(res.userId);
  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAXAGE_SESSION_S,
  });
  return Response.json({ ok: true }, { status: 201 });
}
