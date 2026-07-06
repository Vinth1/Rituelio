import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormReglages from "@/components/ma-classe/FormReglages";
import {
  CLASSDOJO_DEFAUT,
  VULKAN_DEFAUT,
  reglagesDeProf,
} from "@/lib/serveur/reglages";
import { sessionProf } from "@/lib/serveur/session-prof";

export const metadata: Metadata = {
  title: "Réglages — Ma classe — Rituelio",
  description: "Liens Vulkan / ClassDojo et dates des trimestres.",
};

export default async function ReglagesMaClasse() {
  const session = await sessionProf();
  if (!session) redirect("/connexion?next=/ma-classe/reglages");
  const reglages = await reglagesDeProf(session.userId);
  // Pré-remplit les URLs avec les valeurs par défaut si le prof n'a rien encore
  // enregistré : un simple « Enregistrer » active alors les liens rapides.
  return (
    <FormReglages
      urlVulkanInitial={reglages.urlVulkan || VULKAN_DEFAUT}
      urlClassdojoInitial={reglages.urlClassdojo || CLASSDOJO_DEFAUT}
      trimestresInitial={reglages.trimestres}
    />
  );
}
