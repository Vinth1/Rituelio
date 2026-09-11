// Banque d'images du prof authentifié.
//  - GET  /api/images?tags=ville,nourriture : ses images, filtrées par thèmes
//  - POST /api/images : téléverse une image (multipart) et l'enregistre
export const dynamic = "force-dynamic";

import { creerImage, imagesDeProf, lireMetaEntrantes } from "@/lib/serveur/images";
import { sessionProf } from "@/lib/serveur/session-prof";
import { deposer, supprimer, surVercelBlob } from "@/lib/serveur/stockage-images";
import { MAX_OCTETS, tailleLisible } from "@/lib/images";

export async function GET(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  // Les thèmes voyagent en CSV : ?tags=ville,ete (ET entre eux).
  const tags = (params.get("tags") ?? "").split(",").filter(Boolean);
  return Response.json({ images: await imagesDeProf(session.userId, { tags }) });
}

export async function POST(request: Request) {
  const session = await sessionProf();
  if (!session) {
    return Response.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const fichier = form?.get("fichier");
  if (!form || !(fichier instanceof File)) {
    return Response.json({ erreur: "Aucun fichier reçu" }, { status: 400 });
  }
  if (fichier.size === 0) {
    return Response.json({ erreur: "Fichier vide" }, { status: 400 });
  }
  if (fichier.size > MAX_OCTETS) {
    return Response.json(
      { erreur: `Image trop lourde (max ${tailleLisible(MAX_OCTETS)})` },
      { status: 400 },
    );
  }

  const lu = lireMetaEntrantes(form, fichier.type);
  if (!lu.ok) return Response.json({ erreur: lu.erreur }, { status: 400 });

  // L'id est tiré ici : le repli local en fait l'URL du fichier.
  const id = crypto.randomUUID();
  let depot;
  try {
    depot = await deposer(id, await fichier.arrayBuffer(), fichier.type);
  } catch (e) {
    // Sans trace, la cause reste invisible dans les logs Vercel et le prof n'a
    // qu'un message générique : on journalise, et on dit où regarder.
    console.error("[images] dépôt du fichier impossible", e);
    return Response.json(
      {
        erreur: surVercelBlob()
          ? "Le dépôt sur Vercel Blob a échoué (jeton ou store Blob à vérifier)"
          : "Le stockage des images n'est pas disponible",
      },
      { status: 503 },
    );
  }

  try {
    const image = await creerImage(session.userId, {
      id,
      ...lu.data,
      ...depot,
      mime: fichier.type,
      tailleOctets: fichier.size,
    });
    return Response.json({ image }, { status: 201 });
  } catch (e) {
    // La ligne n'existe pas : le fichier déposé n'a plus de propriétaire et
    // resterait orphelin dans le stockage. On le retire avant de rendre la main.
    console.error("[images] enregistrement en base impossible", e);
    await supprimer(depot);
    return Response.json(
      { erreur: "L'image n'a pas pu être enregistrée" },
      { status: 500 },
    );
  }
}
