"use client";

// Formulaire de connexion prof. Poste le mot de passe à /api/auth/connexion ;
// en cas de succès, le cookie de session est posé par le serveur et on navigue
// vers la destination demandée (par défaut /prof).
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FormulaireConnexion({ next }: { next: string }) {
  const router = useRouter();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifiant, motDePasse }),
      });
      if (r.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      setErreur(data?.erreur ?? "Connexion impossible.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <h1 className="font-titre text-2xl font-bold text-encre">Espace prof</h1>
      <p className="mt-1 text-sm text-encre-douce">
        Cet espace est réservé. Entre le mot de passe pour continuer.
      </p>
      <form onSubmit={soumettre} className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Nom d’utilisateur
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            autoComplete="username"
            autoFocus
            className="max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="current-password"
            className="max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
        </label>
        {erreur && (
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {erreur}
          </p>
        )}
        <button
          type="submit"
          disabled={envoi || !identifiant || !motDePasse}
          className="self-start rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-4 text-sm text-encre-douce">
        Pas encore de compte ?{" "}
        <Link
          href="/inscription"
          className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
