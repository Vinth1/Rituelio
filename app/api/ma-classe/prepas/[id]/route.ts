// Une prépa précise (par id) — prof authentifié.
//  - DELETE /api/ma-classe/prepas/[id] : supprime la prépa
export const dynamic = "force-dynamic";

import { supprimerPrepa } from "@/lib/serveur/prepas";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await supprimerPrepa(session.userId, id);
  return Response.json({ ok: true });
}
