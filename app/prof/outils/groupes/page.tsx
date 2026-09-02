import type { Metadata } from "next";
import GenerateurGroupes from "@/components/outils/GenerateurGroupes";

export const metadata: Metadata = {
  title: "Générateur de groupes — Outils — Rituelio",
  description: "Tirer au sort des binômes, trinômes ou groupes dans la classe.",
};

// La garde d'auth est assurée par le layout /prof/outils.
export default function PageGroupes() {
  return <GenerateurGroupes />;
}
