"use client";

// Page de gestion des classes. Source de vérité = le backend (/api/classes) :
// on charge depuis le serveur au montage et on ré-enregistre (PUT) à chaque
// changement, avec un léger différé. On garde un MIROIR dans le localStorage
// (enregistrerClasses) pour que les jeux pas encore migrés continuent de lire
// les classes sans changement. Si le serveur est vide mais que le navigateur a
// des classes locales, on propose de les importer.
import { useEffect, useRef, useState } from "react";
import {
  type Classe,
  type Eleve,
  chargerClasses,
  enregistrerClasses,
  nouvelId,
} from "@/lib/classes";
import PanneauEleves from "./PanneauEleves";

type EtatSauvegarde = "idle" | "en-cours" | "ok" | "erreur";

export default function GestionClasses() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [nomNouvelleClasse, setNomNouvelleClasse] = useState("");
  const [sauvegarde, setSauvegarde] = useState<EtatSauvegarde>("idle");
  const [peutImporter, setPeutImporter] = useState(false);
  // Dernier état sérialisé envoyé/chargé : évite un PUT inutile juste après le chargement.
  const dernierEnvoi = useRef<string>("");

  // Chargement initial depuis le backend (dans un effet : la requête a besoin du
  // cookie de session, indisponible au rendu serveur).
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch("/api/classes");
        if (r.ok && actif) {
          const { classes: srv } = (await r.json()) as { classes: Classe[] };
          const locales = chargerClasses();
          if (srv.length === 0 && locales.length > 0) {
            // Serveur vide + données locales → on propose l'import (miroir intact).
            setPeutImporter(true);
            dernierEnvoi.current = JSON.stringify([]);
          } else {
            setClasses(srv);
            setClasseActiveId(srv[0]?.id ?? null);
            enregistrerClasses(srv); // miroir local pour les jeux
            dernierEnvoi.current = JSON.stringify(srv);
          }
        }
      } catch {
        /* réseau : on laissera l'utilisateur réessayer en modifiant */
      } finally {
        if (actif) setCharge(true);
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  // Enregistrement (différé) vers le backend + miroir local, à chaque changement.
  useEffect(() => {
    if (!charge) return;
    const serialise = JSON.stringify(classes);
    if (serialise === dernierEnvoi.current) return;
    setSauvegarde("en-cours");
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/classes", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ classes }),
        });
        if (!r.ok) throw new Error("échec");
        dernierEnvoi.current = serialise;
        enregistrerClasses(classes); // miroir local pour les jeux
        setSauvegarde("ok");
      } catch {
        setSauvegarde("erreur");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [classes, charge]);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;

  function importerLocales() {
    const locales = chargerClasses();
    setClasses(locales);
    setClasseActiveId(locales[0]?.id ?? null);
    setPeutImporter(false);
  }

  // --- Actions sur les classes ---
  function creerClasse(e: React.FormEvent) {
    e.preventDefault();
    const nom = nomNouvelleClasse.trim();
    if (!nom) return;
    const classe: Classe = { id: nouvelId(), nom, eleves: [] };
    setClasses((prev) => [...prev, classe]);
    setClasseActiveId(classe.id);
    setNomNouvelleClasse("");
  }

  function supprimerClasse(id: string) {
    setClasses((prev) => {
      const reste = prev.filter((c) => c.id !== id);
      if (id === classeActiveId) setClasseActiveId(reste[0]?.id ?? null);
      return reste;
    });
  }

  function renommerClasse(id: string, nom: string) {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, nom } : c)));
  }

  // --- Actions sur les élèves d'une classe ---
  function majEleves(classeId: string, fn: (eleves: Eleve[]) => Eleve[]) {
    setClasses((prev) =>
      prev.map((c) => (c.id === classeId ? { ...c, eleves: fn(c.eleves) } : c)),
    );
  }

  function ajouterEleve(classeId: string, nom: string) {
    const propre = nom.trim();
    if (!propre) return;
    majEleves(classeId, (eleves) => [
      ...eleves,
      { id: nouvelId(), nom: propre },
    ]);
  }

  function supprimerEleve(classeId: string, eleveId: string) {
    majEleves(classeId, (eleves) => eleves.filter((el) => el.id !== eleveId));
  }

  function renommerEleve(classeId: string, eleveId: string, nom: string) {
    majEleves(classeId, (eleves) =>
      eleves.map((el) => (el.id === eleveId ? { ...el, nom } : el)),
    );
  }

  function importerEleves(classeId: string, texte: string) {
    const noms = texte
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (noms.length === 0) return;
    majEleves(classeId, (eleves) => [
      ...eleves,
      ...noms.map((nom) => ({ id: nouvelId(), nom })),
    ]);
  }

  const messageSauvegarde: Record<EtatSauvegarde, string> = {
    idle: "",
    "en-cours": "Enregistrement…",
    ok: "✓ Enregistré",
    erreur: "⚠ Échec de l'enregistrement — réessaie en modifiant.",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-titre text-2xl font-bold tracking-tight text-encre">
          Mes classes
        </h1>
        <p className="text-sm text-encre-douce">
          Gère tes classes et leurs élèves. Tes changements sont enregistrés
          automatiquement sur ton compte (et disponibles dans les jeux).
        </p>
      </header>

      {/* État de l'enregistrement */}
      <p
        className={`text-sm ${
          sauvegarde === "erreur"
            ? "text-rose-600 dark:text-rose-400"
            : "text-emerald-600 dark:text-emerald-400"
        }`}
        aria-live="polite"
      >
        {messageSauvegarde[sauvegarde] || " "}
      </p>

      {/* Proposition d'import des classes locales (une seule fois) */}
      {peutImporter && (
        <div className="flex flex-wrap items-center gap-3 rounded-carte border border-dashed border-ligne bg-fond p-4">
          <p className="text-sm text-encre-douce">
            Des classes sont enregistrées sur cet appareil. Les importer sur ton
            compte ?
          </p>
          <button
            type="button"
            onClick={importerLocales}
            className="shrink-0 rounded-full bg-principal px-4 py-1.5 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Importer mes classes
          </button>
        </div>
      )}

      {/* Pastilles des classes + création */}
      <div className="flex flex-col gap-3">
        {classes.length > 0 && (
          <div
            role="group"
            aria-label="Mes classes"
            className="flex flex-wrap gap-2"
          >
            {classes.map((c) => {
              const actif = c.id === classeActiveId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setClasseActiveId(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    actif
                      ? "bg-principal text-sur-principal shadow-sm"
                      : "bg-surface text-encre-douce ring-1 ring-ligne hover:bg-fond"
                  }`}
                >
                  {c.nom || "Sans nom"}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      actif ? "bg-sur-principal/20" : "bg-fond"
                    }`}
                  >
                    {c.eleves.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={creerClasse} className="flex gap-2">
          <input
            type="text"
            value={nomNouvelleClasse}
            onChange={(e) => setNomNouvelleClasse(e.target.value)}
            placeholder="Nom de la classe (ex. CM1, 6e FLE)"
            aria-label="Nom de la nouvelle classe"
            className="w-full max-w-xs rounded-full border border-ligne bg-surface px-4 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-encre px-4 py-1.5 text-sm font-semibold text-fond transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            + Nouvelle classe
          </button>
        </form>
      </div>

      {/* Panneau de la classe active */}
      {!charge ? (
        <p className="text-sm text-encre-douce">Chargement…</p>
      ) : classeActive ? (
        <PanneauEleves
          classe={classeActive}
          onRenommerClasse={(nom) => renommerClasse(classeActive.id, nom)}
          onSupprimerClasse={() => supprimerClasse(classeActive.id)}
          onAjouterEleve={(nom) => ajouterEleve(classeActive.id, nom)}
          onSupprimerEleve={(eleveId) =>
            supprimerEleve(classeActive.id, eleveId)
          }
          onRenommerEleve={(eleveId, nom) =>
            renommerEleve(classeActive.id, eleveId, nom)
          }
          onImporterEleves={(texte) => importerEleves(classeActive.id, texte)}
        />
      ) : (
        <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
          Crée une première classe pour commencer.
        </p>
      )}
    </div>
  );
}
