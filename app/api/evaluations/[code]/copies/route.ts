// Copies d'une évaluation.
//  - POST /api/evaluations/[code]/copies : un élève envoie sa copie
//  - GET  /api/evaluations/[code]/copies : le prof récupère les copies corrigées
export const dynamic = "force-dynamic";

import {
  copiesDe,
  enregistrerCopie,
  type CopieEntrante,
} from "@/lib/serveur/evaluations";
import { refuserSiNonProf } from "@/lib/serveur/session-prof";

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
  const resultat = enregistrerCopie(code, {
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
  const refus = await refuserSiNonProf();
  if (refus) return refus;
  const { code } = await ctx.params;
  return Response.json({ copies: copiesDe(code) });
}
