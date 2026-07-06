// Changement de mot de passe prof (authentifié) :
// POST /api/auth/mot-de-passe { actuel, nouveau }
export const dynamic = "force-dynamic";

import { sessionProf } from "@/lib/serveur/session-prof";
import {
  changerMotDePasse,
  userParId,
  verifierMotDePasse,
} from "@/lib/serveur/auth";

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    actuel?: string;
    nouveau?: string;
  } | null;
  const actuel = typeof body?.actuel === "string" ? body.actuel : "";
  const nouveau = typeof body?.nouveau === "string" ? body.nouveau : "";
  if (nouveau.length < 6) {
    return Response.json(
      { erreur: "Le nouveau mot de passe doit faire au moins 6 caractères." },
      { status: 400 },
    );
  }
  const user = await userParId(session.userId);
  if (!user || !verifierMotDePasse(actuel, user.password_hash)) {
    return Response.json(
      { erreur: "Mot de passe actuel incorrect." },
      { status: 403 },
    );
  }
  await changerMotDePasse(user.id, nouveau);
  return Response.json({ ok: true });
}
