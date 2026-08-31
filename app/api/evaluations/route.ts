// API des évaluations de conjugaison.
//  - POST /api/evaluations            : crée une évaluation (prof) → renvoie le code
//  - GET  /api/evaluations?classeId=  : liste les évaluations d'une classe (historique)
export const dynamic = "force-dynamic";

import {
  creerEvaluation,
  evaluationsDeClasse,
  type VerbeRef,
} from "@/lib/serveur/evaluations";
import type { FormesFigees } from "@/lib/evaluation-types";
import { refuserSiNonProf, sessionProf } from "@/lib/serveur/session-prof";

type CorpsCreation = {
  name?: string;
  classeId?: string;
  classeNom?: string;
  date?: string;
  verbes?: VerbeRef[];
  contraintes?: string[];
};

// Le corrigé figé arrive du navigateur : on le revalide avant de l'écrire en
// base, et une donnée douteuse est simplement ignorée — la correction retombera
// alors sur la banque de verbes.
const MAX_FORME = 80;

function formesValides(brut: unknown): FormesFigees | undefined {
  if (!brut || typeof brut !== "object") return undefined;
  const o = brut as { formes?: unknown; lignes?: unknown; variantes?: unknown };
  if (!Array.isArray(o.formes) || o.formes.length !== 6) return undefined;
  if (!o.formes.every((f) => typeof f === "string" && f.length <= MAX_FORME)) {
    return undefined;
  }
  const lignes =
    Array.isArray(o.lignes) &&
    o.lignes.every((n) => typeof n === "number" && n >= 0 && n <= 5)
      ? (o.lignes as number[])
      : undefined;
  const variantes =
    Array.isArray(o.variantes) && o.variantes.length === 6
      ? o.variantes.map((v) =>
          Array.isArray(v) &&
          v.every((x) => typeof x === "string" && x.length <= MAX_FORME)
            ? (v as string[])
            : null,
        )
      : undefined;
  return { formes: o.formes as string[], lignes, variantes };
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as CorpsCreation | null;
  if (!body || !Array.isArray(body.verbes) || body.verbes.length === 0) {
    return Response.json({ erreur: "Données invalides" }, { status: 400 });
  }
  const date = String(body.date ?? "");
  const { code } = await creerEvaluation({
    name: body.name?.trim() || `Évaluation du ${date || "jour"}`,
    userId: session.userId,
    classeId: String(body.classeId ?? ""),
    classeNom: String(body.classeNom ?? ""),
    date,
    verbes: body.verbes.map((v) => ({
      infinitif: String(v.infinitif),
      temps: String(v.temps),
      mode: String(v.mode),
      formes: formesValides(v.formes),
    })),
    contraintes: Array.isArray(body.contraintes)
      ? body.contraintes.map((c) => String(c))
      : [],
  });
  return Response.json({ code }, { status: 201 });
}

export async function GET(request: Request) {
  const refus = await refuserSiNonProf();
  if (refus) return refus;
  const classeId = new URL(request.url).searchParams.get("classeId");
  if (!classeId) {
    return Response.json({ erreur: "classeId requis" }, { status: 400 });
  }
  return Response.json({ evaluations: await evaluationsDeClasse(classeId) });
}
