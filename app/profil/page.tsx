import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { profConnecte } from "@/lib/serveur/session-prof";
import ProfilOnglets from "@/components/ProfilOnglets";

export const metadata: Metadata = {
  title: "Mon profil — Rituelio",
  description: "Profil du compte prof.",
};

export default async function PageProfil() {
  const prof = await profConnecte();
  if (!prof) redirect("/connexion?next=/profil");
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link
        href="/prof"
        className="inline-flex items-center gap-1 text-sm text-encre-douce transition hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
      >
        <span aria-hidden="true">←</span> Espace prof
      </Link>
      <div className="mt-4">
        <ProfilOnglets pseudo={prof.identifiant} email={prof.email} />
      </div>
    </div>
  );
}
