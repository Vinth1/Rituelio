// Tags déjà utilisés par le prof authentifié, les plus fréquents d'abord.
// Alimente l'autocomplétion du champ de tags et les pastilles de recherche.
//  - GET /api/dictees/tags → { tags: [{ tag, n }] }
export const dynamic = "force-dynamic";

import { tagsDeProf } from "@/lib/serveur/dictees";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ tags: await tagsDeProf(session.userId) });
}
