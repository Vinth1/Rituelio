"use client";

// Bouton « Se déconnecter » (en-tête). Invalide la session côté serveur puis
// renvoie à l'accueil. Rendu uniquement quand le prof est connecté (cf. EnTete).
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoutonDeconnexion() {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);

  async function deconnecter() {
    if (envoi) return;
    setEnvoi(true);
    try {
      await fetch("/api/auth/deconnexion", { method: "POST" });
      router.replace("/");
      router.refresh();
    } catch {
      setEnvoi(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deconnecter}
      disabled={envoi}
      className="rounded-full border border-ligne bg-surface px-3 py-1.5 text-sm font-medium text-encre-douce transition hover:bg-fond hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-50"
    >
      {envoi ? "…" : "Se déconnecter"}
    </button>
  );
}
