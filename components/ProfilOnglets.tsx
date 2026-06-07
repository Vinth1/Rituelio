"use client";

// Contenu de la page profil, en deux onglets : « Mon profil » (changer le nom
// d'utilisateur, email en lecture seule) et « Mot de passe » (formulaire existant).
import { useState } from "react";
import { useRouter } from "next/navigation";
import FormulaireMotDePasse from "./FormulaireMotDePasse";

type Onglet = "profil" | "motdepasse";

export default function ProfilOnglets({
  pseudo,
  email,
}: {
  pseudo: string;
  email: string | null;
}) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("profil");
  const [pseudoActuel, setPseudoActuel] = useState(pseudo);
  const [pseudoSaisi, setPseudoSaisi] = useState(pseudo);
  const [message, setMessage] = useState<
    { type: "ok" | "err"; texte: string } | null
  >(null);
  const [envoi, setEnvoi] = useState(false);

  async function changerPseudo(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    const nouveau = pseudoSaisi.trim();
    if (nouveau === pseudoActuel) return;
    setEnvoi(true);
    setMessage(null);
    try {
      const r = await fetch("/api/auth/identifiant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifiant: nouveau }),
      });
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      if (r.ok) {
        setPseudoActuel(nouveau);
        setPseudoSaisi(nouveau);
        setMessage({ type: "ok", texte: "Nom d’utilisateur modifié." });
        router.refresh(); // met à jour le pseudo affiché dans l'en-tête
      } else {
        setMessage({ type: "err", texte: data?.erreur ?? "Modification impossible." });
      }
    } catch {
      setMessage({ type: "err", texte: "Impossible de contacter le serveur." });
    } finally {
      setEnvoi(false);
    }
  }

  const pastille = (actif: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
      actif
        ? "bg-principal text-sur-principal shadow-sm"
        : "text-encre-douce hover:text-encre"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Sections du profil"
        className="inline-flex items-center gap-1 self-start rounded-full border border-ligne bg-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={onglet === "profil"}
          onClick={() => setOnglet("profil")}
          className={pastille(onglet === "profil")}
        >
          Mon profil
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={onglet === "motdepasse"}
          onClick={() => setOnglet("motdepasse")}
          className={pastille(onglet === "motdepasse")}
        >
          Mot de passe
        </button>
      </div>

      {onglet === "profil" ? (
        <div className="rounded-carte border border-ligne bg-surface p-6">
          <h1 className="font-titre text-2xl font-bold text-encre">Mon profil</h1>
          <form onSubmit={changerPseudo} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-encre-douce">
              Nom d’utilisateur (3 caractères minimum)
              <input
                type="text"
                value={pseudoSaisi}
                onChange={(e) => setPseudoSaisi(e.target.value)}
                autoComplete="username"
                className="max-w-xs rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
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
              disabled={
                envoi ||
                !pseudoSaisi.trim() ||
                pseudoSaisi.trim() === pseudoActuel
              }
              className="self-start rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-0.5 border-t border-ligne pt-4">
            <span className="text-sm font-medium text-encre-douce">Email</span>
            <span className="text-lg font-semibold text-encre">{email ?? "—"}</span>
          </div>
        </div>
      ) : (
        <FormulaireMotDePasse />
      )}
    </div>
  );
}
