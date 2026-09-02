"use client";

// Outil « Générateur de groupes » : tire au sort des binômes, trinômes… dans
// une classe. Les élèves absents se décochent avant le tirage (usage réel en
// classe). Pensé vidéoprojecteur : les groupes s'affichent en grandes cartes.
// La répartition elle-même vit dans lib/groupes.ts (fonction pure, testée).
import { useEffect, useState } from "react";
import Link from "next/link";
import { type Classe, type Eleve, chargerClasses } from "@/lib/classes";
import { CLES_ACCENT, couleurBande } from "@/lib/couleurs";
import { constituerGroupes } from "@/lib/groupes";

// Tailles proposées, avec le mot qui parle aux élèves quand il existe.
const TAILLES = [
  { valeur: 2, label: "Binômes" },
  { valeur: 3, label: "Trinômes" },
  { valeur: 4, label: "Par 4" },
  { valeur: 5, label: "Par 5" },
  { valeur: 6, label: "Par 6" },
] as const;

export default function GenerateurGroupes() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [absents, setAbsents] = useState<string[]>([]);
  const [taille, setTaille] = useState<number>(2);
  const [groupes, setGroupes] = useState<Eleve[][] | null>(null);

  // Classes : le backend fait foi ; le miroir localStorage sert de repli pour
  // rester utilisable si l'API ne répond pas.
  useEffect(() => {
    let actif = true;
    (async () => {
      let liste: Classe[] = [];
      try {
        const r = await fetch("/api/classes");
        if (r.ok) {
          const data = (await r.json()) as { classes: Classe[] };
          liste = data.classes;
        }
      } catch {
        /* repli ci-dessous */
      }
      if (liste.length === 0) liste = chargerClasses();
      if (!actif) return;
      setClasses(liste);
      setClasseActiveId(liste[0]?.id ?? null);
      setCharge(true);
    })();
    return () => {
      actif = false;
    };
  }, []);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const presents = eleves.filter((el) => !absents.includes(el.id));

  function changerClasse(id: string) {
    setClasseActiveId(id);
    setAbsents([]);
    setGroupes(null);
  }

  function basculerPresence(id: string) {
    setAbsents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";

  if (!charge) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-6 text-sm text-encre-douce">
        Chargement des classes…
      </p>
    );
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-2xl font-bold text-encre">
          👥 Générateur de groupes
        </h1>
        {classes.length > 0 && (
          <label className="flex items-center gap-2 text-sm font-medium text-encre-douce">
            Classe
            <select
              value={classeActiveId ?? ""}
              onChange={(e) => changerClasse(e.target.value)}
              className="rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom || "Sans nom"} ({c.eleves.length})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {classes.length === 0 || eleves.length === 0 ? (
        <p className="mt-6 rounded-carte border border-dashed border-ligne p-8 text-center text-sm text-encre-douce">
          {classes.length === 0
            ? "Aucune classe pour l’instant."
            : "Cette classe n’a pas encore d’élèves."}{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal-fonce underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            Gérer mes classes
          </Link>
        </p>
      ) : (
        <>
          {/* Taille des groupes */}
          <div
            role="group"
            aria-label="Taille des groupes"
            className="mt-6 flex flex-wrap gap-2"
          >
            {TAILLES.map((t) => (
              <button
                key={t.valeur}
                type="button"
                aria-pressed={taille === t.valeur}
                onClick={() => setTaille(t.valeur)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                  taille === t.valeur
                    ? "bg-principal text-sur-principal shadow-sm"
                    : "bg-surface text-encre ring-1 ring-ligne hover:bg-fond"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Présents / absents */}
          <div className="mt-5 rounded-carte border border-ligne p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-titre font-bold text-encre">
                Qui est là ?{" "}
                <span className="font-corps text-sm font-normal text-encre-douce">
                  {presents.length} présent{presents.length > 1 ? "s" : ""} sur{" "}
                  {eleves.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setAbsents([])}
                disabled={absents.length === 0}
                className={btnFantome}
              >
                Tout le monde est là
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {eleves.map((el) => {
                const present = !absents.includes(el.id);
                return (
                  <button
                    key={el.id}
                    type="button"
                    aria-pressed={present}
                    onClick={() => basculerPresence(el.id)}
                    className={`rounded-full px-3 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                      present
                        ? "bg-principal-clair font-medium text-badge-encre"
                        : "text-encre-douce line-through ring-1 ring-ligne hover:bg-fond"
                    }`}
                  >
                    {el.nom}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setGroupes(constituerGroupes(presents, taille))}
              disabled={presents.length === 0}
              className={btnPrincipal}
            >
              <span aria-hidden="true">🎲</span>{" "}
              {groupes ? "Mélanger à nouveau" : "Constituer les groupes"}
            </button>
            {groupes && (
              <button
                type="button"
                onClick={() => setGroupes(null)}
                className={btnFantome}
              >
                ✕ Effacer
              </button>
            )}
          </div>

          {/* Résultat */}
          {groupes && (
            <div
              aria-live="polite"
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {groupes.map((groupe, i) => (
                <article
                  key={i}
                  className="overflow-hidden rounded-carte border border-ligne bg-surface shadow-sm"
                >
                  <h3
                    className={`px-4 py-2 font-titre font-bold ${couleurBande(
                      CLES_ACCENT[i % CLES_ACCENT.length],
                    )}`}
                  >
                    Groupe {i + 1}
                  </h3>
                  <ul className="flex flex-col gap-1 p-4">
                    {groupe.map((el) => (
                      <li key={el.id} className="text-lg text-encre">
                        {el.nom}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
