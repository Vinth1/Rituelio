// Copies d'une évaluation.
//  - POST /api/evaluations/[code]/copies : un élève envoie sa copie
//  - GET  /api/evaluations/[code]/copies : le prof récupère les copies corrigées
//    (propriétaire uniquement : 404 pour l'évaluation d'un autre prof)
export const dynamic = "force-dynamic";

import {
  copiesDe,
  enregistrerCopie,
  type CopieEntrante,
} from "@/lib/serveur/evaluations";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const body = (await request.json().catch(() => null)) as
    | Partial<CopieEntrante>
    | null;
  if (
    !body ||
    typeof body.prenom !== "string" ||
    !body.prenom.trim() ||
    !Array.isArray(body.tableaux)
  ) {
    return Response.json({ erreur: "Copie invalide" }, { status: 400 });
  }
  const resultat = await enregistrerCopie(code, {
    prenom: body.prenom.trim(),
    tableaux: body.tableaux,
    phrase: typeof body.phrase === "string" ? body.phrase : "",
  });
  if (!resultat) {
    return Response.json(
      { erreur: "Évaluation fermée ou introuvable" },
      { status: 409 },
    );
  }
  return Response.json(resultat, { status: 201 });
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { code } = await ctx.params;
  const copies = await copiesDe(session.userId, code);
  if (!copies) {
    return Response.json({ erreur: "Évaluation introuvable" }, { status: 404 });
  }
  return Response.json({ copies });
}
