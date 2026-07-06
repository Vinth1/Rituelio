import type { Metadata } from "next";
import ModuleBientot from "@/components/ma-classe/ModuleBientot";

export const metadata: Metadata = {
  title: "Emploi du temps — Ma classe — Rituelio",
};

export default function PageEmploiDuTemps() {
  return (
    <ModuleBientot
      titre="Emploi du temps"
      description="Ta semaine type : quels cours, quelles classes, quels créneaux."
    />
  );
}
