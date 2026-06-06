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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Bienvenue sur Rituelio
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Qui utilise Rituelio aujourd'hui ?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {ESPACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-principal hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-principal-clair text-4xl"
              aria-hidden="true"
            >
              {e.emoji}
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{e.titre}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{e.desc}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/rejoindre"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-white hover:text-principal focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          <span aria-hidden="true">📝</span> Rejoindre une évaluation
        </Link>
      </div>
    </div>
  );
}
