# Brief — Dictée du jour

> **État d'avancement** : PR 1 (socle serveur) livrée. Prochaine étape : PR 2
> (espace prof : dépôt, tags et recherche), puis PR 3 (jeu de correction collective).

## Contexte

Le prof n'a aujourd'hui aucun endroit où déposer ses textes de dictée : le catalogue
(`data/jeux.ts`) est en dur dans le code, et la seule dictée qui ait existé était une fiche
de méthode (`dictee-negociee`, retirée au commit `56dc44a`). Le besoin est double :

1. **Déposer et retrouver** ses dictées — texte saisi à la main, étiqueté par des hashtags
   pédagogiques (`#imparfait`, `#passé-composé`, `#compléments-circonstanciels`,
   `#adjectifs`…), puis recherché par ces tags au moment de préparer la séance.
2. **Corriger collectivement au tableau** — le prof projette, les élèves épellent les mots
   un par un, et l'outil dit si l'orthographe est juste en s'appuyant sur le texte source.

Aucun système de tags ni aucune recherche n'existait dans le projet : les deux sont créés
ici, mais en calquant des patrons déjà éprouvés (verbes perso pour le CRUD prof,
`SelecteurVerbe` pour la combobox, `ChaineLexicale` pour l'écran de jeu projeté).

## Décisions validées

1. **Correction mixte** : champ de saisie de l'épellation **et** boutons ✅/❌ pour aller
   vite. Le prof choisit au fil de la dictée — saisir garde la trace exacte de l'erreur.
2. **Tags libres** avec autocomplétion sur les tags déjà utilisés. Pas de référentiel figé :
   ajouter une notion ne doit pas demander une modification du code.
3. **Deux surfaces** : la banque se gère dans l'espace prof (`/prof/dictees`), la correction
   est une carte du catalogue (`/jeux/dictee-du-jour`, catégorie `orthographe`).
4. **Un seul écran projeté** : le texte reste masqué et chaque mot se révèle à mesure qu'il
   est corrigé. Pas de vue prof séparée à synchroniser.
5. **Parcours = tous les mots**, dans l'ordre du texte, avec un bouton « Passer » pour les
   mots évidents. Rien à préparer en amont, aucun marquage des mots pièges.
6. **Comparaison tolérante** : casse et accents ignorés à la comparaison, car l'élève épelle
   à l'oral sans annoncer « E accent aigu ». La graphie exacte reste affichée.
7. **Aucune persistance de la correction** : l'état vit en mémoire le temps de la séance,
   comme `ChaineLexicale`. Un bilan des mots ratés s'affiche à la fin.

## Architecture

### Modèle de données (`lib/serveur/schema.sql`)

- **`dictees`** — `id`, `user_id`, `titre`, `texte`, `tags TEXT[]`, `created_at`,
  `updated_at`. Index `idx_dictees_user` et **`idx_dictees_tags` (GIN)**, ce dernier servant
  le `tags @> …` de la recherche. Premier GIN du projet ; `TEXT[]` avait déjà un précédent
  avec `prepas_cours.activites_rituelio`.

Le texte est stocké **brut**, tel que saisi : le découpage en mots est refait à l'affichage,
si bien qu'une amélioration du découpage profite aux dictées déjà déposées.

### Logique pure (`lib/dictee.ts`, testée)

Même séparation que le module Épreuves : le testable dans `lib/`, le SQL dans `lib/serveur/`.

- `decouperEnMots(texte): MotDictee[]` — un mot = suite de lettres/chiffres liées par des
  apostrophes ou traits d'union internes (`l'orage` et `peut-être` comptent chacun pour un
  mot). Chaque mot porte son `avant` et son `apres` : **concaténer les trois champs de tous
  les mots redonne le texte à l'identique**, ce qui permet à la vue de correction de
  réafficher le texte entier en ne masquant que les mots pas encore traités.
- `comparerEpellation(saisie, attendu): boolean` — apostrophes typographiques unifiées,
  espaces retirés (le prof peut taper `d e v i n t`), traits d'union retirés **seulement si
  le mot attendu n'en contient pas**, puis comparaison via `normaliserReponse` de
  `lib/epreuves/texte.ts` avec `ignorerAccents` et `ignorerCasse`.
- `normaliserTag` / `normaliserTags` / `replierTag` — minuscules, `#` retiré, espaces en
  traits d'union, **accents conservés** (le tag est aussi son libellé affiché : `#passé-composé`
  se lit mieux que `#passe-compose`), dédoublonnage, 32 caractères et 12 tags maximum.
  `replierTag` donne la forme sans accent, pour que taper `passe` propose `#passé-composé`.

