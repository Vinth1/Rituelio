// API des épreuves (module « Évaluations » générique), prof authentifié.
//  - POST /api/epreuves : crée une épreuve vierge → { id }
//  - GET  /api/epreuves : liste les épreuves du prof (résumés)
export const dynamic = "force-dynamic";

import { creerEpreuve, listerEpreuves } from "@/lib/serveur/epreuves";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    titre?: unknown;
  } | null;
  const titre = String(body?.titre ?? "").trim() || "Nouvelle épreuve";
  const { id } = await creerEpreuve(session.userId, titre);
  return Response.json({ id }, { status: 201 });
}

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ epreuves: await listerEpreuves(session.userId) });
}
