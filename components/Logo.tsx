// Logo de Rituelio : une bulle de dialogue arrondie contenant une étoile,
// suivie du mot « rituelio » dans la police de titre (Fredoka en jour, Gochi en nuit).
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0 text-principal"
        role="img"
        aria-hidden="true"
      >
        {/* Bulle de dialogue arrondie (avec une petite pointe en bas à gauche) */}
        <path
          d="M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-6 5v-5H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
          fill="currentColor"
        />
        {/* Étoile blanche au centre de la bulle */}
        <path
          d="M16 8.5l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L16 8.5Z"
          fill="white"
        />
      </svg>
      <span className="font-titre text-xl font-extrabold lowercase tracking-tight text-encre">
        rituelio
      </span>
    </span>
  );
}
