// Barre de titre affichée en haut de toutes les pages :
// logo carré coloré + nom « Rituelio » + bouton de thème.
import BoutonTheme from "./BoutonTheme";

export default function EnTete() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg shadow-sm"
            aria-hidden="true"
          >
            🎲
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rituelio
          </span>
        </div>
        <BoutonTheme />
      </div>
    </header>
  );
}
