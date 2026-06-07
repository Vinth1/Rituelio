"use client";

// Formulaire de création de compte prof : email + nom d'utilisateur + mot de passe
// + code d'inscription (secret). En cas de succès, le serveur ouvre la session et
// on file vers l'espace prof.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FormulaireInscription() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [cleInscription, setCleInscription] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, identifiant, motDePasse, cleInscription }),
      });
      if (r.ok) {
        router.replace("/prof");
        router.refresh();
        return;
      }
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      setErreur(data?.erreur ?? "Création impossible.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  const champ =
    "max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <h1 className="font-titre text-2xl font-bold text-encre">Créer un compte prof</h1>
      <p className="mt-1 text-sm text-encre-douce">
        L’inscription nécessite le code fourni par l’administrateur.
      </p>
      <form onSubmit={soumettre} className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={champ}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Nom d’utilisateur (3 caractères minimum)
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            autoComplete="username"
            className={champ}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Mot de passe (6 caractères minimum)
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            autoComplete="new-password"
            className={champ}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Code d’inscription
          <input
            type="password"
            value={cleInscription}
            onChange={(e) => setCleInscription(e.target.value)}
            className={champ}
          />
        </label>
        {erreur && (
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {erreur}
          </p>
        )}
        <button
          type="submit"
          disabled={envoi || !email || !identifiant || !motDePasse || !cleInscription}
          className="self-start rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {envoi ? "Création…" : "Créer le compte"}
        </button>
      </form>
      <p className="mt-4 text-sm text-encre-douce">
        Déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
