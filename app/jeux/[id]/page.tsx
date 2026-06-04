// Page de détail d'un jeu (version minimale / stub).
// Le contenu complet des fiches et les jeux jouables seront ajoutés plus tard.
import Link from "next/link";
import { notFound } from "next/navigation";
import { jeux } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";
import { libelleCategorie } from "@/lib/categories";
import Badge from "@/components/Badge";

// Génère une page statique par jeu existant.
export function generateStaticParams() {
  return jeux.map((jeu) => ({ id: jeu.id }));
}

export default async function PageJeu({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jeu = jeux.find((j) => j.id === id);
  if (!jeu) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span aria-hidden="true">←</span> Tous les jeux
      </Link>

      <div
        className={`mt-4 flex h-28 items-center justify-center rounded-3xl text-5xl ${couleurBande(jeu.couleur)}`}
        aria-hidden="true"
      >
        {jeu.icone}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {jeu.titre}
          </h1>
          <Badge type={jeu.type} />
        </div>
        <p className="text-slate-600 dark:text-slate-300">{jeu.resume}</p>
        <p className="text-sm text-slate-400">
          Rituel : {libelleCategorie(jeu.categorie)}
          {jeu.duree ? ` · ${jeu.duree}` : ""}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="font-medium text-slate-600 dark:text-slate-300">
          Contenu et onglet Aide à venir
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {jeu.type === "jouable"
            ? "Le mini-jeu interactif et l'onglet « Plus d'infos / Aide » seront ajoutés ici."
            : "Le déroulé complet et l'onglet « Plus d'infos / Aide » seront ajoutés ici."}
        </p>
      </div>
    </div>
  );
}
