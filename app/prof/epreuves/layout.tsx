import { redirect } from "next/navigation";
import BasculeEspace from "@/components/BasculeEspace";
import NavEspaceProf from "@/components/NavEspaceProf";
import { sessionProf } from "@/lib/serveur/session-prof";

// Layout de l'espace « Évaluations » (prof). Garde d'auth une seule fois pour
// /prof/epreuves/* : non connecté → connexion. Fournit l'entête commune.
export default async function LayoutEpreuves({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await sessionProf())) redirect("/connexion?next=/prof/epreuves");
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <BasculeEspace />
      <NavEspaceProf />
      {children}
    </div>
  );
}
