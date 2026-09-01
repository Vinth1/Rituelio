// Dictées du prof authentifié.
//  - GET  /api/dictees?tags=imparfait,adjectifs&q=orage : ses dictées, filtrées
//  - POST /api/dictees : crée une dictée
export const dynamic = "force-dynamic";

import {
  creerDictee,
  dicteesDeProf,
  lireDicteeEntrante,
} from "@/lib/serveur/dictees";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  // Les tags voyagent en CSV : ?tags=imparfait,adjectifs (ET entre eux).
  const tags = (params.get("tags") ?? "").split(",").filter(Boolean);
  const q = params.get("q") ?? "";
  return Response.json({
    dictees: await dicteesDeProf(session.userId, { tags, q }),
  });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const lu = lireDicteeEntrante(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const dictee = await creerDictee(session.userId, lu.data);
  return Response.json({ dictee }, { status: 201 });
}
