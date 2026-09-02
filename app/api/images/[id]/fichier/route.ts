// Sert le fichier d'une image de la banque — REPLI DE DÉVELOPPEMENT seulement.
// En production, `images_prof.url` pointe directement vers Vercel Blob et cette
// route n'est jamais appelée (voir lib/serveur/stockage-images.ts).
//  - GET /api/images/<id>/fichier
export const dynamic = "force-dynamic";

import { cleDeProf } from "@/lib/serveur/images";
import { sessionProf } from "@/lib/serveur/session-prof";
import { lireFichierLocal } from "@/lib/serveur/stockage-images";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const image = await cleDeProf(session.userId, id);
  if (!image) return Response.json({ erreur: "Image introuvable" }, { status: 404 });

  const donnees = await lireFichierLocal(image.cle);
  if (!donnees) return Response.json({ erreur: "Fichier introuvable" }, { status: 404 });

  return new Response(new Uint8Array(donnees), {
    headers: {
      "Content-Type": image.mime,
      // Le contenu d'un id donné ne change jamais : le navigateur peut le garder.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
