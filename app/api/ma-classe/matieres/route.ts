// Matières d'une classe (prof authentifié).
//  - GET  /api/ma-classe/matieres?classeId= : matières de la classe
//  - POST /api/ma-classe/matieres { classeId, nom } : crée une matière
export const dynamic = "force-dynamic";

import { creerMatiere, matieresDeClasse } from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const classeId = new URL(request.url).searchParams.get("classeId");
  if (!classeId) {
    return Response.json({ erreur: "classeId requis" }, { status: 400 });
  }
  return Response.json({
    matieres: await matieresDeClasse(session.userId, classeId),
  });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    classeId?: unknown;
    nom?: unknown;
  } | null;
  const classeId = typeof body?.classeId === "string" ? body.classeId : "";
  const nom = typeof body?.nom === "string" ? body.nom : "";
  if (!classeId) return Response.json({ erreur: "classeId requis" }, { status: 400 });
  const res = await creerMatiere(session.userId, classeId, nom);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ matiere: res.matiere }, { status: 201 });
}
