import type { Metadata } from "next";
import ModuleBientot from "@/components/ma-classe/ModuleBientot";

export const metadata: Metadata = {
  title: "Prépa — Ma classe — Rituelio",
};

export default function PagePrepa() {
  return (
    <ModuleBientot
      titre="Prépa hebdo"
      description="Prépare tes cours, semaine par semaine, cours par cours."
    />
  );
}
