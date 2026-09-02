"use client";

// Jeu « Image mystère » : le prof dépose ses propres images, les range par
// thèmes, et en fait apparaître une au hasard pour lancer une description, un
// échange à l'oral ou un sujet d'expression écrite.
//
// La banque se gère depuis le jeu, dans un panneau replié par défaut : pas
// besoin d'aller ailleurs pour ajouter une photo entre deux séances. Les images
// sont enregistrées sur le compte (`/api/images`), les thèmes suivent le même
// modèle de tags libres que les dictées.
//
// Avant l'envoi, chaque image est RÉDUITE dans le navigateur : une photo de
// téléphone descend ainsi sous la limite de corps d'une fonction serverless et
// la banque reste légère à projeter.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChampTags, { useTagsConnus } from "@/components/ChampTags";
import { couleurBande } from "@/lib/couleurs";
import {
  MAX_COTE,
  MAX_OCTETS,
  estMimeImage,
  tailleLisible,
  type ImageProf,
} from "@/lib/images";

const ACCENT = "pink";

const btnPrincipal =
  "inline-flex items-center gap-2 rounded-full bg-principal px-5 py-2.5 text-base font-bold text-sur-principal shadow-sm transition hover:bg-principal-fonce focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
const btnFantome =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal disabled:cursor-not-allowed disabled:opacity-50";
const champ =
  "rounded-full border border-ligne bg-surface px-4 py-2 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal";

// Élément au hasard. Hors du composant, comme dans les autres jeux : le
// compilateur React refuse un appel direct à Math.random dans le corps d'un
// composant.
function auHasard<T>(liste: T[]): T | null {
  return liste.length === 0
    ? null
    : liste[Math.floor(Math.random() * liste.length)];
}

const nomSansExtension = (nom: string) => nom.replace(/\.[^.]+$/, "");

type Prepare = { fichier: File; largeur: number; hauteur: number };

// Réduit l'image à `MAX_COTE` sur son plus grand côté et la réencode en JPEG.
// Le GIF est laissé intact : le passer par un `<canvas>` aplatirait l'animation.
async function reduire(f: File): Promise<Prepare> {
  const bitmap = await createImageBitmap(f);
  const { width, height } = bitmap;
  const aReduire =
    f.type !== "image/gif" &&
    (Math.max(width, height) > MAX_COTE || f.size > MAX_OCTETS);

  if (!aReduire) {
    bitmap.close();
    return { fichier: f, largeur: width, hauteur: height };
  }

  const ratio = Math.min(1, MAX_COTE / Math.max(width, height));
  const largeur = Math.max(1, Math.round(width * ratio));
  const hauteur = Math.max(1, Math.round(height * ratio));
  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext("2d")?.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resoudre) =>
    toile.toBlob(resoudre, "image/jpeg", 0.82),
  );
  if (!blob) return { fichier: f, largeur: width, hauteur: height };
  return {
    fichier: new File([blob], `${nomSansExtension(f.name)}.jpg`, {
      type: "image/jpeg",
    }),
    largeur,
    hauteur,
  };
}

const compteImages = (n: number) => `${n} image${n > 1 ? "s" : ""}`;

