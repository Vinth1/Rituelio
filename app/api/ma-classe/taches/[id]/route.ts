// Une tâche précise (par id). Prof authentifié.
//  - PUT    /api/ma-classe/taches/[id] : modifie
//  - DELETE /api/ma-classe/taches/[id] : supprime (cascade sur ses notes)
export const dynamic = "force-dynamic";

import {
  lireEntreeTache,
  modifierTache,
  supprimerTache,
} from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { id } = await ctx.params;
  const lu = lireEntreeTache(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await modifierTache(session.userId, id, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ tache: res.tache });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { id } = await ctx.params;
  await supprimerTache(session.userId, id);
  return Response.json({ ok: true });
}
