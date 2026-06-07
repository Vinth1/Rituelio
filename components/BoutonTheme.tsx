"use client";

// Bouton de bascule entre thème clair et sombre.
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function BoutonTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const [monte, setMonte] = useState(false);

  // Le thème résolu n'est connu qu'au montage côté client : on évite ainsi
  // tout décalage d'hydratation (on affiche une icône neutre en attendant).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- bascule au montage volontaire (anti-hydratation)
  useEffect(() => setMonte(true), []);

  const sombre = resolvedTheme === "dark";

  // Libellé qui annonce le mode vers lequel on bascule (jour « Bonbon » / nuit « Tableau »).
  // Tant que le thème résolu est inconnu (avant montage côté client), on garde un libellé
  // neutre : sinon serveur et client divergent → décalage d'hydratation.
  const etiquette = !monte
    ? "Changer de thème"
    : sombre
      ? "Passer en mode Bonbon (jour)"
      : "Passer en mode Tableau (nuit)";

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? "light" : "dark")}
      aria-label={etiquette}
      title={etiquette}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ligne bg-surface text-lg transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
    >
      <span aria-hidden="true">{monte ? (sombre ? "☀️" : "🌙") : "🌗"}</span>
    </button>
  );
}
