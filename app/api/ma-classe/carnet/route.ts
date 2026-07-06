// Vue carnet : tâches + notes d'un (matière, trimestre). Prof authentifié.
//  - GET /api/ma-classe/carnet?matiereId=&trimestre=
export const dynamic = "force-dynamic";

import { carnetDe } from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const matiereId = p.get("matiereId") ?? "";
  const trimestre = Number(p.get("trimestre"));
  if (!matiereId || ![1, 2, 3].includes(trimestre)) {
    return Response.json({ erreur: "Paramètres invalides" }, { status: 400 });
  }
  return Response.json(await carnetDe(session.userId, matiereId, trimestre));
}
