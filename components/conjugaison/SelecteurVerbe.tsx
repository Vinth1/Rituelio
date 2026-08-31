"use client";

// Sélecteur de verbe avec recherche. Remplace la liste déroulante native, qui
// devenait inutilisable avec plusieurs centaines de verbes.
//
// C'est une « combobox » au sens ARIA : un champ de saisie qui filtre une liste
// d'options. La recherche passe par `normaliser()` (lib/conjugaison), donc taper
// « etre » trouve « être » et « repondre » trouve « répondre ».
//
// Le composant est purement présentationnel : il reçoit la liste des verbes et
// ne connaît ni la banque ni les verbes personnalisés.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normaliser } from "@/lib/conjugaison";
import type { EntreeVerbe, Groupe } from "@/data/verbes";

// Au-delà, la liste est illisible et le rendu inutilement lourd : on invite à
// affiner plutôt que de tout afficher.
const MAX_RESULTATS = 60;

const FILTRES: { cle: Groupe | "tous"; label: string }[] = [
  { cle: "tous", label: "Tous" },
  { cle: "1er groupe", label: "1er" },
  { cle: "2e groupe", label: "2e" },
  { cle: "3e groupe", label: "3e" },
];

export default function SelecteurVerbe({
  valeur,
  onChange,
  verbes,
  label,
  onCreer,
  infinitifsPerso,
  onSupprimer,
}: {
  valeur: string;
  onChange: (infinitif: string) => void;
  verbes: EntreeVerbe[];
  label: string;
  // Fourni seulement quand la création d'un verbe personnalisé est possible.
  onCreer?: (infinitifPropose: string) => void;
  // Verbes du prof : signalés par une pastille et supprimables.
  infinitifsPerso?: Set<string>;
  onSupprimer?: (infinitif: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [actif, setActif] = useState(0);
  const [filtre, setFiltre] = useState<Groupe | "tous">("tous");

  const idBase = useId();
  const idListe = `${idBase}-listbox`;
  const listeRef = useRef<HTMLUListElement>(null);

  const requete = normaliser(saisie);

  const resultats = useMemo(() => {
    const parGroupe =
      filtre === "tous" ? verbes : verbes.filter((v) => v.groupe === filtre);
    if (!requete) return parGroupe.slice(0, MAX_RESULTATS);
    // Les verbes qui COMMENCENT par la recherche passent devant : taper « part »
    // doit proposer « partir » avant « repartir ».
    const debuts: EntreeVerbe[] = [];
    const ailleurs: EntreeVerbe[] = [];
    for (const v of parGroupe) {
      const n = normaliser(v.infinitif);
      if (n.startsWith(requete)) debuts.push(v);
      else if (n.includes(requete)) ailleurs.push(v);
    }
    return [...debuts, ...ailleurs].slice(0, MAX_RESULTATS);
  }, [verbes, filtre, requete]);

  // Proposer la création quand la saisie ne correspond à aucun verbe existant.
  const creationPossible =
    !!onCreer &&
    requete.length > 1 &&
    !verbes.some((v) => normaliser(v.infinitif) === requete);
  const nbOptions = resultats.length + (creationPossible ? 1 : 0);

  // Filet de sécurité : si la liste rétrécit, l'index actif est ramené dans les
  // clous au rendu. Les gestionnaires le remettent déjà à 0 à chaque filtrage,
  // mais s'en remettre à eux seuls laisserait passer un index hors liste.
  const actifSur = Math.min(actif, Math.max(0, nbOptions - 1));

  // Garde l'option active visible pendant la navigation au clavier.
  useEffect(() => {
    if (!ouvert) return;
    const el = listeRef.current?.querySelector<HTMLElement>(
      `[data-index="${actifSur}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [actifSur, ouvert]);

  function ouvrir() {
    setOuvert(true);
    setSaisie("");
    setActif(0);
  }

  function fermer() {
    setOuvert(false);
    setSaisie("");
  }

  function choisir(index: number) {
    if (creationPossible && index === resultats.length) {
      onCreer?.(saisie.trim().toLowerCase());
      fermer();
      return;
    }
    const v = resultats[index];
    if (!v) return;
    onChange(v.infinitif);
    fermer();
  }

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!ouvert) {
        ouvrir();
        return;
      }
      if (nbOptions === 0) return;
      const pas = e.key === "ArrowDown" ? 1 : -1;
      setActif((i) => {
        const borne = Math.min(i, nbOptions - 1);
        return (borne + pas + nbOptions) % nbOptions;
      });
      return;
    }
    if (e.key === "Home" && ouvert) {
      e.preventDefault();
      setActif(0);
      return;
    }
    if (e.key === "End" && ouvert) {
      e.preventDefault();
      setActif(Math.max(0, nbOptions - 1));
      return;
    }
    if (e.key === "Enter") {
      if (!ouvert) return;
      e.preventDefault();
      choisir(actifSur);
      return;
    }
    if (e.key === "Escape") {
      if (!ouvert) return;
      e.preventDefault();
      // Échap referme sans rien changer : la valeur précédente est conservée.
      fermer();
    }
  }

  const champ =
    "w-full rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={idListe}
        aria-autocomplete="list"
        aria-activedescendant={
          ouvert && nbOptions > 0 ? `${idBase}-opt-${actifSur}` : undefined
        }
        aria-label={label}
        autoComplete="off"
        value={ouvert ? saisie : valeur}
        placeholder={ouvert ? "Chercher un verbe…" : undefined}
        onFocus={ouvrir}
        onChange={(e) => {
          if (!ouvert) setOuvert(true);
          setSaisie(e.target.value);
          setActif(0);
        }}
        onKeyDown={surTouche}
        onBlur={fermer}
        className={champ}
      />

      {ouvert && (
        <div
          // Le clic dans le panneau ne doit pas faire perdre le focus au champ,
          // sinon `onBlur` le referme avant que la sélection n'aboutisse.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-carte border border-ligne bg-surface shadow-lg"
        >
          <div className="flex flex-wrap gap-1 border-b border-ligne p-2">
            {FILTRES.map((f) => (
              <button
                key={f.cle}
                type="button"
                onClick={() => {
                  setFiltre(f.cle);
                  setActif(0);
                }}
                aria-pressed={filtre === f.cle}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                  filtre === f.cle
                    ? "bg-fond text-principal"
                    : "text-encre-douce hover:bg-fond"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ul
            ref={listeRef}
            id={idListe}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto py-1"
          >
            {resultats.map((v, i) => (
              <li
                key={v.infinitif}
                id={`${idBase}-opt-${i}`}
                role="option"
                aria-selected={v.infinitif === valeur}
                data-index={i}
                onClick={() => choisir(i)}
                onMouseEnter={() => setActif(i)}
                className={`flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm ${
                  i === actifSur ? "bg-fond text-encre" : "text-encre-douce"
                }`}
              >
                <span className="truncate">{v.infinitif}</span>
                {infinitifsPerso?.has(v.infinitif) && (
                  <span className="shrink-0 rounded-full bg-fond px-2 py-0.5 text-xs font-semibold text-principal">
                    perso
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-encre-douce">
                  {v.groupe}
                </span>
                {onSupprimer && infinitifsPerso?.has(v.infinitif) && (
                  <button
                    type="button"
                    // Le clic ne doit pas aussi sélectionner le verbe.
                    onClick={(e) => {
                      e.stopPropagation();
                      onSupprimer(v.infinitif);
                    }}
                    aria-label={`Supprimer le verbe ${v.infinitif}`}
                    title="Supprimer ce verbe"
                    className="shrink-0 rounded-full px-1.5 text-encre-douce transition hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}

            {creationPossible && (
              <li
                id={`${idBase}-opt-${resultats.length}`}
                role="option"
                aria-selected={false}
                data-index={resultats.length}
                onClick={() => choisir(resultats.length)}
                onMouseEnter={() => setActif(resultats.length)}
                className={`cursor-pointer border-t border-ligne px-4 py-2 text-sm font-semibold ${
                  actifSur === resultats.length
                    ? "bg-fond text-principal"
                    : "text-principal"
                }`}
              >
                + Créer le verbe « {saisie.trim().toLowerCase()} »
              </li>
            )}

            {nbOptions === 0 && (
              <li className="px-4 py-3 text-sm text-encre-douce">
                Aucun verbe ne correspond.
              </li>
            )}
          </ul>

          {resultats.length === MAX_RESULTATS && (
            <p className="border-t border-ligne px-4 py-1.5 text-xs text-encre-douce">
              Beaucoup de résultats — précise ta recherche.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
