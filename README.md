# Rituelio

> Sélecteur de jeux et de rituels pour la classe de langue (français, collège & primaire).

Rituelio aide l'enseignant à choisir et lancer un **rituel** (jeu ou activité courte)
en classe. Une page d'accueil sépare deux usages :

- **Espace prof** — le catalogue ludique complet (onglets par rituel, rituel « à la une »,
  cartes colorées), avec l'aide pédagogique et un **mode projection** pour le tableau.
- **Espace élève** — la même liste, simplifiée et agrandie, sans les informations réservées
  au prof : l'élève ouvre un jeu et voit **comment y jouer**.

> v1 **locale** : pas de mise en ligne, pas de comptes, pas de base de données. Le contenu
> est édité à la main dans `data/jeux.ts`. La séparation prof/élève est un simple choix
> d'interface (pas une connexion sécurisée).

## Fonctionnalités

- **Accueil** : choix Espace prof / Espace élève.
- **Espace prof** (`/prof`) : onglets de filtrage par rituel, tuile « rituel à la une »,
  grille de cartes, accès aux **classes**, bouton **Projeter** par jeu.
- **Espace élève** (`/eleve`) : gros boutons, navigation simple, sans infos prof.
- **Fiche de jeu** (`/jeux/[id]`) : matériel, déroulé, variantes ; l'onglet
  « Plus d'infos / Aide » (objectifs, conseils) n'apparaît **que côté prof**.
- **Mode projection** (`/jeux/[id]/projeter`) : plein écran, fort contraste, gros
  caractères, déroulé une étape à la fois (navigation au clavier).
- **Gestion des classes** (`/classe`) : classes et élèves, en `localStorage`.
- **Thème clair / sombre** et identité visuelle (police Nunito, couleur turquoise, logo).

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) · police **Nunito** (`next/font`)
- [next-themes](https://github.com/pacocoursey/next-themes) (thème clair/sombre)
- Données dans des fichiers (`data/jeux.ts`) — pas de base de données.

## Démarrage

```bash
npm install   # la première fois
npm run dev    # serveur de développement
```

Puis ouvrir **http://localhost:3000**.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Développement (rechargement à chaud) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | Vérifie le code (ESLint) |

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

> ⚠️ La base est un fichier SQLite local (`.data/`). Sur un hébergement *serverless* (Vercel),
> ce fichier est éphémère : viser un hébergement persistant pour conserver compte et évaluations.

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
lib/                          categories, couleurs, classes
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
