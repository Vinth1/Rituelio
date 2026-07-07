import type { Metadata } from "next";
import ListeEpreuves from "@/components/epreuves/ListeEpreuves";

export const metadata: Metadata = {
  title: "Évaluations — Rituelio",
  description: "Compose et gère tes évaluations.",
};

// La garde d'auth est assurée par le layout /prof/epreuves.
export default function PageEpreuves() {
  return <ListeEpreuves />;
}
