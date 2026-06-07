"use client";

// Formulaire de changement de mot de passe prof (page /prof/reglages).
// Poste { actuel, nouveau } à /api/auth/mot-de-passe (route protégée).
import { useState } from "react";

export default function FormulaireMotDePasse() {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [message, setMessage] = useState<
    { type: "ok" | "err"; texte: string } | null
  >(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (nouveau !== confirme) {
      setMessage({ type: "err", texte: "La confirmation ne correspond pas." });
      return;
    }
    setEnvoi(true);
    setMessage(null);
    try {
      const r = await fetch("/api/auth/mot-de-passe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actuel, nouveau }),
      });
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      if (r.ok) {
        setMessage({ type: "ok", texte: "Mot de passe modifié." });
        setActuel("");
        setNouveau("");
        setConfirme("");
      } else {
        setMessage({ type: "err", texte: data?.erreur ?? "Échec de la modification." });
      }
    } catch {
      setMessage({ type: "err", texte: "Impossible de contacter le serveur." });
    } finally {
      setEnvoi(false);
    }
  }

  const champ =
    "max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <h1 className="font-titre text-2xl font-bold text-encre">Changer le mot de passe</h1>
      <p className="mt-1 text-sm text-encre-douce">
        Le nouveau mot de passe est haché et enregistré en base immédiatement.
      </p>
      <form onSubmit={soumettre} className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Mot de passe actuel
          <input
            type="password"
            value={actuel}
            onChange={(e) => setActuel(e.target.value)}
            autoComplete="current-password"
            className={champ}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Nouveau mot de passe (6 caractères minimum)
          <input
            type="password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            autoComplete="new-password"
            className={champ}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
          Confirmer le nouveau mot de passe
          <input
            type="password"
            value={confirme}
            onChange={(e) => setConfirme(e.target.value)}
            autoComplete="new-password"
            className={champ}
          />
        </label>
        {message && (
          <p
            className={`text-sm font-medium ${
              message.type === "ok"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {message.texte}
          </p>
        )}
        <button
          type="submit"
          disabled={envoi || !actuel || !nouveau}
          className="self-start rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {envoi ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
