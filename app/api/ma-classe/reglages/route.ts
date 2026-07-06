// Réglages « Ma classe » (prof authentifié).
//  - GET /api/ma-classe/reglages : URLs + trimestres du prof
//  - PUT /api/ma-classe/reglages : enregistre { urlVulkan, urlClassdojo, trimestres }
export const dynamic = "force-dynamic";

import {
  enregistrerReglages,
  reglagesDeProf,
  type Trimestre,
} from "@/lib/serveur/reglages";
import { sessionProf } from "@/lib/serveur/session-prof";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json(await reglagesDeProf(session.userId));
}

export async function PUT(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    urlVulkan?: unknown;
    urlClassdojo?: unknown;
    trimestres?: unknown;
  } | null;
  if (!body) {
    return Response.json({ erreur: "Données invalides" }, { status: 400 });
  }
  const urlVulkan =
    typeof body.urlVulkan === "string" ? body.urlVulkan.trim() : "";
  const urlClassdojo =
    typeof body.urlClassdojo === "string" ? body.urlClassdojo.trim() : "";
  if (!Array.isArray(body.trimestres)) {
    return Response.json({ erreur: "Trimestres invalides" }, { status: 400 });
  }
  const trimestres: Trimestre[] = [];
  for (const t of body.trimestres as unknown[]) {
    const tt = t as { numero?: unknown; dateDebut?: unknown; dateFin?: unknown };
    if (
      typeof tt.numero !== "number" ||
      ![1, 2, 3].includes(tt.numero) ||
      typeof tt.dateDebut !== "string" ||
      typeof tt.dateFin !== "string"
    ) {
      return Response.json({ erreur: "Trimestre invalide" }, { status: 400 });
    }
    trimestres.push({
      numero: tt.numero,
      dateDebut: tt.dateDebut,
      dateFin: tt.dateFin,
    });
  }
  await enregistrerReglages(session.userId, {
    urlVulkan,
    urlClassdojo,
    trimestres,
  });
  return Response.json({ ok: true });
}
