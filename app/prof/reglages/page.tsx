import { redirect } from "next/navigation";

// Le changement de mot de passe a été déplacé dans la page profil.
// On conserve cette route en redirection pour les anciens liens / favoris.
export default function PageReglages() {
  redirect("/profil");
}
