import { redirect } from "next/navigation";
import BasculeEspace from "@/components/BasculeEspace";
import NavEspaceProf from "@/components/NavEspaceProf";
import NavMaClasse from "@/components/ma-classe/NavMaClasse";
import { sessionProf } from "@/lib/serveur/session-prof";

// Layout de la catégorie « Ma classe ». Garde d'auth une seule fois pour toutes
// les pages /ma-classe/* : non connecté → connexion. Fournit la navigation
// commune (retour accueil + bascule Activités/Ma classe + sous-nav modules).
export default async function LayoutMaClasse({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await sessionProf())) redirect("/connexion?next=/ma-classe");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BasculeEspace />
      <NavEspaceProf />
      <NavMaClasse />
      {children}
    </div>
  );
}
