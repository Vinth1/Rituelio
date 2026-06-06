// Fiche d'un jeu. Affiche « comment y jouer » (matériel, déroulé, variantes) ;
// pour un jeu jouable relié à un composant, lance directement ce composant.
// L'aide pédagogique (objectifs, conseils) n'est montrée QUE côté prof.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { jeux } from "@/data/jeux";
import { couleurBande } from "@/lib/couleurs";
import { libelleCategorie } from "@/lib/categories";
import Badge from "@/components/Badge";
import { JEUX_JOUABLES } from "@/components/jeux/registre";

export default async function PageJeu({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ espace?: string }>;
}) {
  const { id } = await params;
  const { espace } = await searchParams;
  const jeu = jeux.find((j) => j.id === id);
  if (!jeu) notFound();

  const estEleve = espace === "eleve";
  // Les jeux « prof uniquement » ne sont pas accessibles depuis l'espace élève.
  if (estEleve && jeu.profSeulement) redirect("/eleve");
  const retourHref = estEleve ? "/eleve" : "/prof";
  const retourLabel = estEleve ? "Retour aux jeux" : "Retour à l'espace prof";

  // Jeu jouable relié à un composant React via le champ `composant`.
  const JeuJouable =
    jeu.type === "jouable" && jeu.composant ? JEUX_JOUABLES[jeu.composant] : undefined;

  // Certains jeux jouables affichent leur propre en-tête : on masque alors la
  // bannière de cette page (icône, titre, résumé) pour gagner de la place.
  const masquerEntete = jeu.id === "conjugaison-entrainement";

  const aDuContenu =
    (jeu.materiel?.length ?? 0) > 0 ||
    (jeu.deroule?.length ?? 0) > 0 ||
    (jeu.variantes?.length ?? 0) > 0;
  const montrerAide = !estEleve && ((jeu.objectifs?.length ?? 0) > 0 || Boolean(jeu.aide));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href={retourHref}
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-400 dark:hover:text-slate-200"
      >
        <span aria-hidden="true">←</span> {retourLabel}
      </Link>

      {!masquerEntete && (
        <>
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
        </>
      )}

      {JeuJouable ? (
        /* Jeu jouable : on lance directement le composant */
        <section className="mt-6">
          <JeuJouable />
        </section>
      ) : (
        <>
          {/* Comment y jouer */}
          {jeu.materiel?.length ? (
            <section className="mt-6">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Matériel</h2>
              <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {jeu.materiel.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {jeu.deroule?.length ? (
            <section className="mt-6">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Déroulé</h2>
              <ol className="list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {jeu.deroule.map((etape, i) => (
                  <li key={i}>{etape}</li>
                ))}
              </ol>
            </section>
          ) : null}

          {jeu.variantes?.length ? (
            <section className="mt-6">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Variantes</h2>
              <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {jeu.variantes.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {!aDuContenu && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {jeu.type === "jouable"
                ? "Ce jeu se joue directement dans le navigateur — le mini-jeu interactif sera ajouté plus tard."
                : "Le déroulé détaillé de ce jeu sera ajouté bientôt."}
            </div>
          )}
        </>
      )}

      {/* Aide pédagogique : visible uniquement côté prof */}
      {montrerAide && (
        <section className="mt-6 rounded-2xl border border-principal-clair bg-principal-clair/40 p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="font-semibold text-principal-fonce dark:text-principal">
            Plus d'infos / Aide (prof)
          </h2>
          {jeu.objectifs?.length ? (
            <>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Objectifs</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {jeu.objectifs.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </>
          ) : null}
          {jeu.aide ? (
            <>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">Conseils</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{jeu.aide}</p>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
