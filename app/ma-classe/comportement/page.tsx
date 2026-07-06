import type { Metadata } from "next";
import Comportement from "@/components/ma-classe/Comportement";

export const metadata: Metadata = {
  title: "Comportement — Ma classe — Rituelio",
};

// La garde d'auth est assurée par app/ma-classe/layout.tsx.
export default function PageComportement() {
  return <Comportement />;
}
