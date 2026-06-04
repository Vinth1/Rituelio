import type { Metadata } from "next";
import GestionClasses from "@/components/classe/GestionClasses";

export const metadata: Metadata = {
  title: "Mes classes — Rituelio",
  description: "Gère tes classes et leurs élèves.",
};

export default function PageClasse() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <GestionClasses />
    </div>
  );
}
