# Rituelio — Brief projet

> Document de cadrage lu par Claude Code à chaque session.
> Nom du projet : **Rituelio** (un site de rituels et jeux de classe).

## Objectif

Site web qui répertorie des jeux et activités pour l'enseignement des langues
(français, collège et primaire). L'interface fonctionne comme un **sélecteur de
jeux** : l'enseignant choisit un jeu dans une grille de cartes, organisée par
catégorie (« rituels » de classe).

Inspirations visuelles : Blooket (ambiance ludique), Chess.com (menu latéral par
mode de jeu), tableau de bord de classe (grille de cartes + carte « + »).

## Périmètre du MVP

- Un seul contributeur (moi) ajoute les jeux et les fonctionnalités.
- **Deux types de jeux** cohabitent :
  - **Fiche** : jeu décrit (règles, matériel, déroulé) — pas d'interaction.
  - **Jouable** : mini-jeu interactif dans le navigateur (composant React).
- **Pas de notion de niveau** pour l'instant.
- Les compétences / objectifs pédagogiques apparaissent dans un onglet
  « Plus d'infos / Aide » propre à chaque jeu — jamais sur la carte.
- À terme : site **public**, mais sans comptes utilisateurs ni contributions
  externes au démarrage.

## Stack technique

- **Next.js (App Router) + React + TypeScript**
- **Tailwind CSS** pour le style
- **Contenu statique dans des fichiers** :
  - Catalogue des jeux : `data/jeux.ts`
  - Jeux jouables : composants React dans `components/jeux/`
  - Banques de contenu : `data/verbes.ts`, `data/quiz.ts`…
- **Backend Postgres** pour les données dynamiques et sensibles (comptes prof,
  évaluations, classes/élèves, « Ma classe ») — voir la section **Backend**.
- Déploiement visé : **Vercel** + **Postgres managé** (Neon / Vercel Postgres).

## Architecture

- **Menu latéral** = catégories / rituels (ex : Mot de la semaine, Conjugaison,
  Lexique, Orthographe, Expression orale).
- **Zone principale** = grille de cartes (une carte par jeu), + une carte « + ».
- Clic sur une carte :
  - jeu `fiche` → page de détail (déroulé + onglet « Plus d'infos / Aide »)
  - jeu `jouable` → lance le composant interactif (+ onglet « Plus d'infos / Aide »)
- Chaque jeu a un `id` (slug). Les jeux jouables référencent leur composant via
  le champ `composant`.

## Backend

Le site n'est plus 100 % localStorage : un **backend Postgres** porte les données
dynamiques et sensibles. Client SQL : le paquet `postgres` (postgres.js), requêtes
écrites à la main (pas d'ORM).

- **Couche serveur** dans `lib/serveur/` (importe le client — **jamais côté client**) :
  - `db.ts` : connexion + helper `transaction`. Exige `DATABASE_URL`.
  - `auth.ts` : comptes prof (scrypt), sessions opaques.
  - `session-prof.ts` : `sessionProf()` / `refuserSiNonProf()` (garde pages & routes).
  - `evaluations.ts` : mode évaluation (correction /20).
  - `classes.ts` : classes & élèves (source de vérité).
- **Schéma** : source unique `lib/serveur/schema.sql`, appliqué par
  `npm run db:migrate` (idempotent). À rejouer après toute évolution.
- **Auth prof** : cookie httpOnly `rituelio_prof`, mot de passe **haché en base**
  (jamais en clair côté client). L'**espace prof** (`/prof`, `/classe`, API prof)
  est protégé **côté serveur** ; l'**espace élève** reste public. Un seul compte
  pour l'instant, mais la table accepte déjà le multi-comptes.
- **Cloisonnement** : chaque donnée prof/sensible porte un `user_id` et est filtrée
  par propriétaire.
- **Variables d'environnement** (`.env.local`, cf. `.env.example`) : `DATABASE_URL`
  (obligatoire), `PROF_MOT_DE_PASSE` (amorçage du compte au 1er login),
  `CLE_INSCRIPTION` (optionnel, ouvre `/inscription`).
- **Classes/élèves** : source de vérité = backend (`/api/classes`). Un **miroir
  localStorage** est maintenu pour les jeux pas encore migrés (à migrer vers l'API).
- **« Ma classe »** : les tables existent (`creneaux`, `matieres`, `taches`,
  `notes_eleves`, `faits_comportement`, `consequences`, `prepas_cours`,
  `reglages_prof`, `trimestres`) — **l'UI viendra dans des PR ultérieures**.

Lancement local : voir le **README** (Postgres via Docker + `npm run db:migrate`).

## Modèle de données

Voir `data/jeux.ts` pour le type `Jeu` complet et des exemples. Toute nouvelle
fiche/jeu = un nouvel objet dans le tableau `jeux`.

## Conventions

- Code, textes d'interface et commentaires **en français**.
- Composants React en `PascalCase`, un fichier par jeu jouable.
- Commits Git **petits et fréquents**, en français (ex : « ajoute la carte du
  morpion des verbes »).
- Accessibilité : contrastes corrects, navigation au clavier, libellés clairs.
- Avancer **par petites étapes** : une fonctionnalité à la fois, vérifiée avant
  de passer à la suivante.

## Feuille de route

1. Échafaudage Next.js + Tailwind ; layout (menu latéral + grille).
2. Catégories + grille de cartes alimentées par `data/jeux.ts`.
3. Page de détail « fiche » avec onglets (Déroulé / Plus d'infos & Aide).
4. Premier jeu « jouable » (ex : le morpion des verbes).
5. Recherche + filtre par catégorie.
6. Mise en ligne (Vercel).
7. Itérations : nouveaux jeux, page d'accueil publique, etc.

## Conventions de travail (toujours appliquer)

- Branche `vinth`, à jour de `main` avant de commencer. Commits clairs, push,
  PR vers `main`. **NE JAMAIS merger** : le prof relit et merge.
- Lire `AGENTS.md` (Next 16 : breaking changes).
- Tailwind v4 : jamais de classes construites dynamiquement.
- Respecter le thème clair/sombre (next-themes) et le style du projet
  (cartes arrondies, Fredoka/Nunito, couleurs via `lib/couleurs.ts`).
- Toutes les données de l'espace prof et de « Ma classe » sont servies
  uniquement aux requêtes authentifiées (élèves mineurs, RGPD).
- Les specs des grandes fonctionnalités vivent dans `docs/`
  (`brief-ma-classe.md` = plan par PR de la catégorie « Ma classe »).
