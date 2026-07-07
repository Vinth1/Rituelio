"use client";

// Liste des épreuves du prof. Source de vérité = backend (/api/epreuves).
// « Nouvelle épreuve » crée un modèle vierge puis ouvre l'éditeur.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ResumeEpreuve } from "@/lib/epreuves/modele";

function formaterDate(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ListeEpreuves() {
  const router = useRouter();
  const [epreuves, setEpreuves] = useState<ResumeEpreuve[]>([]);
  const [charge, setCharge] = useState(false);
  const [creation, setCreation] = useState(false);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch("/api/epreuves");
        if (r.ok && actif) {
          const data = (await r.json()) as { epreuves: ResumeEpreuve[] };
          setEpreuves(data.epreuves);
        }
      } catch {
        /* réseau : liste vide, l'utilisateur peut réessayer */
      } finally {
        if (actif) setCharge(true);
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  async function creer() {
    setCreation(true);
    try {
      const r = await fetch("/api/epreuves", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titre: "Nouvelle épreuve" }),
      });
      if (r.ok) {
        const { id } = (await r.json()) as { id: string };
        router.push(`/prof/epreuves/${id}`);
        return;
      }
    } catch {
      /* on réactive le bouton ci-dessous */
    }
    setCreation(false);
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cette épreuve et toutes ses questions ?")) return;
    const r = await fetch(`/api/epreuves/${id}`, { method: "DELETE" });
    if (r.ok) setEpreuves((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
            Évaluations
          </h1>
          <p className="text-sm text-encre-douce">
            Compose des évaluations que tes élèves passeront depuis leur appareil.
          </p>
        </div>
        <button
          type="button"
          onClick={creer}
          disabled={creation}
          className="shrink-0 rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-60"
        >
          {creation ? "Création…" : "+ Nouvelle épreuve"}
        </button>
      </header>

      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : epreuves.length === 0 ? (
        <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
          Aucune épreuve pour l’instant. Crée ta première évaluation.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {epreuves.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-carte bg-surface px-4 py-3 ring-1 ring-ligne"
            >
              <Link
                href={`/prof/epreuves/${e.id}`}
                className="min-w-0 flex-1 rounded-moyen focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                <span className="block truncate font-medium text-encre">
                  {e.titre}
                </span>
                <span className="block text-xs text-encre-douce">
                  {e.nbQuestions} question{e.nbQuestions > 1 ? "s" : ""} · modifiée
                  le {formaterDate(e.majLe)}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => supprimer(e.id)}
                aria-label={`Supprimer l'épreuve ${e.titre}`}
                className="shrink-0 rounded-full px-3 py-1.5 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
