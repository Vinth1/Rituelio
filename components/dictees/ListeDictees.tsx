"use client";

// Banque de dictées du prof. Source de vérité = backend (/api/dictees).
// La recherche se fait côté serveur : les tags sélectionnés sont cumulatifs
// (une dictée doit les porter TOUS), et le champ texte filtre les titres.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { decouperEnMots, type Dictee } from "@/lib/dictee";
import ChampTags, { useTagsConnus } from "./ChampTags";

function formaterDate(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ListeDictees() {
  const router = useRouter();
  const { tags: tagsConnus } = useTagsConnus();
  const [dictees, setDictees] = useState<Dictee[]>([]);
  const [charge, setCharge] = useState(false);
  const [creation, setCreation] = useState(false);
  const [filtreTags, setFiltreTags] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");

  // La frappe dans le champ de recherche est amortie : on n'interroge le
  // serveur qu'une fois la saisie stabilisée.
  useEffect(() => {
    let actif = true;
    const minuteur = setTimeout(async () => {
      const params = new URLSearchParams();
      if (filtreTags.length > 0) params.set("tags", filtreTags.join(","));
      if (recherche.trim()) params.set("q", recherche.trim());
      try {
        const r = await fetch(`/api/dictees?${params}`);
        if (r.ok && actif) {
          const data = (await r.json()) as { dictees: Dictee[] };
          setDictees(data.dictees);
        }
      } catch {
        /* réseau : on garde la liste précédente */
      } finally {
        if (actif) setCharge(true);
      }
    }, 250);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [filtreTags, recherche]);

  async function creer() {
    setCreation(true);
    try {
      const r = await fetch("/api/dictees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titre: "Nouvelle dictée",
          texte: "",
          tags: filtreTags,
        }),
      });
      if (r.ok) {
        const { dictee } = (await r.json()) as { dictee: Dictee };
        router.push(`/prof/dictees/${dictee.id}`);
        return;
      }
    } catch {
      /* on réactive le bouton ci-dessous */
    }
    setCreation(false);
  }

  async function supprimer(d: Dictee) {
    if (!window.confirm(`Supprimer la dictée « ${d.titre} » ?`)) return;
    const r = await fetch(`/api/dictees/${d.id}`, { method: "DELETE" });
    if (r.ok) setDictees((prev) => prev.filter((x) => x.id !== d.id));
  }

  const filtre = filtreTags.length > 0 || recherche.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
            Dictées
          </h1>
          <p className="text-sm text-encre-douce">
            Dépose tes textes, étiquette-les, retrouve-les par hashtag.
          </p>
        </div>
        <button
          type="button"
          onClick={creer}
          disabled={creation}
          className="shrink-0 rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-60"
        >
          {creation ? "Création…" : "+ Nouvelle dictée"}
        </button>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="sr-only">Recherche</h2>
        <ChampTags
          tags={filtreTags}
          onChange={setFiltreTags}
          tagsConnus={tagsConnus}
          label="Filtrer par tag"
          placeholder="Filtrer par tag…"
        />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label="Rechercher dans les titres"
          placeholder="Rechercher un titre…"
          className="w-full rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
      </section>

      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : dictees.length === 0 ? (
        <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
          {filtre
            ? "Aucune dictée ne correspond à cette recherche."
            : "Aucune dictée pour l’instant. Dépose ton premier texte."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dictees.map((d) => {
            const nbMots = decouperEnMots(d.texte).length;
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-carte bg-surface px-4 py-3 ring-1 ring-ligne"
              >
                <Link
                  href={`/prof/dictees/${d.id}`}
                  className="min-w-0 flex-1 rounded-moyen focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  <span className="block truncate font-medium text-encre">
                    {d.titre}
                  </span>
                  <span className="block text-xs text-encre-douce">
                    {nbMots} mot{nbMots > 1 ? "s" : ""} · modifiée le{" "}
                    {formaterDate(d.modifieeLe)}
                  </span>
                  {d.tags.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {d.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-fond px-2 py-0.5 text-xs font-semibold text-principal"
                        >
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => supprimer(d)}
                  aria-label={`Supprimer la dictée ${d.titre}`}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
