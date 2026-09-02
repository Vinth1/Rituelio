// Banque d'images du prof : type de sortie et bornes du téléversement.
// Module PUR, partagé client/serveur — les composants le réutilisent sans tirer
// `lib/serveur/**` dans leur bundle, comme `lib/dictee.ts` pour les dictées.

// Une image telle que l'API la renvoie.
export type ImageProf = {
  id: string;
  titre: string;
  url: string; // URL publique (Vercel Blob) ou route locale de repli
  mime: string;
  tailleOctets: number;
  largeur: number;
  hauteur: number;
  tags: string[];
  deposeeLe: number;
};

// Formats acceptés. Le GIF est là pour ne pas refuser une image déjà prête,
// mais il n'est jamais réduit côté client : le redimensionnement par `<canvas>`
// aplatirait l'animation.
export const MIME_AUTORISES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// 4 Mo : au-delà, une fonction serverless refuse le corps de la requête. Le
// client réduit d'abord chaque image, une photo de téléphone passe donc
// largement dessous.
export const MAX_OCTETS = 4 * 1024 * 1024;

// Côté le plus long après réduction. 1600 px suffisent à un vidéoprojecteur et
// gardent la banque légère à l'affichage.
export const MAX_COTE = 1600;

export const MAX_TITRE = 120;

export function estMimeImage(mime: string): boolean {
  return (MIME_AUTORISES as readonly string[]).includes(mime);
}

// Extension de fichier associée à un type MIME accepté.
export function extensionDe(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "gif";
}

// « 1,2 Mo », « 340 ko » — pour l'affichage dans la banque.
export function tailleLisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
