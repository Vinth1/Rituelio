import type { Metadata } from "next";
import ChronoMinuteur from "@/components/outils/ChronoMinuteur";

export const metadata: Metadata = {
  title: "Chrono & minuteur — Outils — Rituelio",
  description: "Chronométrer une activité ou décompter un temps de travail.",
};

// La garde d'auth est assurée par le layout /prof/outils.
export default function PageMinuteur() {
  return <ChronoMinuteur />;
}
