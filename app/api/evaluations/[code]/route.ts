// Une évaluation précise (par code).
//  - GET   /api/evaluations/[code]  : infos publiques pour l'élève (sans réponses)
//  - PATCH /api/evaluations/[code]  : { statut: "terminee" } pour clôturer
export const dynamic = "force-dynamic";

import { evaluationParCode, terminer } from "@/lib/serveur/evaluations";
import { refuserSiNonProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const evaluation = await evaluationParCode(code);
  if (!evaluation) {
    return Response.json({ erreur: "Évaluation introuvable" }, { status: 404 });
  }
  return Response.json({ evaluation });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const refus = await refuserSiNonProf();
  if (refus) return refus;
  const { code } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    statut?: string;
  } | null;
  if (body?.statut === "terminee") {
    await terminer(code);
    return Response.json({ ok: true });
  }
  return Response.json({ erreur: "Action inconnue" }, { status: 400 });
}
