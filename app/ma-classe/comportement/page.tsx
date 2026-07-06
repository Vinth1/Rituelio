import type { Metadata } from "next";
import ModuleBientot from "@/components/ma-classe/ModuleBientot";

export const metadata: Metadata = {
  title: "Comportement — Ma classe — Rituelio",
};

export default function PageComportement() {
  return (
    <ModuleBientot
      titre="Comportement"
      description="Faits notables, conséquences datées et rappels."
    />
  );
}
