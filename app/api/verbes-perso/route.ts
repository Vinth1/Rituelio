// Verbes personnalisés du prof authentifié.
//  - GET  /api/verbes-perso : ses verbes
//  - POST /api/verbes-perso : crée ou met à jour un verbe (par infinitif)
export const dynamic = "force-dynamic";

import {
  enregistrerVerbePerso,
  lireVerbeEntrant,
  verbesPersoDeProf,
} from "@/lib/serveur/verbes-perso";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ verbes: await verbesPersoDeProf(session.userId) });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const lu = lireVerbeEntrant(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const verbe = await enregistrerVerbePerso(session.userId, lu.data);
  return Response.json({ verbe }, { status: 201 });
}
