import type { Metadata } from "next";
import TableauEquipes from "@/components/outils/TableauEquipes";

export const metadata: Metadata = {
  title: "Tableau des équipes — Outils — Rituelio",
  description: "Compter les points de chaque équipe pendant l'activité.",
};

// La garde d'auth est assurée par le layout /prof/outils.
export default function PageScores() {
  return <TableauEquipes />;
}
