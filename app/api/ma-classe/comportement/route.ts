// Faits de comportement d'une classe. Prof authentifié.
//  - GET  /api/ma-classe/comportement?classeId=   : tous les faits de la classe
//  - POST /api/ma-classe/comportement { eleveId, classeId, dateISO, type, raison, details }
export const dynamic = "force-dynamic";

import {
  creerFait,
  faitsDeClasse,
  lireEntreeFait,
} from "@/lib/serveur/comportement";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const classeId = new URL(request.url).searchParams.get("classeId") ?? "";
  if (!classeId) return Response.json({ erreur: "classeId requis" }, { status: 400 });
  return Response.json({ faits: await faitsDeClasse(session.userId, classeId) });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const lu = lireEntreeFait(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await creerFait(session.userId, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ fait: res.fait }, { status: 201 });
}
