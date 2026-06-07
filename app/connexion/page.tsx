import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessionProf } from "@/lib/serveur/session-prof";
import FormulaireConnexion from "@/components/FormulaireConnexion";

export const metadata: Metadata = {
  title: "Connexion prof — Rituelio",
  description: "Accès réservé à l'espace prof.",
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Déjà connecté : on file directement à l'espace prof.
  if (await sessionProf()) redirect("/prof");

  // Destination après connexion : uniquement un chemin interne (anti open-redirect).
  const { next } = await searchParams;
  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/prof";

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <FormulaireConnexion next={destination} />
    </div>
  );
}
