import type { Metadata } from "next";
import EmploiDuTemps from "@/components/ma-classe/EmploiDuTemps";

export const metadata: Metadata = {
  title: "Emploi du temps — Ma classe — Rituelio",
};

// La garde d'auth est assurée par app/ma-classe/layout.tsx.
export default function PageEmploiDuTemps() {
  return <EmploiDuTemps />;
}
