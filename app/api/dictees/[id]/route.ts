// Une dictée précise (par id). Prof authentifié, propriétaire uniquement.
//  - GET    /api/dictees/[id] : la dictée (texte complet)
//  - PUT    /api/dictees/[id] : met à jour titre, texte et tags
//  - DELETE /api/dictees/[id] : supprime la dictée
export const dynamic = "force-dynamic";

import {
  dicteeDeProf,
  lireDicteeEntrante,
  majDictee,
  supprimerDictee,
} from "@/lib/serveur/dictees";
import { sessionProf } from "@/lib/serveur/session-prof";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const dictee = await dicteeDeProf(session.userId, id);
  if (!dictee) {
    return Response.json({ erreur: "Dictée introuvable" }, { status: 404 });
  }
  return Response.json({ dictee });
}

export async function PUT(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const lu = lireDicteeEntrante(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const { id } = await ctx.params;
  const dictee = await majDictee(session.userId, id, lu.data);
  if (!dictee) {
    return Response.json({ erreur: "Dictée introuvable" }, { status: 404 });
  }
  return Response.json({ dictee });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const supprimee = await supprimerDictee(session.userId, id);
  if (!supprimee) {
    return Response.json({ erreur: "Dictée introuvable" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
