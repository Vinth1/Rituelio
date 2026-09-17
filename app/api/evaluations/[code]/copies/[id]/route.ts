// Correction d'une copie par le prof.
//  - PATCH /api/evaluations/[code]/copies/[id]
//    body : { contraintesValidees?: string[], commentaire?: string, noteForcee?: number | null }
//    404 si la copie n'appartient pas à l'évaluation `code`, ou si celle-ci est à
//    un autre prof.
export const dynamic = "force-dynamic";

import {
  copieDuProf,
  definirContraintesValidees,
  fixerCommentaire,
  forcerNote,
} from "@/lib/serveur/evaluations";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ code: string; id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { code, id } = await ctx.params;
  if (!(await copieDuProf(session.userId, code, id))) {
    return Response.json({ erreur: "Copie introuvable" }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as {
    contraintesValidees?: string[];
    commentaire?: string;
    noteForcee?: number | null;
  } | null;
  if (!body) {
    return Response.json({ erreur: "Corps invalide" }, { status: 400 });
  }
  if (Array.isArray(body.contraintesValidees)) {
    await definirContraintesValidees(
      session.userId,
      code,
      id,
      body.contraintesValidees.map(String),
    );
  }
  if (typeof body.commentaire === "string") {
    await fixerCommentaire(session.userId, code, id, body.commentaire);
  }
  if (body.noteForcee === null || typeof body.noteForcee === "number") {
    await forcerNote(session.userId, code, id, body.noteForcee ?? null);
  }
  return Response.json({ ok: true });
}
