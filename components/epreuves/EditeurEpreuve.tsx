"use client";

// Éditeur d'une épreuve : titre, description, options, et la suite de questions.
// Le type de chaque question fournit son propre éditeur (registre UI) et sa
// config par défaut (registre PUR). L'enregistrement (PUT) valide côté serveur ;
// une config incomplète (ex. QCM sans bonne réponse) revient en erreur affichée.
import { useEffect, useState } from "react";
import Link from "next/link";
import { TYPES_QUESTION, typeQuestion } from "@/lib/epreuves/questions/registre";
import { UI_QUESTION } from "./questions/registre-ui";
import type {
  Epreuve,
  QuestionEntrante,
  QuestionEpreuve,
} from "@/lib/epreuves/modele";

type EtatSauvegarde = "idle" | "en-cours" | "ok" | "erreur";

const CLASSE_CHAMP =
  "w-full rounded-moyen border border-ligne bg-surface px-3 py-2 text-sm text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

export default function EditeurEpreuve({ epreuveId }: { epreuveId: string }) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [melange, setMelange] = useState(false);
  const [questions, setQuestions] = useState<QuestionEpreuve[]>([]);
  const [charge, setCharge] = useState(false);
  const [introuvable, setIntrouvable] = useState(false);
  const [sauvegarde, setSauvegarde] = useState<EtatSauvegarde>("idle");
  const [messageErreur, setMessageErreur] = useState("");

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch(`/api/epreuves/${epreuveId}`);
        if (r.status === 404) {
          if (actif) setIntrouvable(true);
          return;
        }
        if (r.ok && actif) {
          const { epreuve } = (await r.json()) as { epreuve: Epreuve };
          setTitre(epreuve.titre);
          setDescription(epreuve.description);
          setMelange(epreuve.melangeQuestions);
          setQuestions(epreuve.questions);
        }
      } catch {
        /* réseau */
      } finally {
        if (actif) setCharge(true);
      }
    })();
    return () => {
      actif = false;
    };
  }, [epreuveId]);

  function ajouterQuestion(type: string) {
    const def = typeQuestion(type);
    if (!def) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        enonce: "",
        points: 1,
        config: def.configParDefaut(),
        ordre: prev.length,
      },
    ]);
    setSauvegarde("idle");
  }

  function majQuestion(id: string, patch: Partial<QuestionEpreuve>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function supprimerQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function deplacer(index: number, sens: -1 | 1) {
    setQuestions((prev) => {
      const cible = index + sens;
      if (cible < 0 || cible >= prev.length) return prev;
      const copie = [...prev];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  async function enregistrer() {
    setSauvegarde("en-cours");
    setMessageErreur("");
    const corps = {
      titre,
      description,
      melangeQuestions: melange,
      questions: questions.map<QuestionEntrante>((q) => ({
        type: q.type,
        enonce: q.enonce,
        points: q.points,
        config: q.config,
      })),
    };
    try {
      const r = await fetch(`/api/epreuves/${epreuveId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (r.ok) {
        setSauvegarde("ok");
        return;
      }
      const data = (await r.json().catch(() => null)) as { erreur?: string } | null;
      setMessageErreur(data?.erreur ?? "Échec de l'enregistrement.");
      setSauvegarde("erreur");
    } catch {
      setMessageErreur("Erreur réseau — réessaie.");
      setSauvegarde("erreur");
    }
  }

  if (introuvable) {
    return (
      <p className="text-sm text-encre-douce">
        Épreuve introuvable.{" "}
        <Link href="/prof/epreuves" className="text-principal-fonce underline">
          Retour aux évaluations
        </Link>
      </p>
    );
  }
  if (!charge) return <p className="text-sm text-encre-douce">Chargement…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/prof/epreuves"
          className="text-sm text-encre-douce transition hover:text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          ← Toutes les évaluations
        </Link>
      </div>

      {/* Réglages de l'épreuve */}
      <div className="flex flex-col gap-3 rounded-carte bg-surface p-4 ring-1 ring-ligne">
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre de l'évaluation"
          aria-label="Titre de l'évaluation"
          className="w-full rounded-moyen border border-ligne bg-fond px-3 py-2 font-titre text-lg font-bold text-encre placeholder:text-encre-douce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Consigne / description (facultatif)"
          aria-label="Description"
          rows={2}
          className={CLASSE_CHAMP}
        />
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input
            type="checkbox"
            checked={melange}
            onChange={(e) => setMelange(e.target.checked)}
            className="size-4 accent-principal"
          />
          Mélanger l’ordre des questions pour chaque élève
        </label>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-3">
        {questions.map((q, index) => {
          const def = typeQuestion(q.type);
          const Editeur = UI_QUESTION[q.type]?.Editeur;
          return (
            <div
              key={q.id}
              className="flex flex-col gap-3 rounded-carte bg-surface p-4 ring-1 ring-ligne"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-encre">
                  {index + 1}. {def?.icone} {def?.label ?? q.type}
                  {def && !def.autoCorrige ? (
                    <span className="ml-2 rounded-full bg-fond px-2 py-0.5 text-xs font-normal text-encre-douce">
                      correction manuelle
                    </span>
                  ) : null}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => deplacer(index, -1)}
                    disabled={index === 0}
                    aria-label="Monter la question"
                    className="rounded-full px-2 py-1 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => deplacer(index, 1)}
                    disabled={index === questions.length - 1}
                    aria-label="Descendre la question"
                    className="rounded-full px-2 py-1 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimerQuestion(q.id)}
                    aria-label="Supprimer la question"
                    className="rounded-full px-2 py-1 text-sm text-encre-douce transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <textarea
                value={q.enonce}
                onChange={(e) => majQuestion(q.id, { enonce: e.target.value })}
                placeholder="Énoncé de la question…"
                aria-label="Énoncé"
                rows={2}
                className={CLASSE_CHAMP}
              />

              {Editeur ? (
                <Editeur
                  idQuestion={q.id}
                  config={q.config}
                  onChange={(config) => majQuestion(q.id, { config })}
                />
              ) : (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  Type de question non éditable ici.
                </p>
              )}

              <label className="flex items-center gap-2 text-sm text-encre-douce">
                Points :
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={q.points}
                  onChange={(e) =>
                    majQuestion(q.id, { points: Number(e.target.value) })
                  }
                  aria-label="Points de la question"
                  className="w-20 rounded-moyen border border-ligne bg-surface px-2 py-1 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                />
              </label>
            </div>
          );
        })}

        {questions.length === 0 && (
          <p className="rounded-carte border border-dashed border-ligne p-6 text-center text-sm text-encre-douce">
            Ajoute une première question ci-dessous.
          </p>
        )}
      </div>

      {/* Ajouter une question */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-encre-douce">Ajouter une question</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(TYPES_QUESTION).map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => ajouterQuestion(def.type)}
              className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
            >
              {def.icone} {def.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barre d'enregistrement */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={sauvegarde === "en-cours"}
          className="rounded-full bg-principal px-5 py-2 text-sm font-semibold text-sur-principal transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:opacity-60"
        >
          {sauvegarde === "en-cours" ? "Enregistrement…" : "Enregistrer"}
        </button>
        <span
          aria-live="polite"
          className={`text-sm ${
            sauvegarde === "erreur"
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {sauvegarde === "ok"
            ? "✓ Enregistré"
            : sauvegarde === "erreur"
              ? `⚠ ${messageErreur}`
              : " "}
        </span>
      </div>
    </div>
  );
}
