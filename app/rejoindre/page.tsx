import type { Metadata } from "next";
import RejoindreEvaluation from "@/components/evaluation/RejoindreEvaluation";

export const metadata: Metadata = {
  title: "Rejoindre une évaluation — Rituelio",
  description: "Rejoindre une évaluation de conjugaison avec un code.",
};

export default function PageRejoindre() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <RejoindreEvaluation />
    </div>
  );
}
