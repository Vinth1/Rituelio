// Une épreuve précise (prof authentifié).
//  - GET    /api/epreuves/[id] : épreuve complète (avec ses questions)
//  - PUT    /api/epreuves/[id] : remplace titre + questions
//  - DELETE /api/epreuves/[id] : supprime l'épreuve (cascade)
export const dynamic = "force-dynamic";

import {
  epreuveComplete,
  majEpreuve,
  supprimerEpreuve,
} from "@/lib/serveur/epreuves";
import { sessionProf } from "@/lib/serveur/session-prof";
import type { EpreuveEntrante } from "@/lib/epreuves/modele";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const epreuve = await epreuveComplete(session.userId, id);
  if (!epreuve) {
    return Response.json({ erreur: "Épreuve introuvable" }, { status: 404 });
  }
  return Response.json({ epreuve });
}

export async function PUT(request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as {
    titre?: unknown;
    description?: unknown;
    melangeQuestions?: unknown;
    questions?: unknown;
  } | null;
  if (!body || !Array.isArray(body.questions)) {
    return Response.json({ erreur: "Données invalides" }, { status: 400 });
  }
  const data: EpreuveEntrante = {
    titre: String(body.titre ?? "").trim() || "Épreuve sans titre",
    description: String(body.description ?? ""),
    melangeQuestions: body.melangeQuestions === true,
    questions: (body.questions as unknown[]).map((q) => {
      const qq = q as {
        type?: unknown;
        enonce?: unknown;
        points?: unknown;
        config?: unknown;
      };
      return {
        type: String(qq.type ?? ""),
        enonce: String(qq.enonce ?? ""),
        points: typeof qq.points === "number" ? qq.points : Number(qq.points) || 0,
        config: qq.config ?? {},
      };
    }),
  };
  const res = await majEpreuve(session.userId, id, data);
  if (res === null) {
    return Response.json({ erreur: "Épreuve introuvable" }, { status: 404 });
  }
  if (!res.ok) {
    return Response.json({ erreur: res.erreur }, { status: 400 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await supprimerEpreuve(session.userId, id);
  return Response.json({ ok: true });
}
