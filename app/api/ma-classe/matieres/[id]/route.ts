// Suppression d'une matière (prof authentifié) — cascade sur ses tâches et notes.
export const dynamic = "force-dynamic";

import { supprimerMatiere } from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { id } = await ctx.params;
  await supprimerMatiere(session.userId, id);
  return Response.json({ ok: true });
}
