import Link from "next/link";

// Écran d'accueil : choix de l'espace (prof / élève).
// En v1, c'est un simple choix d'interface (pas une vraie connexion).
const ESPACES = [
  {
    href: "/prof",
    emoji: "🧑‍🏫",
    titre: "Espace prof",
    desc: "Le catalogue complet pour préparer et projeter les rituels.",
  },
  {
    href: "/eleve",
    emoji: "🎒",
    titre: "Espace élève",
    desc: "Choisis un jeu et découvre comment y jouer.",
  },
];

export default function Accueil() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-titre text-3xl font-extrabold tracking-tight text-encre sm:text-4xl">
          Bienvenue sur Rituelio
        </h1>
        <p className="mt-2 text-encre-douce">
          Qui utilise Rituelio aujourd’hui ?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ESPACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="group flex flex-col items-center gap-3 rounded-carte border-2 border-ligne bg-surface p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-principal hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-carte bg-principal-clair text-4xl"
              aria-hidden="true"
            >
              {e.emoji}
            </span>
            <span className="font-titre text-xl font-bold text-encre">{e.titre}</span>
            <span className="text-sm text-encre-douce">{e.desc}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/rejoindre"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-encre-douce ring-1 ring-ligne transition hover:bg-surface hover:text-principal focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          <span aria-hidden="true">📝</span> Rejoindre une évaluation
        </Link>
      </div>
    </div>
  );
}
