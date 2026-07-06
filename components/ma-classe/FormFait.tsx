"use client";

// Saisie rapide d'un fait de comportement : élève, type, raison (liste selon le
// type, ou texte libre), détails optionnels, date (défaut aujourd'hui). Réutilisable
// avec une classe pré-remplie (fiche élève ou contexte de cours).
import { useEffect, useMemo, useState } from "react";
import {
  aujourdhuiISO,
  RAISONS,
  TYPES_FAIT,
  type FaitComportement,
  type TypeFait,
} from "@/lib/comportement";
import { couleurBande } from "@/lib/couleurs";

type Eleve = { id: string; nom: string };
const AUTRE = "__autre__";

export default function FormFait({
  classeId,
  eleves,
  eleveInitial,
  onFerme,
  onEnregistre,
}: {
  classeId: string;
  eleves: Eleve[];
  eleveInitial?: string;
  onFerme: () => void;
  onEnregistre: (fait: FaitComportement) => void;
}) {
  const [eleveId, setEleveId] = useState(eleveInitial ?? eleves[0]?.id ?? "");
  const [type, setType] = useState<TypeFait>("merit");
  const [raisonChoix, setRaisonChoix] = useState("");
  const [raisonLibre, setRaisonLibre] = useState("");
  const [details, setDetails] = useState("");
  const [dateISO, setDateISO] = useState(aujourdhuiISO());
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const liste = RAISONS[type];
  const listePresente = liste.length > 0;
  const enTexteLibre = !listePresente || raisonChoix === AUTRE;

  // Change de type et réinitialise la raison (les listes diffèrent d'un type à l'autre).
  function choisirType(t: TypeFait) {
    setType(t);
    setRaisonChoix("");
    setRaisonLibre("");
  }

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFerme();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFerme]);

  const raisonEffective = useMemo(
    () => (enTexteLibre ? raisonLibre.trim() : raisonChoix.trim()),
    [enTexteLibre, raisonLibre, raisonChoix],
  );

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (!eleveId) return setErreur("Choisis un élève.");
    if (!raisonEffective) return setErreur("Indique une raison.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return setErreur("Choisis une date.");
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await fetch("/api/ma-classe/comportement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eleveId,
          classeId,
          dateISO,
          type,
          raison: raisonEffective,
          details: details.trim(),
        }),
      });
      const data = (await r.json().catch(() => null)) as {
        fait?: FaitComportement;
        erreur?: string;
      } | null;
      if (r.ok && data?.fait) onEnregistre(data.fait);
      else setErreur(data?.erreur ?? "Échec de l'enregistrement.");
    } catch {
      setErreur("Impossible de contacter le serveur.");
    } finally {
      setEnvoi(false);
    }
  }

  const label = "flex flex-col gap-1 text-sm font-medium text-encre-douce";
  const champ =
    "rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFerme}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enregistrer un fait de comportement"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-carte border border-ligne bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-titre text-xl font-bold text-encre">Nouveau fait</h2>
        <form onSubmit={soumettre} className="mt-4 flex flex-col gap-3">
          <label className={label}>
            Élève
            <select
              value={eleveId}
              onChange={(e) => setEleveId(e.target.value)}
              className={champ}
            >
              {eleves.length === 0 && <option value="">Aucun élève</option>}
              {eleves.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.nom}
                </option>
              ))}
            </select>
          </label>

          <div className={label}>
            Type
            <div className="flex flex-wrap gap-1.5">
              {TYPES_FAIT.map((t) => (
                <button
                  key={t.cle}
                  type="button"
                  onClick={() => choisirType(t.cle)}
                  aria-pressed={type === t.cle}
                  title={t.description}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-principal ${
                    type === t.cle
                      ? couleurBande(t.couleur) + " ring-1 ring-inset ring-current"
                      : "bg-surface text-encre-douce ring-1 ring-ligne hover:bg-fond"
                  }`}
                >
                  {t.libelle}
                  <span className="ml-1 text-[11px] font-normal opacity-80">
                    {t.points > 0 ? `+${t.points}` : t.points}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className={label}>
            Raison
            {listePresente ? (
              <select
                value={raisonChoix}
                onChange={(e) => setRaisonChoix(e.target.value)}
                className={champ}
              >
                <option value="">— Choisir une raison —</option>
                {liste.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value={AUTRE}>Autre (préciser)…</option>
              </select>
            ) : null}
            {enTexteLibre && (
              <input
                type="text"
                value={raisonLibre}
                onChange={(e) => setRaisonLibre(e.target.value)}
                placeholder="Décris le fait"
                className={`${champ} mt-1.5`}
              />
            )}
          </label>

          <label className={label}>
            Détails (facultatif)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Contexte, témoins, suite donnée…"
              className={champ}
            />
          </label>

          <label className={label}>
            Date
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className={champ}
            />
          </label>

          {erreur && (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {erreur}
            </p>
          )}
          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              disabled={envoi}
              className="rounded-full bg-principal px-5 py-2 text-sm font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={onFerme}
              className="rounded-full bg-surface px-5 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
