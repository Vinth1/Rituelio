// Un verbe personnalisé précis (par id). Prof authentifié.
//  - DELETE /api/verbes-perso/[id] : supprime le verbe
export const dynamic = "force-dynamic";

import { supprimerVerbePerso } from "@/lib/serveur/verbes-perso";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supprime = await supprimerVerbePerso(session.userId, id);
  if (!supprime) {
    return Response.json({ erreur: "Verbe introuvable" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
