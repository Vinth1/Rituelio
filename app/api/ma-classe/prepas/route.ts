// Prépas de cours (prof authentifié).
//  - GET /api/ma-classe/prepas?du=AAAA-MM-JJ&au=AAAA-MM-JJ : prépas de la période
//  - PUT /api/ma-classe/prepas : crée ou met à jour (upsert par créneau + date)
export const dynamic = "force-dynamic";

import {
  enregistrerPrepa,
  lireEntreePrepa,
  prepasEntreDates,
} from "@/lib/serveur/prepas";
import { sessionProf } from "@/lib/serveur/session-prof";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const du = params.get("du") ?? "";
  const au = params.get("au") ?? "";
  if (!ISO.test(du) || !ISO.test(au)) {
    return Response.json({ erreur: "Période invalide" }, { status: 400 });
  }
  return Response.json({ prepas: await prepasEntreDates(session.userId, du, au) });
}

export async function PUT(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const lu = lireEntreePrepa(await request.json().catch(() => null));
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });
  const res = await enregistrerPrepa(session.userId, lu.data);
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ prepa: res.prepa });
}
