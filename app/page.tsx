import GrilleJeux from "@/components/GrilleJeux";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tous les jeux
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choisis un rituel à lancer en classe.
        </p>
      </header>

      <GrilleJeux />
    </div>
  );
}
