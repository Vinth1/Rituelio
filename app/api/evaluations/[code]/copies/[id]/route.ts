// Correction d'une copie par le prof.
//  - PATCH /api/evaluations/[code]/copies/[id]
//    body : { contraintesValidees?: string[], commentaire?: string, noteForcee?: number | null }
export const dynamic = "force-dynamic";

import {
  definirContraintesValidees,
  fixerCommentaire,
  forcerNote,
} from "@/lib/serveur/evaluations";
import { refuserSiNonProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ code: string; id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const refus = await refuserSiNonProf();
  if (refus) return refus;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    contraintesValidees?: string[];
    commentaire?: string;
    noteForcee?: number | null;
  } | null;
  if (!body) {
    return Response.json({ erreur: "Corps invalide" }, { status: 400 });
  }
  if (Array.isArray(body.contraintesValidees)) {
    await definirContraintesValidees(id, body.contraintesValidees.map(String));
  }
  if (typeof body.commentaire === "string") {
    await fixerCommentaire(id, body.commentaire);
  }
  if (body.noteForcee === null || typeof body.noteForcee === "number") {
    await forcerNote(id, body.noteForcee ?? null);
  }
  return Response.json({ ok: true });
}
