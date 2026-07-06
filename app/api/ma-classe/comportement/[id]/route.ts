// Un fait de comportement précis (par id). Prof authentifié.
//  - DELETE /api/ma-classe/comportement/[id] : supprime (correction de saisie)
export const dynamic = "force-dynamic";

import { supprimerFait } from "@/lib/serveur/comportement";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { id } = await ctx.params;
  await supprimerFait(session.userId, id);
  return Response.json({ ok: true });
}
