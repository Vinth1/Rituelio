import type { Metadata } from "next";
import RoueDesPrenoms from "@/components/outils/RoueDesPrenoms";

export const metadata: Metadata = {
  title: "Roue des prénoms — Outils — Rituelio",
  description: "Désigner un élève au hasard dans une classe.",
};

// La garde d'auth est assurée par le layout /prof/outils.
export default function PageRoue() {
  return <RoueDesPrenoms />;
}
