import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AujourdHui from "@/components/ma-classe/AujourdHui";
import { classesDeProf } from "@/lib/serveur/classes";
import { creneauxDeProf } from "@/lib/serveur/creneaux";
import { prepasEntreDates } from "@/lib/serveur/prepas";
import { reglagesDeProf, urlOuvrable } from "@/lib/serveur/reglages";
import { sessionProf } from "@/lib/serveur/session-prof";
import { isoDe } from "@/lib/semaine";

export const metadata: Metadata = {
  title: "Ma classe — Rituelio",
  description: "Pilote ton année : cours du jour, à traiter, liens rapides.",
};

const CARTE = "rounded-carte border border-ligne bg-surface p-6";
const TITRE_ZONE = "font-titre text-lg font-bold text-encre";
const VIDE =
  "mt-4 rounded-moyen border border-dashed border-ligne p-6 text-center text-sm text-encre-douce";
const BOUTON_PRIMAIRE =
  "inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";
const BOUTON_FANTOME =
  "inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

// Un lien rapide : ouvre l'URL configurée dans un nouvel onglet, sinon mène aux
// réglages (le prof n'a pas encore renseigné/enregistré l'URL).
function LienRapide({ libelle, url }: { libelle: string; url: string }) {
  if (urlOuvrable(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={BOUTON_PRIMAIRE}
      >
        {libelle}
      </a>
    );
  }
  return (
    <Link href="/ma-classe/reglages" className={BOUTON_FANTOME}>
      {libelle} — à configurer
    </Link>
  );
}

export default async function TableauDeBordMaClasse() {
  const session = await sessionProf();
  if (!session) redirect("/connexion?next=/ma-classe");
  const aujourdISO = isoDe(new Date());
  const [reglages, creneaux, classes, prepasJour] = await Promise.all([
    reglagesDeProf(session.userId),
    creneauxDeProf(session.userId),
    classesDeProf(session.userId),
    prepasEntreDates(session.userId, aujourdISO, aujourdISO),
  ]);
  const classesLegeres = classes.map((c) => ({ id: c.id, nom: c.nom }));
  const prepasLegeres = prepasJour.map((p) => ({
    creneauId: p.creneauId,
    statut: p.statut,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Tableau de bord
        </h1>
        <p className="text-sm text-encre-douce">
          Ton pilotage de l&apos;année, en un coup d&apos;œil.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Aujourd'hui */}
        <section className={CARTE}>
          <h2 className={TITRE_ZONE}>Aujourd&apos;hui</h2>
          <AujourdHui
            creneaux={creneaux}
            classes={classesLegeres}
            urlVulkan={reglages.urlVulkan}
            prepas={prepasLegeres}
          />
        </section>

        {/* À traiter */}
        <section className={CARTE}>
          <h2 className={TITRE_ZONE}>À traiter</h2>
          <p className="mt-1 text-sm text-encre-douce">
            Les conséquences en attente ou en retard s&apos;afficheront ici.
          </p>
          <div className={VIDE}>Rien à traiter pour l&apos;instant.</div>
        </section>

        {/* Liens rapides */}
        <section className={`${CARTE} md:col-span-2`}>
          <h2 className={TITRE_ZONE}>Liens rapides</h2>
          <p className="mt-1 text-sm text-encre-douce">
            Accès direct à l&apos;appel (Vulkan) et à ClassDojo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LienRapide
              libelle="📋 Faire l'appel (Vulkan)"
              url={reglages.urlVulkan}
            />
            <LienRapide libelle="🏫 ClassDojo" url={reglages.urlClassdojo} />
          </div>
        </section>
      </div>
    </div>
  );
}
