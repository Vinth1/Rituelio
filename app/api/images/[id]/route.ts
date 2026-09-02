// Une image de la banque du prof authentifié.
//  - PATCH  /api/images/<id> : renomme et réétiquette
//  - DELETE /api/images/<id> : retire la ligne ET le fichier
export const dynamic = "force-dynamic";

import { lireModification, majImage, supprimerImage } from "@/lib/serveur/images";
import { sessionProf } from "@/lib/serveur/session-prof";
import { supprimer } from "@/lib/serveur/stockage-images";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const lu = lireModification(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });

  const image = await majImage(session.userId, id, lu.data);
  if (!image) return Response.json({ erreur: "Image introuvable" }, { status: 404 });
  return Response.json({ image });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  // La ligne part d'abord : c'est elle qui fait autorité. Le fichier suit, et
  // son absence éventuelle ne doit pas faire échouer la suppression.
  const image = await supprimerImage(session.userId, id);
  if (!image) return Response.json({ erreur: "Image introuvable" }, { status: 404 });
  await supprimer(image);
  return Response.json({ ok: true });
}
