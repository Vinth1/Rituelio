import type { Metadata } from "next";
import ModuleBientot from "@/components/ma-classe/ModuleBientot";

export const metadata: Metadata = {
  title: "Notes — Ma classe — Rituelio",
};

export default function PageNotes() {
  return (
    <ModuleBientot
      titre="Carnet de notes"
      description="Notes par matière, classe et trimestre, avec calcul des moyennes."
    />
  );
}
