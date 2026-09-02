import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images de la banque du prof, déposées sur Vercel Blob. Elles sont rendues
    // avec `unoptimized`, mais Next veut connaître l'hôte distant.
    // (Next 16 : `images.domains` est déprécié, on déclare des remotePatterns.)
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
