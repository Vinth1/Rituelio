"use client";

// Jeu jouable « Défi lecture » : afficher un défi de lecture (virelangue ou mot
// difficile), tirer un élève au sort pour le lire à voix haute, puis valider sa
// lecture (« Réussi » / « À retravailler »). Une bande suit le passage de chaque
// élève. La synthèse vocale du navigateur lit le modèle. Pensé pour le
// vidéoprojecteur, sans persistance : l'état repart à zéro au rechargement.
import { useEffect, useState } from "react";
import Link from "next/link";
import { defis } from "@/data/defis-lecture";
import { type Classe, chargerClasses } from "@/lib/classes";
import { couleurBande } from "@/lib/couleurs";

const ACCENT = "coral"; // accent de couleur du rituel « expression orale »

type Statut = "reussi" | "aRetravailler";

// Tire un index au hasard dans [0, longueur[, en évitant `sauf` si possible
// (pour changer de défi sans retomber sur le même).
function tirerIndexAleatoire(longueur: number, sauf?: number): number {
  if (longueur <= 1) return 0;
  let i = Math.floor(Math.random() * longueur);
  if (sauf !== undefined && i === sauf) i = (i + 1) % longueur;
  return i;
}

export default function DefiLecture() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [classeActiveId, setClasseActiveId] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [defiIndex, setDefiIndex] = useState(0);
  const [eleveDesigneId, setEleveDesigneId] = useState<string | null>(null);
  // Statut de lecture par id d'élève, pour la séance en cours.
  const [statuts, setStatuts] = useState<Record<string, Statut>>({});
  const [ttsDispo, setTtsDispo] = useState(false);

  // Chargement des classes + détection de la synthèse vocale (côté client).
  useEffect(() => {
    const initiales = chargerClasses();
    setClasses(initiales);
    setClasseActiveId(initiales[0]?.id ?? null);
    setTtsDispo(typeof window !== "undefined" && "speechSynthesis" in window);
    setDefiIndex(tirerIndexAleatoire(defis.length));
    setCharge(true);
  }, []);

  // Couper toute lecture en cours quand on quitte le jeu.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const classeActive = classes.find((c) => c.id === classeActiveId) ?? null;
  const eleves = classeActive?.eleves ?? [];
  const defi = defis[defiIndex];
  const eleveDesigne = eleves.find((el) => el.id === eleveDesigneId) ?? null;
  const restants = eleves.filter(
    (el) => !statuts[el.id] && el.id !== eleveDesigneId,
  );
  const tousPasses =
    eleves.length > 0 && restants.length === 0 && eleveDesigneId === null;
  const aDuSuivi = eleves.some((el) => statuts[el.id]) || eleveDesigneId !== null;

  // Lit le texte du défi à voix haute en français.
  function ecouterModele() {
    if (!ttsDispo) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // couper une éventuelle lecture en cours
    const u = new SpeechSynthesisUtterance(defi.texte);
    u.lang = "fr-FR";
    synth.speak(u);
  }

  function changerDefi() {
    setDefiIndex((i) => tirerIndexAleatoire(defis.length, i));
  }

  // Désigne au hasard un élève pas encore passé.
  function tirerEleve() {
    if (restants.length === 0) return;
    const choisi = restants[Math.floor(Math.random() * restants.length)];
    setEleveDesigneId(choisi.id);
  }

  // Enregistre le statut de l'élève désigné, puis libère le tirage.
  function valider(statut: Statut) {
    if (!eleveDesigneId) return;
    setStatuts((prev) => ({ ...prev, [eleveDesigneId]: statut }));
    setEleveDesigneId(null);
  }

  // Vide la bande de suivi (statuts + élève désigné).
  function reinitialiser() {
    setStatuts({});
    setEleveDesigneId(null);
  }

  // Styles communs de boutons.
  const btnPrincipal =
    "inline-flex items-center gap-2 rounded-full bg-principal px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
  const btnFantome =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      {/* Barre du haut : titre + sélecteur de classe */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Défi lecture
        </h2>
        {classes.length > 0 && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            Classe
            <select
              value={classeActiveId ?? ""}
              onChange={(e) => {
                setClasseActiveId(e.target.value);
                setEleveDesigneId(null);
              }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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

      {/* Bloc « Défi du jour » (indépendant de la classe) */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Défi du jour
          </span>
          {defi.son && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${couleurBande(ACCENT)}`}
            >
              Son : {defi.son}
            </span>
          )}
        </div>
        <div
          className={`flex flex-col items-center justify-center rounded-2xl p-6 text-center ${couleurBande(ACCENT)}`}
        >
          <p className="text-2xl font-bold leading-snug sm:text-3xl">
            {defi.texte}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={ecouterModele}
            disabled={!ttsDispo}
            title={
              ttsDispo
                ? undefined
                : "La synthèse vocale n'est pas disponible dans ce navigateur."
            }
            className={btnPrincipal}
          >
            <span aria-hidden="true">🔊</span> Écouter le modèle
          </button>
          <button type="button" onClick={changerDefi} className={btnFantome}>
            Changer de défi
          </button>
        </div>
      </div>

      {/* Tirage + validation + bande de la classe */}
      {!charge ? (
        <p className="mt-6 text-sm text-slate-400">Chargement…</p>
      ) : classes.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Aucune classe pour le moment. Crée une classe et ses élèves depuis la
          page{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            « Mes classes »
          </Link>
          .
        </p>
      ) : eleves.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Cette classe ne contient encore aucun élève. Ajoute des élèves depuis
          la page{" "}
          <Link
            href="/classe"
            className="font-semibold text-principal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            « Mes classes »
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Zone de tirage */}
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 text-center dark:border-slate-700">
            {eleveDesigne ? (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Au tour de
                </p>
                <p className="my-2 text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                  {eleveDesigne.nom}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => valider("reussi")}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span aria-hidden="true">✓</span> Réussi
                  </button>
                  <button
                    type="button"
                    onClick={() => valider("aRetravailler")}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <span aria-hidden="true">↻</span> À retravailler
                  </button>
                </div>
              </>
            ) : tousPasses ? (
              <>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  Tout le monde est passé <span aria-hidden="true">🎉</span>
                </p>
                <button
                  type="button"
                  onClick={reinitialiser}
                  className={`mt-3 ${btnPrincipal}`}
                >
                  Recommencer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={tirerEleve}
                className="inline-flex items-center gap-2 rounded-full bg-principal px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
              >
                <span aria-hidden="true">🎲</span> Tirer un élève
              </button>
            )}
          </div>

          {/* Bande de la classe */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                La classe
              </span>
              <button
                type="button"
                onClick={reinitialiser}
                disabled={!aDuSuivi}
                className="rounded-full px-3 py-1 text-sm font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:ring-slate-600 dark:hover:bg-slate-700"
              >
                Réinitialiser
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {eleves.map((el) => {
                const statut = statuts[el.id];
                const designe = el.id === eleveDesigneId;
                let couleur =
                  "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
                if (statut === "reussi")
                  couleur =
                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200";
                if (statut === "aRetravailler")
                  couleur =
                    "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200";
                return (
                  <span
                    key={el.id}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${couleur} ${designe ? "ring-2 ring-principal" : ""}`}
                  >
                    {statut === "reussi" && <span aria-hidden="true">✓</span>}
                    {statut === "aRetravailler" && (
                      <span aria-hidden="true">↻</span>
                    )}
                    {el.nom}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
