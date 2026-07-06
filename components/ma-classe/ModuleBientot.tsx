// Placeholder « bientôt disponible » réutilisé par les pages des modules « Ma
// classe » pas encore implémentés (emploi du temps, prépa, notes, comportement).
export default function ModuleBientot({
  titre,
  description,
}: {
  titre: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          {titre}
        </h1>
        <p className="text-sm text-encre-douce">{description}</p>
      </header>
      <div className="rounded-carte border border-dashed border-ligne p-10 text-center">
        <p className="font-titre text-lg font-bold text-encre">
          Bientôt disponible
        </p>
        <p className="mt-1 text-sm text-encre-douce">
          Ce module arrivera dans une prochaine mise à jour.
        </p>
      </div>
    </div>
  );
}
