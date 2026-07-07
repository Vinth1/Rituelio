"use client";

// Éditeur du type « Réponse écrite courte (auto) ». Le prof liste les réponses
// acceptées (variantes) et règle la tolérance (casse, accents). La config
// produite correspond à `ConfigReponseCourte`.
import type { PropsEditeurQuestion } from "./registre-ui";
import type { ConfigReponseCourte } from "@/lib/epreuves/questions/reponse-courte";

const CLASSE_CHAMP =
  "w-full rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

export default function ReponseCourteEditeur({
  config,
  onChange,
}: PropsEditeurQuestion) {
  const c = config as ConfigReponseCourte;
  const acceptees: string[] = c.acceptees ?? [""];

  function maj(patch: Partial<ConfigReponseCourte>) {
    onChange({ ...c, ...patch });
  }

  function majReponse(index: number, valeur: string) {
    maj({ acceptees: acceptees.map((a, i) => (i === index ? valeur : a)) });
  }

  function ajouter() {
    maj({ acceptees: [...acceptees, ""] });
  }

  function supprimer(index: number) {
    const reste = acceptees.filter((_, i) => i !== index);
    maj({ acceptees: reste.length > 0 ? reste : [""] });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-encre-douce">
        Réponses acceptées (une par ligne — ajoute les variantes)
      </p>
      {acceptees.map((a, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={a}
            onChange={(e) => majReponse(index, e.target.value)}
            placeholder="Réponse acceptée…"
            aria-label={`Réponse acceptée ${index + 1}`}
            className={CLASSE_CHAMP}
          />
          <button
            type="button"
            onClick={() => supprimer(index)}
            aria-label="Supprimer cette réponse"
            className="shrink-0 rounded-full px-2 py-1 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={ajouter}
        className="self-start rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
      >
        + Variante acceptée
      </button>
      <div className="mt-1 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input
            type="checkbox"
            checked={c.ignorerCasse ?? true}
            onChange={(e) => maj({ ignorerCasse: e.target.checked })}
            className="size-4 accent-principal"
          />
          Ignorer la casse (majuscules)
        </label>
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input
            type="checkbox"
            checked={c.ignorerAccents ?? false}
            onChange={(e) => maj({ ignorerAccents: e.target.checked })}
            className="size-4 accent-principal"
          />
          Ignorer les accents
        </label>
      </div>
    </div>
  );
}
