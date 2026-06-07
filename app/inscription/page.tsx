import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sessionProf } from "@/lib/serveur/session-prof";
import FormulaireInscription from "@/components/FormulaireInscription";

export const metadata: Metadata = {
  title: "Créer un compte — Rituelio",
  description: "Création d'un compte prof (sur invitation).",
};

export default async function PageInscription() {
  // Déjà connecté : inutile de s'inscrire.
  if (await sessionProf()) redirect("/prof");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <FormulaireInscription />
    </div>
  );
}