export default function ImageMystere() {
  const [images, setImages] = useState<ImageProf[]>([]);
  const [charge, setCharge] = useState(false);
  const [theme, setTheme] = useState(""); // "" = tous les thèmes
  const [courante, setCourante] = useState<ImageProf | null>(null);
  // Images déjà montrées (mode « sans remise »).
  const [vues, setVues] = useState<string[]>([]);
  const [sansRemise, setSansRemise] = useState(false);
  const [plein, setPlein] = useState(false);
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  const { tags: themesConnus, recharger: rechargerThemes } =
    useTagsConnus("/api/images/tags");

  const rechargerImages = useCallback(async () => {
    try {
      const r = await fetch("/api/images");
      if (!r.ok) throw new Error();
      const data = (await r.json()) as { images: ImageProf[] };
      setImages(data.images);
    } catch {
      setErreur("Impossible de charger la banque d'images.");
    } finally {
      setCharge(true);
    }
  }, []);

  // Chargement initial de la banque. La requête est écrite ici plutôt que par
  // un appel à `rechargerImages` : le garde `actif` évite d'écrire dans un
  // composant démonté si le prof quitte le jeu pendant le chargement.
  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const r = await fetch("/api/images");
        if (!r.ok) throw new Error();
        const data = (await r.json()) as { images: ImageProf[] };
        if (actif) setImages(data.images);
      } catch {
        if (actif) setErreur("Impossible de charger la banque d'images.");
      } finally {
        if (actif) setCharge(true);
      }
    })();
    return () => {
      actif = false;
    };
  }, []);

  // Échap referme la projection plein écran.
  useEffect(() => {
    if (!plein) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlein(false);
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [plein]);

  const pool = theme ? images.filter((i) => i.tags.includes(theme)) : images;
  const restantes = pool.filter((i) => !vues.includes(i.id));

  function tirer() {
    setErreur(null);
    // Sans remise : l'image affichée sort du tirage au coup suivant.
    let candidates = restantes;
    if (sansRemise && courante) {
      candidates = candidates.filter((i) => i.id !== courante.id);
      setVues((prev) => [...prev, courante.id]);
    } else if (courante && pool.length > 1) {
      // Avec remise : on évite au moins de retomber sur la même tout de suite.
      candidates = candidates.filter((i) => i.id !== courante.id);
    }
    const tiree = auHasard(candidates);
    if (!tiree) {
      setErreur(
        pool.length === 0
          ? "Aucune image dans ce thème."
          : "Toutes les images sont passées : réinitialise le tirage.",
      );
      return;
    }
    setCourante(tiree);
  }

  function reinitialiser() {
    setVues([]);
    setCourante(null);
    setErreur(null);
  }

  function changerTheme(suite: string) {
    setTheme(suite);
    reinitialiser();
  }

  async function envoyer(fichiers: File[]) {
    const acceptes = fichiers.filter((f) => estMimeImage(f.type));
    if (acceptes.length === 0) {
      setErreur("Formats acceptés : JPEG, PNG, WebP, GIF.");
      return;
    }
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      for (const f of acceptes) {
        const prepare = await reduire(f);
        if (prepare.fichier.size > MAX_OCTETS) {
          setErreur(
            `« ${f.name} » reste trop lourde (max ${tailleLisible(MAX_OCTETS)}).`,
          );
          continue;
        }
        const form = new FormData();
        form.set("fichier", prepare.fichier);
        form.set("largeur", String(prepare.largeur));
        form.set("hauteur", String(prepare.hauteur));
        form.set("titre", nomSansExtension(f.name).slice(0, 120));
        // Déposer depuis un thème filtré range l'image dedans d'emblée.
        form.set("tags", theme);
        const r = await fetch("/api/images", { method: "POST", body: form });
        if (!r.ok) {
          const data = (await r.json().catch(() => null)) as {
            erreur?: string;
          } | null;
          setErreur(data?.erreur ?? `Envoi de « ${f.name} » impossible.`);
          continue;
        }
        const { image } = (await r.json()) as { image: ImageProf };
        setImages((prev) => [image, ...prev]);
      }
      rechargerThemes();
    } catch {
      setErreur("Le téléversement a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function majImage(id: string, champs: { titre: string; tags: string[] }) {
    // L'affichage est mis à jour tout de suite : l'étiquetage doit rester fluide.
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...champs } : i)),
    );
    const r = await fetch(`/api/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(champs),
    });
    if (!r.ok) {
      setErreur("L'enregistrement a échoué.");
      void rechargerImages();
      return;
    }
    rechargerThemes();
  }

  async function supprimerImage(id: string) {
    setASupprimer(null);
    const r = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!r.ok) {
      setErreur("La suppression a échoué.");
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== id));
    setVues((prev) => prev.filter((v) => v !== id));
    setCourante((c) => (c?.id === id ? null : c));
    rechargerThemes();
  }

  if (!charge) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-6 text-sm text-encre-douce">
        Chargement de la banque d’images…
      </p>
    );
  }

  return (
    <div className="rounded-carte border border-ligne bg-surface p-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-carte px-4 py-3 ${couleurBande(ACCENT)}`}
      >
        <h2 className="font-titre text-2xl font-bold">🖼️ Image mystère</h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Thème
          <select
            value={theme}
            onChange={(e) => changerTheme(e.target.value)}
            className="rounded-moyen border border-ligne bg-surface px-3 py-1.5 text-sm text-encre focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
          >
            <option value="">Tous ({images.length})</option>
            {themesConnus.map((t) => (
              <option key={t.tag} value={t.tag}>
                #{t.tag} ({t.n})
              </option>
            ))}
          </select>
        </label>
      </div>

      {erreur && (
        <p
          role="alert"
          className="mt-4 rounded-carte border border-dashed border-ligne p-3 text-center text-sm text-encre-douce"
        >
          {erreur}
        </p>
      )}

      {/* L'image tirée */}
      <div
        aria-live="polite"
        className="mt-6 flex min-h-[16rem] items-center justify-center rounded-carte bg-fond p-3"
      >
        {courante ? (
          <figure className="flex w-full flex-col items-center gap-2">
            <Image
              src={courante.url}
              alt={courante.titre || "Image mystère"}
              width={courante.largeur}
              height={courante.hauteur}
              unoptimized
              className="max-h-[28rem] w-auto max-w-full rounded-moyen object-contain"
            />
          </figure>
        ) : (
          <p className="p-8 text-center text-sm text-encre-douce">
            {images.length === 0
              ? "Ta banque est vide : ouvre « Gérer mes images » pour déposer tes premières photos."
              : "Clique sur « Image mystère » pour en faire apparaître une."}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={tirer}
          disabled={images.length === 0}
          className={btnPrincipal}
        >
          <span aria-hidden="true">🎲</span>{" "}
          {courante ? "Image suivante" : "Image mystère"}
        </button>
        <button
          type="button"
          onClick={() => setPlein(true)}
          disabled={!courante}
          className={btnFantome}
        >
          <span aria-hidden="true">⛶</span> Projeter
        </button>
        <label className="flex items-center gap-2 text-sm text-encre-douce">
          <input
            type="checkbox"
            checked={sansRemise}
            onChange={(e) => {
              setSansRemise(e.target.checked);
              setVues([]);
            }}
            className="h-4 w-4 accent-principal"
          />
          Sans remise
        </label>
        <button
          type="button"
          onClick={reinitialiser}
          disabled={vues.length === 0 && !courante}
          className={btnFantome}
        >
          ↺ Réinitialiser
        </button>
      </div>

      {sansRemise && (
        <p className="mt-2 text-center text-sm text-encre-douce">
          {restantes.length} image{restantes.length > 1 ? "s" : ""} encore à
          montrer sur {pool.length}
        </p>
      )}

      {/* La banque */}
      <div className="mt-8 border-t border-ligne pt-4">
        <button
          type="button"
          onClick={() => setPanneauOuvert((o) => !o)}
          aria-expanded={panneauOuvert}
          className="text-sm font-semibold text-principal-fonce underline focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
        >
          {panneauOuvert ? "▾" : "▸"} Gérer mes images ({images.length})
        </button>

        {panneauOuvert && (
          <div className="mt-4">
            <p className="rounded-carte bg-fond px-4 py-2 text-sm text-encre-douce">
              Ces images sont servies par une adresse imprévisible mais{" "}
              <strong>publique</strong> : dépose des paysages, des objets, des
              scènes — jamais de photo d’élève.
            </p>

            {/* Zone de dépôt */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSurvol(true);
              }}
              onDragLeave={() => setSurvol(false)}
              onDrop={(e) => {
                e.preventDefault();
                setSurvol(false);
                void envoyer(Array.from(e.dataTransfer.files));
              }}
              className={`mt-4 rounded-carte border-2 border-dashed p-6 text-center transition ${
                survol ? "border-principal bg-fond" : "border-ligne"
              }`}
            >
              <p className="text-sm text-encre-douce">
                Glisse tes images ici{theme && ` (elles iront dans #${theme})`}
              </p>
              <input
                ref={champFichier}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void envoyer(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => champFichier.current?.click()}
                disabled={envoiEnCours}
                className={`mt-3 ${btnFantome}`}
              >
                {envoiEnCours ? "Envoi en cours…" : "📁 Choisir des fichiers"}
              </button>
              <p className="mt-2 text-xs text-encre-douce">
                JPEG, PNG, WebP, GIF — réduites à {MAX_COTE} px avant l’envoi.
              </p>
            </div>

            {/* Les images déposées */}
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {images.map((image) => (
                <li
                  key={image.id}
                  className="flex gap-3 rounded-carte border border-ligne p-3"
                >
                  <Image
                    src={image.url}
                    alt=""
                    width={image.largeur}
                    height={image.hauteur}
                    unoptimized
                    className="h-24 w-24 shrink-0 rounded-moyen object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      defaultValue={image.titre}
                      aria-label="Titre de l’image"
                      onBlur={(e) => {
                        const titre = e.target.value.trim();
                        if (titre !== image.titre) {
                          void majImage(image.id, { titre, tags: image.tags });
                        }
                      }}
                      className={`w-full ${champ}`}
                    />
                    <div className="mt-2">
                      <ChampTags
                        tags={image.tags}
                        onChange={(tags) =>
                          void majImage(image.id, { titre: image.titre, tags })
                        }
                        tagsConnus={themesConnus}
                        label={`Thèmes de ${image.titre || "l’image"}`}
                        placeholder="Ajouter un thème…"
                        libelleCompte={compteImages}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-encre-douce">
                        {image.largeur}×{image.hauteur} ·{" "}
                        {tailleLisible(image.tailleOctets)}
                      </span>
                      {aSupprimer === image.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void supprimerImage(image.id)}
                            className="rounded-full px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-principal dark:text-rose-300 dark:ring-rose-500/40 dark:hover:bg-rose-500/10"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setASupprimer(null)}
                            className="rounded-full px-3 py-1 text-xs font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setASupprimer(image.id)}
                          className="ml-auto rounded-full px-3 py-1 text-xs font-medium text-encre-douce ring-1 ring-ligne transition hover:bg-fond focus:outline-none focus-visible:ring-2 focus-visible:ring-principal"
                        >
                          🗑 Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Projection : palette nuit forcée, comme le mode projection des fiches */}
      {plein && courante && (
        <div className="dark fixed inset-0 z-50 flex flex-col bg-fond text-encre">
          <div className="flex justify-end p-4">
            <button type="button" onClick={() => setPlein(false)} className={btnFantome}>
              ✕ Fermer (Échap)
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <Image
              src={courante.url}
              alt={courante.titre || "Image mystère"}
              width={courante.largeur}
              height={courante.hauteur}
              unoptimized
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
