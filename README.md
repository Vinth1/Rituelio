# Rituelio 🎲

> Sélecteur de jeux et de rituels pour la classe de langue (français, collège & primaire).

Rituelio répertorie des jeux et activités pour l'enseignement des langues.
L'interface fonctionne comme un **sélecteur de jeux** : l'enseignant choisit un
jeu dans une grille de cartes, organisée par catégorie (« rituels » de classe).

Deux types de jeux cohabitent :

- **Fiche** — un jeu décrit (règles, matériel, déroulé), sans interaction.
- **Jouable** — un mini-jeu interactif dans le navigateur (composant React).

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- Données dans des fichiers (pas de base de données) : `data/jeux.ts`
- Déploiement visé : [Vercel](https://vercel.com/)

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent (développé avec Node 24).

## Démarrage

```bash
npm install      # installe les dépendances (uniquement la première fois)
npm run dev      # lance le serveur de développement
```

Puis ouvrir **http://localhost:3000** dans le navigateur.

Autres commandes utiles :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement (rechargement à chaud) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | Vérifie le code avec ESLint |

## Structure du projet

```
app/                    Pages et layout (App Router)
  layout.tsx            Coquille : menu latéral + zone principale
  page.tsx              Accueil : en-tête + grille de jeux
components/             Composants d'interface
  MenuLateral.tsx       Menu des catégories (rituels)
  GrilleJeux.tsx        Grille de cartes
  CarteJeu.tsx          Une carte de jeu
  CarteNouveauJeu.tsx   Carte « + Nouveau jeu »
  Badge.tsx             Badge « Fiche » / « Jouable »
  jeux/                 (à venir) composants des jeux jouables
data/
  jeux.ts               Catalogue des jeux (type Jeu + données)
lib/
  categories.ts         Libellés et ordre des catégories
  couleurs.ts           Couleurs d'accent → classes Tailwind
```

## Ajouter un jeu

1. Ouvrir `data/jeux.ts`.
2. Copier un objet existant du tableau `jeux` et adapter ses champs
   (`id`, `titre`, `categorie`, `type`, `resume`, `icone`, `couleur`…).
3. Pour un jeu **jouable** : créer le composant dans `components/jeux/`
   et indiquer son nom dans le champ `composant`.

Pour ajouter une **catégorie** (rituel) : ajouter son slug au type
`CategorieJeu` dans `data/jeux.ts`, puis son libellé dans `lib/categories.ts`.

## Déploiement

Sur Vercel : importer le dépôt GitHub ; le site est reconstruit
automatiquement à chaque push sur `main`.

## En savoir plus

Le cadrage détaillé du projet (objectif, périmètre du MVP, conventions et
feuille de route) se trouve dans [`CLAUDE.md`](./CLAUDE.md).
