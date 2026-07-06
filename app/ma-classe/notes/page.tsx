import type { Metadata } from "next";
import CarnetNotes from "@/components/ma-classe/CarnetNotes";

export const metadata: Metadata = {
  title: "Carnet de notes — Ma classe — Rituelio",
};

// La garde d'auth est assurée par app/ma-classe/layout.tsx.
export default function PageNotes() {
  return <CarnetNotes />;
}
