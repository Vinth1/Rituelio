"use client";

// Champ de hashtags : pastilles supprimables + recherche des tags déjà utilisés.
//
// C'est une « combobox » au sens ARIA, calquée sur `SelecteurVerbe` : un champ
// de saisie qui filtre une liste d'options. La comparaison passe par
// `replierTag`, donc taper « passe » propose « #passé-composé ».
//
// Le composant est purement présentationnel : il reçoit les tags connus et ne
// sait pas d'où ils viennent. Il sert aussi bien à étiqueter une dictée qu'à
// filtrer la liste des dictées.
import { useEffect, useId, useRef, useState } from "react";
import { MAX_TAGS, normaliserTag, replierTag } from "@/lib/dictee";

export type TagConnu = { tag: string; n: number };

// Récupère les tags déjà utilisés par le prof. Exporté ici parce que la liste
// et l'éditeur en ont tous les deux besoin ; `recharger` sert après un
// enregistrement, qui a pu créer un tag.
export function useTagsConnus(): {
  tags: TagConnu[];
  recharger: () => void;
} {
  const [tags, setTags] = useState<TagConnu[]>([]);
  const [tour, setTour] = useState(0);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch("/api/dictees/tags");
        if (r.ok && actif) {
          const data = (await r.json()) as { tags: TagConnu[] };
          setTags(data.tags);
        }
      } catch {
        /* réseau : l'autocomplétion est vide, on peut toujours créer un tag */
      }
    })();
    return () => {
      actif = false;
    };
  }, [tour]);

  return { tags, recharger: () => setTour((t) => t + 1) };
}

export default function ChampTags({
  tags,
  onChange,
  tagsConnus,
  label,
  placeholder = "Ajouter un tag…",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  tagsConnus: TagConnu[];
  label: string;
  placeholder?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [actif, setActif] = useState(0);

  const idBase = useId();
  const idListe = `${idBase}-listbox`;
  const listeRef = useRef<HTMLUListElement>(null);

  const requete = replierTag(saisie);
  const propose = normaliserTag(saisie);
  const complet = tags.length >= MAX_TAGS;

  // Les tags déjà posés sortent de la liste ; ceux qui COMMENCENT par la
  // recherche passent devant (« impa » propose « imparfait » avant « nom-impair »).
  const debuts: TagConnu[] = [];
  const ailleurs: TagConnu[] = [];
  for (const t of tagsConnus) {
    if (tags.includes(t.tag)) continue;
    const n = replierTag(t.tag);
    if (!requete || n.startsWith(requete)) debuts.push(t);
    else if (n.includes(requete)) ailleurs.push(t);
  }
  const resultats = [...debuts, ...ailleurs];

  // Proposer la création quand la saisie ne correspond exactement à aucun tag.
  const creationPossible =
    propose !== "" &&
    !tags.includes(propose) &&
    !tagsConnus.some((t) => t.tag === propose);
  const nbOptions = resultats.length + (creationPossible ? 1 : 0);
  const actifSur = Math.min(actif, Math.max(0, nbOptions - 1));

  // Garde l'option active visible pendant la navigation au clavier.
  useEffect(() => {
    if (!ouvert) return;
    const el = listeRef.current?.querySelector<HTMLElement>(
      `[data-index="${actifSur}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [actifSur, ouvert]);

  function ajouter(tag: string) {
    if (!tag || tags.includes(tag) || complet) return;
    onChange([...tags, tag]);
    setSaisie("");
    setActif(0);
  }

  function retirer(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function choisir(index: number) {
    if (creationPossible && index === resultats.length) {
      ajouter(propose);
      return;
    }
    const t = resultats[index];
    if (t) ajouter(t.tag);
  }

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        setActif(0);
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
      e.preventDefault();
      if (nbOptions > 0) choisir(actifSur);
      return;
    }
    if (e.key === "Escape" && ouvert) {
      e.preventDefault();
      setOuvert(false);
      setSaisie("");
      return;
    }
    // Retour arrière sur un champ vide : retire le dernier tag posé.
    if (e.key === "Backspace" && saisie === "" && tags.length > 0) {
      retirer(tags[tags.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 rounded-carte border border-ligne bg-surface p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-principal-clair px-3 py-1 text-sm font-semibold text-principal-fonce"
          >
            #{tag}
            <button
              type="button"
              onClick={() => retirer(tag)}
              aria-label={`Retirer le tag ${tag}`}
              className="rounded-full px-1 transition hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              ×
            </button>
          </span>
        ))}
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
          disabled={complet}
          value={saisie}
          placeholder={complet ? `${MAX_TAGS} tags maximum` : placeholder}
          onFocus={() => {
            setOuvert(true);
            setActif(0);
          }}
          onChange={(e) => {
            setOuvert(true);
            setSaisie(e.target.value);
            setActif(0);
          }}
          onKeyDown={surTouche}
          onBlur={() => setOuvert(false)}
          className="min-w-32 flex-1 bg-transparent px-2 py-1 text-sm text-encre placeholder:text-encre-douce focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {ouvert && nbOptions > 0 && (
        <div
          // Le clic dans le panneau ne doit pas faire perdre le focus au champ,
          // sinon `onBlur` le referme avant que la sélection n'aboutisse.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-carte border border-ligne bg-surface shadow-lg"
        >
          <ul
            ref={listeRef}
            id={idListe}
            role="listbox"
            aria-label={label}
            className="max-h-56 overflow-y-auto py-1"
          >
            {resultats.map((t, i) => (
              <li
                key={t.tag}
                id={`${idBase}-opt-${i}`}
                role="option"
                aria-selected={false}
                data-index={i}
                onClick={() => choisir(i)}
                onMouseEnter={() => setActif(i)}
                className={`flex cursor-pointer items-center gap-2 px-4 py-1.5 text-sm ${
                  i === actifSur ? "bg-fond text-encre" : "text-encre-douce"
                }`}
              >
                <span className="truncate">#{t.tag}</span>
                <span className="ml-auto shrink-0 text-xs text-encre-douce">
                  {t.n} dictée{t.n > 1 ? "s" : ""}
                </span>
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
                + Créer le tag « #{propose} »
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
