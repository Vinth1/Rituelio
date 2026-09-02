"use client";

// Éditeur d'une dictée : titre, texte intégral et tags. Le texte saisi ici est
// la source de vérité de la correction collective — c'est lui qui sera découpé
// en mots pour valider l'épellation des élèves.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { decouperEnMots, type Dictee } from "@/lib/dictee";
import ChampTags, { useTagsConnus } from "@/components/ChampTags";

type Etat = "chargement" | "introuvable" | "pret";

export default function EditeurDictee({ dicteeId }: { dicteeId: string }) {
  const router = useRouter();
  const { tags: tagsConnus, recharger } = useTagsConnus();
  const [etat, setEtat] = useState<Etat>("chargement");
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch(`/api/dictees/${dicteeId}`);
        if (!actif) return;
        if (!r.ok) {
          setEtat("introuvable");
          return;
        }
        const { dictee } = (await r.json()) as { dictee: Dictee };
        setTitre(dictee.titre);
        setTexte(dictee.texte);
        setTags(dictee.tags);
        setEtat("pret");
      } catch {
        if (actif) setEtat("introuvable");
      }
    })();
    return () => {
      actif = false;
    };
  }, [dicteeId]);

  async function enregistrer() {
    setErreur(null);
    setEnregistre(false);
    setEnCours(true);
    try {
      const r = await fetch(`/api/dictees/${dicteeId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titre: titre.trim(), texte, tags }),
      });
      const data = (await r.json()) as { dictee?: Dictee; erreur?: string };
      if (!r.ok || !data.dictee) {
        setErreur(data.erreur ?? "Enregistrement impossible.");
        return;
      }
      // Les tags ont pu être normalisés par le serveur (« #Passé Composé » →
      // « passé-composé ») : on réaffiche ce qui a réellement été stocké.
      setTags(data.dictee.tags);
      setEnregistre(true);
      recharger();
    } catch {
      setErreur("Le serveur n'a pas répondu.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer la dictée « ${titre} » ?`)) return;
    const r = await fetch(`/api/dictees/${dicteeId}`, { method: "DELETE" });
    if (r.ok) router.push("/prof/dictees");
  }

  if (etat === "chargement") {
    return <p className="text-sm text-encre-douce">Chargement…</p>;
  }

  if (etat === "introuvable") {
    return (
      <div className="rounded-carte border border-dashed border-ligne p-6 text-center">
        <p className="text-sm text-encre-douce">Cette dictée n’existe plus.</p>
        <Link
          href="/prof/dictees"
          className="mt-3 inline-block rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Retour aux dictées
        </Link>
      </div>
    );
  }

  const mots = decouperEnMots(texte);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/prof/dictees"
        className="self-start rounded-moyen text-sm text-encre-douce transition hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
      >
        ← Retour aux dictées
      </Link>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="titre-dictee"
          className="font-titre text-sm font-semibold text-encre"
        >
          Titre
        </label>
        <input
          id="titre-dictee"
          type="text"
          value={titre}
          onChange={(e) => {
            setTitre(e.target.value);
            setEnregistre(false);
          }}
          placeholder="L’orage d’été"
          className="w-full rounded-full border border-ligne bg-surface px-4 py-2 text-base text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="texte-dictee"
          className="font-titre text-sm font-semibold text-encre"
        >
          Texte de la dictée
        </label>
        <textarea
          id="texte-dictee"
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            setEnregistre(false);
          }}
          rows={12}
          placeholder="Colle ici le texte que tu liras à voix haute."
          className="w-full rounded-carte border border-ligne bg-surface p-4 text-base leading-relaxed text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
        <p className="text-xs text-encre-douce">
          {mots.length} mot{mots.length > 1 ? "s" : ""} à corriger.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-titre text-sm font-semibold text-encre">Tags</span>
        <ChampTags
          tags={tags}
          onChange={(t) => {
            setTags(t);
            setEnregistre(false);
          }}
          tagsConnus={tagsConnus}
          label="Tags de la dictée"
        />
        <p className="text-xs text-encre-douce">
          Les notions travaillées : imparfait, adjectifs, compléments
          circonstanciels… Elles servent à retrouver la dictée.
        </p>
      </div>

      {erreur && (
        <p className="rounded-moyen bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || titre.trim() === ""}
          className="rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <span aria-live="polite" className="text-sm text-encre-douce">
          {enregistre ? "✓ Enregistré" : ""}
        </span>
        <button
          type="button"
          onClick={supprimer}
          className="ml-auto rounded-full px-4 py-2 text-sm text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
