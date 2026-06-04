// Carte « + Nouveau jeu » placée en fin de grille.
// Pour l'instant elle est inerte : l'ajout de jeux se fait en éditant
// data/jeux.ts. Un véritable flux d'ajout pourra être branché plus tard.

export default function CarteNouveauJeu() {
  return (
    <button
      type="button"
      title="Ajout d'un jeu — à venir"
      className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-slate-400 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-500"
    >
      <span className="text-3xl leading-none" aria-hidden="true">
        ＋
      </span>
      <span className="text-sm font-medium">Nouveau jeu</span>
    </button>
  );
}
