// Où atterrit le FICHIER d'une image de la banque. Module SERVEUR uniquement.
//
// Deux implémentations derrière une seule interface :
//   - `BLOB_READ_WRITE_TOKEN` défini → Vercel Blob. C'est la cible : c'est le
//     seul stockage qui persiste sur Vercel, le système de fichiers d'une
//     fonction serverless étant éphémère.
//   - sinon → écriture dans `.data/images/` (déjà gitignoré), servie par
//     `/api/images/[id]/fichier`. REPLI DE DÉVELOPPEMENT, pour que la banque
//     soit utilisable en local sans compte Vercel.
//
// À savoir : une URL Vercel Blob « public » est imprévisible mais PUBLIQUE. Elle
// convient à des photos de paysage ou d'objets, pas à un visage d'élève — d'où
// le rappel affiché dans le jeu. L'API de gestion, elle, reste fermée au prof
// authentifié.
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { extensionDe } from "@/lib/images";

const DOSSIER_LOCAL = path.join(process.cwd(), ".data", "images");

// Une clé locale est toujours « <uuid>.<ext> » : on la revalide avant de
// toucher au disque, un id venu de la base ne doit pas pouvoir remonter l'arbre.
const CLE_LOCALE = /^[A-Za-z0-9-]+\.[a-z0-9]+$/;

export type Depot = { url: string; cle: string };

export function surVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function deposer(
  id: string,
  donnees: ArrayBuffer,
  mime: string,
): Promise<Depot> {
  const cle = `${id}.${extensionDe(mime)}`;

  if (surVercelBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`images-prof/${cle}`, donnees, {
      access: "public",
      contentType: mime,
      addRandomSuffix: true,
    });
    return { url: blob.url, cle: blob.pathname };
  }

  await mkdir(DOSSIER_LOCAL, { recursive: true });
  await writeFile(path.join(DOSSIER_LOCAL, cle), Buffer.from(donnees));
  return { url: `/api/images/${id}/fichier`, cle };
}

// Supprime le fichier. Ne lève pas : une image déjà disparue du stockage doit
// quand même pouvoir sortir de la base.
export async function supprimer(image: {
  url: string;
  cle: string;
}): Promise<void> {
  try {
    if (image.url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await del(image.url);
      return;
    }
    if (!CLE_LOCALE.test(image.cle)) return;
    await unlink(path.join(DOSSIER_LOCAL, image.cle));
  } catch {
    /* fichier déjà absent : la ligne part quand même */
  }
}

// Lit un fichier du repli local (sert `/api/images/[id]/fichier`).
export async function lireFichierLocal(cle: string): Promise<Buffer | null> {
  if (!CLE_LOCALE.test(cle)) return null;
  try {
    return await readFile(path.join(DOSSIER_LOCAL, cle));
  } catch {
    return null;
  }
}
