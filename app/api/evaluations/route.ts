// API des évaluations de conjugaison.
//  - POST /api/evaluations            : crée une évaluation (prof) → renvoie le code
//  - GET  /api/evaluations?classeId=  : liste les évaluations d'une classe (historique)
export const dynamic = "force-dynamic";

import {
  creerEvaluation,
  evaluationsDeClasse,
  type VerbeRef,
} from "@/lib/serveur/evaluations";

type CorpsCreation = {
  name?: string;
  classeId?: string;
  classeNom?: string;
  date?: string;
  verbes?: VerbeRef[];
  contraintes?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CorpsCreation | null;
  if (!body || !Array.isArray(body.verbes) || body.verbes.length === 0) {
    return Response.json({ erreur: "Données invalides" }, { status: 400 });
  }
  const date = String(body.date ?? "");
  const { code } = creerEvaluation({
    name: body.name?.trim() || `Évaluation du ${date || "jour"}`,
    classeId: String(body.classeId ?? ""),
    classeNom: String(body.classeNom ?? ""),
    date,
    verbes: body.verbes.map((v) => ({
      infinitif: String(v.infinitif),
      temps: String(v.temps),
      mode: String(v.mode),
    })),
    contraintes: Array.isArray(body.contraintes)
      ? body.contraintes.map((c) => String(c))
      : [],
  });
  return Response.json({ code }, { status: 201 });
}

export async function GET(request: Request) {
  const classeId = new URL(request.url).searchParams.get("classeId");
  if (!classeId) {
    return Response.json({ erreur: "classeId requis" }, { status: 400 });
  }
  return Response.json({ evaluations: evaluationsDeClasse(classeId) });
}
