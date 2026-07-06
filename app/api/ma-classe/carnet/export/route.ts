// Export Excel du carnet d'une matière (prof authentifié).
//  - GET /api/ma-classe/carnet/export?matiereId=&trimestre=N   (un trimestre)
//  - GET /api/ma-classe/carnet/export?matiereId=&tout=1         (les 3 trimestres)
export const dynamic = "force-dynamic";

import { genererCarnetXlsx } from "@/lib/serveur/export-carnet";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const matiereId = p.get("matiereId") ?? "";
  if (!matiereId) {
    return Response.json({ erreur: "matiereId requis" }, { status: 400 });
  }
  const tout = p.get("tout") === "1";
  const trimestre = Number(p.get("trimestre"));
  const trimestres = tout
    ? [1, 2, 3]
    : [1, 2, 3].includes(trimestre)
      ? [trimestre]
      : [];
  if (trimestres.length === 0) {
    return Response.json({ erreur: "Trimestre invalide" }, { status: 400 });
  }

  const res = await genererCarnetXlsx(session.userId, matiereId, trimestres);
  if (!res) return Response.json({ erreur: "Matière introuvable" }, { status: 404 });

  // Nom de fichier : version ASCII (repli) + version UTF-8 (RFC 5987).
  const complet = `${res.nomFichier}.xlsx`;
  const ascii = complet
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "_");
  return new Response(new Uint8Array(res.buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(complet)}`,
    },
  });
}
