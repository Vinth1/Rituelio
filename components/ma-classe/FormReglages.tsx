"use client";

// Formulaire des réglages « Ma classe » : URLs Vulkan / ClassDojo + dates des 3
// trimestres. Poste { urlVulkan, urlClassdojo, trimestres } à
// /api/ma-classe/reglages (route protégée). Mirroir du patron FormulaireMotDePasse.
import { useState } from "react";

type Trimestre = { numero: number; dateDebut: string; dateFin: string };

export default function FormReglages({
  urlVulkanInitial,
  urlClassdojoInitial,
  trimestresInitial,
}: {
  urlVulkanInitial: string;
  urlClassdojoInitial: string;
  trimestresInitial: Trimestre[];
}) {
  const [urlVulkan, setUrlVulkan] = useState(urlVulkanInitial);
  const [urlClassdojo, setUrlClassdojo] = useState(urlClassdojoInitial);
  const [trimestres, setTrimestres] = useState<Trimestre[]>(trimestresInitial);
  const [message, setMessage] = useState<
    { type: "ok" | "err"; texte: string } | null
  >(null);
  const [envoi, setEnvoi] = useState(false);

  function majTrimestre(
    numero: number,
    champ: "dateDebut" | "dateFin",
    valeur: string,
  ) {
    setTrimestres((prev) =>
      prev.map((t) => (t.numero === numero ? { ...t, [champ]: valeur } : t)),
    );
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    setMessage(null);
    try {
      const r = await fetch("/api/ma-classe/reglages", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urlVulkan, urlClassdojo, trimestres }),
      });
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      if (r.ok) {
        setMessage({ type: "ok", texte: "Réglages enregistrés." });
      } else {
        setMessage({
          type: "err",
          texte: data?.erreur ?? "Échec de l'enregistrement.",
        });
      }
    } catch {
      setMessage({ type: "err", texte: "Impossible de contacter le serveur." });
    } finally {
      setEnvoi(false);
    }
  }

  const champ =
    "w-full rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
  const champDate =
    "rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
  const label = "flex flex-col gap-1 text-sm font-medium text-encre-douce";

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <h1 className="font-titre text-2xl font-bold text-encre">
        Réglages de « Ma classe »
      </h1>
      <p className="mt-1 text-sm text-encre-douce">
        Liens externes et dates des trimestres (année 2026-2027).
      </p>

      <form onSubmit={soumettre} className="mt-5 flex flex-col gap-5">
        <label className={label}>
          Lien « Faire l&apos;appel » (Vulkan)
          <input
            type="url"
            inputMode="url"
            value={urlVulkan}
            onChange={(e) => setUrlVulkan(e.target.value)}
            placeholder="https://uonetplus.vulcan.net.pl/"
            className={champ}
          />
        </label>
        <label className={label}>
          Lien ClassDojo
          <input
            type="url"
            inputMode="url"
            value={urlClassdojo}
            onChange={(e) => setUrlClassdojo(e.target.value)}
            placeholder="https://home.classdojo.com/"
            className={champ}
          />
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-encre-douce">
            Dates des trimestres
          </legend>
          {trimestres.map((t) => (
            <div
              key={t.numero}
              className="flex flex-wrap items-end gap-3 rounded-moyen border border-ligne p-3"
            >
              <span className="font-titre text-sm font-bold text-encre">
                Trimestre {t.numero}
              </span>
              <label className="flex flex-col gap-1 text-xs font-medium text-encre-douce">
                Début
                <input
                  type="date"
                  value={t.dateDebut}
                  onChange={(e) =>
                    majTrimestre(t.numero, "dateDebut", e.target.value)
                  }
                  className={champDate}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-encre-douce">
                Fin
                <input
                  type="date"
                  value={t.dateFin}
                  onChange={(e) =>
                    majTrimestre(t.numero, "dateFin", e.target.value)
                  }
                  className={champDate}
                />
              </label>
            </div>
          ))}
        </fieldset>

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
          disabled={envoi}
          className="self-start rounded-full bg-principal px-6 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {envoi ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