### Accès aux données (`lib/serveur/dictees.ts`)

Calqué sur `lib/serveur/verbes-perso.ts` : validation `lireDicteeEntrante(brut: unknown)`,
`userId` en premier paramètre de toutes les fonctions, filtre `user_id` y compris sur les
accès par id. Le filtre de recherche tient en **une requête**, sans composer de SQL à la
volée : `AND (${tags}::text[] = '{}'::text[] OR tags @> ${tags}::text[])` neutralise le
critère quand aucun tag n'est demandé.

### Routes API

| Route | Méthodes |
|---|---|
| `app/api/dictees/route.ts` | `GET` (`?tags=` en CSV, `?q=` sur le titre), `POST` → `201 { dictee }` |
| `app/api/dictees/[id]/route.ts` | `GET`, `PUT`, `DELETE` → `404 { erreur: "Dictée introuvable" }` |
| `app/api/dictees/tags/route.ts` | `GET` → `{ tags: [{ tag, n }] }`, les plus fréquents d'abord |

## Réutilisation de l'existant

- `normaliserReponse` (`lib/epreuves/texte.ts`) — comparaison casse/accents.
- `sessionProf()` (`lib/serveur/session-prof.ts`) — garde des routes et des pages.
- `components/conjugaison/SelecteurVerbe.tsx` — modèle de combobox ARIA pour `ChampTags`.
- `components/conjugaison/FormVerbePerso.tsx` — états `enCours` / `erreur` d'un formulaire.
- `components/BarreOnglets.tsx` — pastilles `aria-pressed` pour les filtres par tag.
- `components/jeux/ChaineLexicale.tsx` — machine à phases d'un jeu projeté ; `DefiLecture.tsx`
  pour le tirage d'élève ; `Pendu.tsx` pour l'épellation.
- `lib/classes.ts` + `GET /api/classes` — liste des élèves.

## Contraintes projet

- **Next 16** : `params` et `searchParams` sont des `Promise` ; `export const dynamic =
  "force-dynamic"` sur les routes.
- `lib/serveur/**` n'est **jamais** importé côté client ; `lib/dictee.ts` reste pur.
- Tailwind v4 : jamais de classe construite dynamiquement ; tokens sémantiques
  (`bg-surface`, `text-encre`, `border-ligne`, `rounded-carte`…) plutôt que des couleurs brutes.
- Les dictées sont des données prof : servies uniquement aux requêtes authentifiées.

## Découpage en PR

**PR 1 — socle serveur ✅** `docs/brief-dictees.md`, table `dictees`, `lib/dictee.ts` +
`lib/dictee.test.mts` (22 tests), `lib/serveur/dictees.ts`, les trois routes `app/api/dictees/**`.

**PR 2 — espace prof : dépôt et recherche.** `app/prof/dictees/**` (layout gardé, liste,
éditeur), `components/dictees/{ListeDictees,EditeurDictee,ChampTags}.tsx`, lien dans
`app/prof/page.tsx`.

**PR 3 — jeu de correction collective.** Entrée `dictee-du-jour` dans `data/jeux.ts`, ligne
dans `components/jeux/registre.ts`, `components/jeux/DicteeDuJour.tsx` (lancement →
correction → bilan).

## Points de vigilance

- `l'orage` compte pour **un** mot, apostrophe comprise dans la graphie à épeler. Si l'usage
  en classe montre qu'il en faut deux, c'est une ligne à changer dans `decouperEnMots`.
- Un trait d'union utilisé comme séparateur d'épellation (`p-e-u-t-ê-t-r-e`) est compté comme
  une vraie graphie quand le mot attendu contient déjà un trait d'union : dans ce cas le prof
  saisit le mot normalement.
- Deux tags ne différant que par les accents peuvent coexister ; l'autocomplétion propose
  d'abord l'existant, ce qui limite le risque.
- `/jeux/[id]/projeter` n'est pas protégée par `sessionProf()` (dette existante), mais
  `VueProjection` n'affiche que `jeu.deroule` et le texte des dictées vient d'une API
  authentifiée : aucun contenu ne fuite par là.

## Questions ouvertes (non bloquantes)

- Faut-il garder une trace des mots ratés d'une séance à l'autre (bilan par élève, mots à
  retravailler) ? Cela supposerait une table `dictee_seances` et sortirait du « rien à
  préparer, rien à retenir » retenu pour la v1.
- Le partage d'une dictée entre profs attendra le multi-comptes.
