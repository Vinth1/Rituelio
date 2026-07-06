// API des classes & élèves (prof authentifié).
//  - GET /api/classes : toutes les classes du prof (avec leurs élèves)
//  - PUT /api/classes : remplace l'ensemble des classes du prof { classes: Classe[] }
export const dynamic = "force-dynamic";

import { classesDeProf, remplacerClasses } from "@/lib/serveur/classes";
import { sessionProf } from "@/lib/serveur/session-prof";
import type { Classe } from "@/lib/classes";

export async function GET() {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  return Response.json({ classes: await classesDeProf(session.userId) });
}

export async function PUT(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    classes?: unknown;
  } | null;
  if (!body || !Array.isArray(body.classes)) {
    return Response.json({ erreur: "Données invalides" }, { status: 400 });
  }
  // Validation défensive de la forme reçue (ids/noms de chaînes, élèves bien formés).
  const classes: Classe[] = [];
  for (const c of body.classes as unknown[]) {
    const cc = c as { id?: unknown; nom?: unknown; eleves?: unknown };
    if (
      typeof cc.id !== "string" ||
      typeof cc.nom !== "string" ||
      !Array.isArray(cc.eleves)
    ) {
      return Response.json({ erreur: "Classe invalide" }, { status: 400 });
    }
    const eleves: { id: string; nom: string }[] = [];
    for (const e of cc.eleves as unknown[]) {
      const ee = e as { id?: unknown; nom?: unknown };
      if (typeof ee.id !== "string" || typeof ee.nom !== "string") {
        return Response.json({ erreur: "Élève invalide" }, { status: 400 });
      }
      eleves.push({ id: ee.id, nom: ee.nom });
    }
    classes.push({ id: cc.id, nom: cc.nom, eleves });
  }
  await remplacerClasses(session.userId, classes);
  return Response.json({ ok: true });
}
