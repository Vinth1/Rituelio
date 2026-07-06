// Création d'une tâche (colonne du carnet). Prof authentifié.
//  - POST /api/ma-classe/taches { matiereId, trimestre, dateISO, nom, bareme, ponderation }
export const dynamic = "force-dynamic";

import { creerTache, lireEntreeTache } from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const lu = lireEntreeTache(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await creerTache(session.userId, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ tache: res.tache }, { status: 201 });
}
