// Thèmes déjà utilisés par le prof authentifié, les plus fréquents d'abord.
// Alimente l'autocomplétion du champ de thèmes et le filtre du jeu.
//  - GET /api/images/tags → { tags: [{ tag, n }] }
export const dynamic = "force-dynamic";

import { tagsImagesDeProf } from "@/lib/serveur/images";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ tags: await tagsImagesDeProf(session.userId) });
}
