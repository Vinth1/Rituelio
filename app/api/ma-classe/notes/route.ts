// Note d'un élève pour une tâche (upsert). Prof authentifié.
//  - PUT /api/ma-classe/notes { tacheId, eleveId, points|null, commentaire }
export const dynamic = "force-dynamic";

import { enregistrerNote } from "@/lib/serveur/carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function PUT(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    tacheId?: unknown;
    eleveId?: unknown;
    points?: unknown;
    commentaire?: unknown;
  } | null;
  const tacheId = typeof body?.tacheId === "string" ? body.tacheId : "";
  const eleveId = typeof body?.eleveId === "string" ? body.eleveId : "";
  if (!tacheId || !eleveId) {
    return Response.json({ erreur: "tacheId et eleveId requis" }, { status: 400 });
  }
  const points =
    typeof body?.points === "number" && Number.isFinite(body.points)
      ? body.points
      : null;
  const commentaire =
    typeof body?.commentaire === "string" ? body.commentaire : "";
  const res = await enregistrerNote(
    session.userId,
    tacheId,
    eleveId,
    points,
    commentaire,
  );
  if (!res.ok) return Response.json({ erreur: res.erreur }, { status: 409 });
  return Response.json({ ok: true });
}
