// Créneaux de l'emploi du temps (prof authentifié).
//  - GET  /api/ma-classe/creneaux : liste des créneaux du prof
//  - POST /api/ma-classe/creneaux : crée un créneau (409 si chevauchement)
export const dynamic = "force-dynamic";

import {
  creerCreneau,
  creneauxDeProf,
  lireEntreeCreneau,
} from "@/lib/serveur/creneaux";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ creneaux: await creneauxDeProf(session.userId) });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const lu = lireEntreeCreneau(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await creerCreneau(session.userId, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ id: res.id }, { status: 201 });
}
