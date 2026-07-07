// Pont « évaluation → carnet de notes » pour une évaluation précise (par code).
//  - GET  /api/evaluations/[code]/carnet : ce qu'il faut pour le formulaire d'envoi
//    (copies + notes, trimestre suggéré, doublon éventuel).
//  - POST /api/evaluations/[code]/carnet : crée la tâche + les notes dans le carnet.
// Prof authentifié uniquement (données nominatives d'élèves mineurs).
export const dynamic = "force-dynamic";

import {
  importerEvalVersCarnet,
  lireParamsImport,
  preparerImport,
} from "@/lib/serveur/import-carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { code } = await ctx.params;
  const preparation = await preparerImport(session.userId, code);
  if (!preparation) {
    return Response.json({ erreur: "Évaluation introuvable" }, { status: 404 });
  }
  return Response.json({ preparation });
}

export async function POST(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const { code } = await ctx.params;
  const lu = lireParamsImport(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await importerEvalVersCarnet(session.userId, code, lu.data);
  if (!res.ok) {
    // 409 : doublon (même session déjà importée) ou conflit d'appariement.
    return Response.json(
      { erreur: res.erreur, doublon: res.doublon ?? null },
      { status: 409 },
    );
  }
  return Response.json(res, { status: 201 });
}
