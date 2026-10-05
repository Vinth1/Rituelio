import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inscriptionsOuvertes, verifierCleInscription } from "@/lib/serveur/auth";
import { sessionProf } from "@/lib/serveur/session-prof";
import FormulaireInscription from "@/components/FormulaireInscription";

export const metadata: Metadata = {
  title: "Créer un compte — Rituelio",
  description: "Création d'un compte prof (sur invitation).",
};

export default async function PageInscription({
  searchParams,
}: {
  searchParams: Promise<{ cle?: string | string[] }>;
}) {
  // Déjà connecté : inutile de s'inscrire.
  if (await sessionProf()) redirect("/prof");

  // Le code d'inscription ne se saisit plus : il voyage dans le lien d'invitation
  // (/inscription?cle=…) que le prof référent transmet. Le serveur le vérifie ici
  // avant d'afficher le formulaire, et l'API le revérifie à la création du compte :
  // la garde reste entièrement côté serveur.
  const { cle } = await searchParams;
  const codeDuLien = typeof cle === "string" ? cle : "";
  const ouvertes = inscriptionsOuvertes();
  const lienValide = ouvertes && verifierCleInscription(codeDuLien);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {lienValide ? (
        <FormulaireInscription cleInscription={codeDuLien} />
      ) : (
        <div className="rounded-carte border border-ligne bg-surface p-6">
          <h1 className="font-titre text-2xl font-bold text-encre">
            {ouvertes ? "Lien d’inscription invalide" : "Inscriptions fermées"}
          </h1>
          <p className="mt-2 text-sm text-encre-douce">
            {ouvertes
              ? "Ce lien ne porte pas de code d’inscription valide. Demande son lien au prof qui gère le site."
              : "La création de compte n’est pas ouverte pour le moment."}
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
