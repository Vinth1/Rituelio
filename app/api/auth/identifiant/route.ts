// Changement de nom d'utilisateur prof (authentifié) :
// POST /api/auth/identifiant { identifiant }
export const dynamic = "force-dynamic";

import { sessionProf } from "@/lib/serveur/session-prof";
import { changerIdentifiant } from "@/lib/serveur/auth";

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    identifiant?: string;
  } | null;
  const identifiant =
    typeof body?.identifiant === "string" ? body.identifiant : "";

  const res = await changerIdentifiant(session.userId, identifiant);
  if (!res.ok) {
    if (res.raison === "court") {
      return Response.json(
        { erreur: "Le nom d'utilisateur doit faire au moins 3 caractères." },
        { status: 400 },
      );
    }
    return Response.json(
      { erreur: "Ce nom d'utilisateur est déjà pris." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
