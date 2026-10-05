import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inscriptionsOuvertes } from "@/lib/serveur/auth";
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
      {inscriptionsOuvertes() ? (
        <FormulaireInscription />
      ) : (
        <div className="rounded-carte border border-ligne bg-surface p-6">
          <h1 className="font-titre text-2xl font-bold text-encre">
            Inscriptions fermées
          </h1>
          <p className="mt-2 text-sm text-encre-douce">
            La création de compte n’est pas ouverte pour le moment.
          </p>
          <p className="mt-4 text-sm text-encre-douce">
            Déjà un compte ?{" "}
            <Link
              href="/connexion"
              className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              Se connecter
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
