# Rituelio

> Sélecteur de jeux et de rituels pour la classe de langue (français, collège & primaire).

Rituelio aide l'enseignant à choisir et lancer un **rituel** (jeu ou activité courte)
en classe. Une page d'accueil sépare deux usages :

- **Espace prof** — le catalogue ludique complet (onglets par rituel, rituel « à la une »,
  cartes colorées), avec l'aide pédagogique et un **mode projection** pour le tableau.
- **Espace élève** — la même liste, simplifiée et agrandie, sans les informations réservées
  au prof : l'élève ouvre un jeu et voit **comment y jouer**.

> Le catalogue de jeux est édité à la main dans `data/jeux.ts`. Les données
> dynamiques (comptes prof, évaluations, classes/élèves) vivent dans un **backend
> Postgres** ; l'espace prof est protégé par une **vraie connexion côté serveur**,
> l'espace élève reste public.

## Fonctionnalités

- **Accueil** : choix Espace prof / Espace élève.
- **Espace prof** (`/prof`) : onglets de filtrage par rituel, tuile « rituel à la une »,
  grille de cartes, accès aux **classes**, bouton **Projeter** par jeu.
- **Espace élève** (`/eleve`) : gros boutons, navigation simple, sans infos prof.
- **Fiche de jeu** (`/jeux/[id]`) : matériel, déroulé, variantes ; l'onglet
  « Plus d'infos / Aide » (objectifs, conseils) n'apparaît **que côté prof**.
- **Mode projection** (`/jeux/[id]/projeter`) : plein écran, fort contraste, gros
  caractères, déroulé une étape à la fois (navigation au clavier).
- **Gestion des classes** (`/classe`) : classes et élèves, enregistrés sur le
  **backend** (source de vérité ; un miroir `localStorage` sert les jeux pas
  encore migrés).
- **Thème clair / sombre** et identité visuelle (police Nunito, couleur turquoise, logo).

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) · police **Nunito** (`next/font`)
- [next-themes](https://github.com/pacocoursey/next-themes) (thème clair/sombre)
- Catalogue en fichiers (`data/jeux.ts`) ; **backend Postgres** (client
  [`postgres`](https://github.com/porsager/postgres)) pour les données dynamiques.

## Démarrage

```bash
npm install                       # dépendances

# Postgres local (Docker) — port 5433 pour ne pas gêner un Postgres existant
docker run -d --name rituelio-pg \
  -e POSTGRES_USER=rituelio -e POSTGRES_PASSWORD=rituelio -e POSTGRES_DB=rituelio \
  -p 5433:5432 postgres:16-alpine

cp .env.example .env.local        # puis renseigner DATABASE_URL + PROF_MOT_DE_PASSE
npm run db:migrate                # crée les tables
npm run dev                       # serveur de développement
```

Puis ouvrir **http://localhost:3000**. En local, `.env.local` contient par exemple
`DATABASE_URL=postgres://rituelio:rituelio@localhost:5433/rituelio`.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Développement (rechargement à chaud) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | Vérifie le code (ESLint) |
| `npm run db:migrate` | Applique le schéma Postgres (`lib/serveur/schema.sql`) |

## Authentification prof

L'**espace prof** (pages `/prof`, `/classe`, jeux réservés, et l'API des évaluations) est
protégé **côté serveur** par un mot de passe. L'**espace élève** (`/eleve`, `/rejoindre`,
jeux ouverts) reste librement accessible.

- **Définir le mot de passe (1ʳᵉ fois)** : copier `.env.example` en `.env.local` et renseigner
  `PROF_MOT_DE_PASSE`. Au **premier login**, ce mot de passe est haché (scrypt) et enregistré
  dans la base (`prof_users`). Le mot de passe en clair ne quitte jamais le serveur.
- **Changer le mot de passe ensuite** : se connecter, puis aller sur **`/prof/reglages`**
  (lien « ⚙️ Réglages » dans l'espace prof) → le nouveau mot de passe est re-haché en base,
  sans redémarrage.
- **Connexion / déconnexion** : cliquer « Espace prof » ouvre un formulaire (**nom d'utilisateur
  + mot de passe**) si l'on n'est pas connecté ; la session est maintenue par un cookie `httpOnly`
  (30 jours) ; le bouton « Se déconnecter » apparaît dans l'en-tête une fois connecté. Le compte
  amorcé par `PROF_MOT_DE_PASSE` a pour identifiant **`prof`**.
- **Créer d'autres comptes** : page **`/inscription`** (email + nom d'utilisateur + mot de passe),
  protégée par un **code d'inscription** secret (variable d'env `CLE_INSCRIPTION`). Sans cette
  variable, l'inscription est désactivée. À la création, le compte est connecté automatiquement.

> La base est un **Postgres** défini par `DATABASE_URL`. En production, viser un
> Postgres managé (**Neon** / **Vercel Postgres**) et appliquer le schéma une fois
> avec `npm run db:migrate`. (Un fichier SQLite local ne persisterait pas sur Vercel.)

## Structure du projet

```
app/
  layout.tsx                  Coquille : en-tête (logo + thème)
  page.tsx                    Accueil : choix Espace prof / Espace élève
  prof/page.tsx               Espace prof (catalogue ludique)
  eleve/page.tsx              Espace élève (liste simplifiée)
  jeux/[id]/page.tsx          Fiche d'un jeu
  jeux/[id]/projeter/page.tsx Mode projection (affichage classe)
  classe/page.tsx             Gestion des classes
components/
  EnTete, Logo, BoutonTheme, Providers      En-tête, logo, thème
  BasculeEspace                              Retour accueil + bascule prof/élève
  Catalogue, BarreOnglets, TuileALaUne,
  GrilleJeux, CarteJeu, CarteNouveauJeu, Badge   Interface prof
  CarteJeuEleve                              Carte simplifiée (élève)
  VueProjection                              Vue plein écran pour le tableau
  classe/                                    Gestion des classes
data/jeux.ts                  Catalogue des jeux (type Jeu + données)
lib/                          categories, couleurs, classes, evaluation-types
lib/serveur/                  backend Postgres (db, auth, evaluations, classes)
lib/serveur/schema.sql        schéma unique appliqué par `npm run db:migrate`
```

## Ajouter un jeu

1. Ouvrir `data/jeux.ts`.
2. Copier un objet existant du tableau `jeux` et adapter ses champs
   (`id`, `titre`, `categorie`, `type`, `resume`, `icone`, `couleur`,
   `materiel`, `deroule`, `variantes`, `objectifs`, `aide`…).
3. La fiche, l'espace prof, l'espace élève et la projection se mettent à jour
   automatiquement. (Pour ajouter une catégorie : son slug dans `data/jeux.ts`,
   son libellé dans `lib/categories.ts`.)

## Captures d'écran

_À compléter : dépose tes captures dans `docs/` puis décommente les lignes ci-dessous._

<!-- ![Accueil](docs/accueil.png) -->
<!-- ![Espace prof](docs/espace-prof.png) -->
<!-- ![Mode projection](docs/projection.png) -->

## En savoir plus

- Cadrage du projet : [`CLAUDE.md`](./CLAUDE.md)
- Feuille de route : [`ROADMAP.md`](./ROADMAP.md)
