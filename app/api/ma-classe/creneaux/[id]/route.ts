// Un créneau précis (par id) — prof authentifié.
//  - PUT    /api/ma-classe/creneaux/[id] : modifie (409 si chevauchement)
//  - DELETE /api/ma-classe/creneaux/[id] : supprime
export const dynamic = "force-dynamic";

import {
  lireEntreeCreneau,
  modifierCreneau,
  supprimerCreneau,
} from "@/lib/serveur/creneaux";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const lu = lireEntreeCreneau(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await modifierCreneau(session.userId, id, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await supprimerCreneau(session.userId, id);
  return Response.json({ ok: true });
}
