"use client";

// Éditeur du type « QCM (une seule réponse) ». Le prof saisit les propositions
// et coche la bonne (bouton radio). La config produite correspond à `ConfigQcm`.
import type { PropsEditeurQuestion } from "./registre-ui";
import type { ConfigQcm, OptionQcm } from "@/lib/epreuves/questions/qcm";

const CLASSE_CHAMP =
  "w-full rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

export default function QcmEditeur({
  idQuestion,
  config,
  onChange,
}: PropsEditeurQuestion) {
  const c = config as ConfigQcm;
  const options: OptionQcm[] = c.options ?? [];

  function maj(patch: Partial<ConfigQcm>) {
    onChange({ ...c, ...patch });
  }

  function majTexte(optId: string, texte: string) {
    maj({ options: options.map((o) => (o.id === optId ? { ...o, texte } : o)) });
  }

  function ajouter() {
    maj({ options: [...options, { id: crypto.randomUUID(), texte: "" }] });
  }

  function supprimer(optId: string) {
    maj({
      options: options.filter((o) => o.id !== optId),
      bonneOption: c.bonneOption === optId ? "" : c.bonneOption,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-encre-douce">
        Propositions — coche la bonne réponse
      </p>
      {options.map((o) => (
        <div key={o.id} className="flex items-center gap-2">
          <input
            type="radio"
            name={`bonne-${idQuestion}`}
            checked={c.bonneOption === o.id}
            onChange={() => maj({ bonneOption: o.id })}
            aria-label="Bonne réponse"
            className="size-4 accent-principal"
          />
          <input
            type="text"
            value={o.texte}
            onChange={(e) => majTexte(o.id, e.target.value)}
            placeholder="Proposition…"
            className={CLASSE_CHAMP}
          />
          <button
            type="button"
            onClick={() => supprimer(o.id)}
            aria-label="Supprimer la proposition"
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
        + Proposition
      </button>
    </div>
  );
}
