"use client";

// Bouton de bascule entre thème clair et sombre.
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function BoutonTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const [monte, setMonte] = useState(false);

  // Le thème résolu n'est connu qu'au montage côté client : on évite ainsi
  // tout décalage d'hydratation (on affiche une icône neutre en attendant).
  useEffect(() => setMonte(true), []);

  const sombre = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? "light" : "dark")}
      aria-label={sombre ? "Activer le thème clair" : "Activer le thème sombre"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
    >
      <span aria-hidden="true">{monte ? (sombre ? "☀️" : "🌙") : "🌗"}</span>
    </button>
  );
}
