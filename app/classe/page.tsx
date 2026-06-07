import type { Metadata } from "next";
import { redirect } from "next/navigation";
import GestionClasses from "@/components/classe/GestionClasses";
import { sessionProf } from "@/lib/serveur/session-prof";

export const metadata: Metadata = {
  title: "Mes classes — Rituelio",
  description: "Gère tes classes et leurs élèves.",
};

export default async function PageClasse() {
  if (!(await sessionProf())) redirect("/connexion?next=/classe");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <GestionClasses />
    </div>
  );
}
