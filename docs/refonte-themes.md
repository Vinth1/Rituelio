# Claude Code — Refonte visuelle Rituelio : mode jour « Bonbon Pop » / mode nuit « Tableau »

> **À coller dans une session Claude Code à la racine du dépôt Rituelio.**
> Travaille sur la branche `vinth`. Procède **phase par phase** : à la fin de chaque
> phase, **arrête-toi** et laisse-moi valider visuellement (`npm run dev`) avant de
> continuer. Ne fusionne rien dans `main` toi-même.

---

## 0. Contexte et objectif

Rituelio (Next.js 16, Tailwind **v4** en config CSS-first via `@theme`, `next-themes`
qui pose une classe `.dark` sur `<html>`) a déjà un toggle clair/sombre **fonctionnel**,
mais le style est générique (`bg-slate-*`, `text-slate-*`, accent `teal`, police `Nunito`
unique).

On veut donner deux **identités** distinctes aux deux modes :

- **Mode jour = « Bonbon Pop »** : fond crème chaleureux, coins très arrondis, pastels
  gourmands, police titre **Fredoka** + corps **Nunito**, accent turquoise + orange.
- **Mode nuit = « Tableau »** : ardoise vert sombre type tableau d'école, contraste élevé,
  craie jaune/orange, police titre **Gochi Hand** + corps **Quicksand**, coins moins arrondis,
  bords pointillés façon craie.

**Principe directeur** : on NE touche pas au markup structurel ni à la logique. On remplace
les couleurs/polices/rayons codés en dur par des **tokens sémantiques** déclarés une fois
dans `app/globals.css`, qui basculent automatiquement via `.dark`. Les noms restent **en
français**, cohérents avec le code existant (`--color-principal`, etc.).

### À lire avant de commencer
- `CLAUDE.md` et `AGENTS.md` (conventions du projet)
- `app/globals.css`, `app/layout.tsx`, `components/Providers.tsx` (le câblage thème actuel)
- `lib/couleurs.ts` (mapping accent jeu → classes, déjà avec variantes sombres)

---

## ⚠️ Piège n°1 Tailwind v4 — à respecter absolument

Pour qu'un token change selon le thème, il faut :

1. Le déclarer dans un bloc **`@theme` NON-inline** (pas `@theme inline`). Tailwind émet
   alors une vraie variable CSS dans `:root` ET génère l'utilitaire (`bg-fond`, `text-encre`,
   `rounded-carte`, `font-titre`…).
2. Le **redéfinir sous `.dark`** dans un bloc CSS normal :

```css
@theme {
  --color-fond: #fbf7f2;            /* mode jour */
}
.dark {
  --color-fond: #1c3b32;            /* mode nuit (cascade : remplace la valeur de :root) */
}
```

Comme l'utilitaire `bg-fond` compile en `background-color: var(--color-fond)`, la valeur
sombre prend le dessus dans tout le sous-arbre `.dark`. Le `@custom-variant dark` est déjà
présent dans `globals.css`, on le garde.

> **Ne PAS utiliser `@theme inline` pour les tokens qui doivent basculer** : l'inline « fige »
> la valeur au build et casse la cascade. (Le `@theme inline { --font-sans … }` existant peut
> rester pour la rétro-compat, mais on n'y touche pas pour le switch.)

---

## Jeu de tokens (valeurs exactes des deux thèmes)

À déclarer dans `@theme` (= valeurs **mode jour / Bonbon Pop**) puis à surcharger dans `.dark`
(= valeurs **mode nuit / Tableau**).

| Token                       | Rôle                              | Jour — Bonbon Pop                                   | Nuit — Tableau                                      |
|-----------------------------|-----------------------------------|-----------------------------------------------------|-----------------------------------------------------|
| `--color-fond`              | fond de page                      | `#fbf7f2`                                            | `#1c3b32`                                            |
| `--color-surface`           | cartes, en-tête, barres           | `#ffffff`                                            | `#234a3f`                                            |
| `--color-encre`             | texte principal                   | `#26314f`                                            | `#f4f1e6`                                            |
| `--color-encre-douce`       | texte secondaire                  | `#8a93a8`                                            | `#a7c0b5`                                            |
| `--color-principal`         | accent marque (déjà existant)     | `#15a88f`                                            | `#f4d35e` (craie jaune)                              |
| `--color-principal-fonce`   | survol / texte accent             | `#0d8064`                                            | `#e9bf3f`                                            |
| `--color-principal-clair`   | fonds doux accent / badge         | `#d9f6ec`                                            | `#2f5a4d`                                            |
| `--color-sur-principal`     | texte posé SUR l'accent           | `#ffffff`                                            | `#27331f`                                            |
| `--color-accent`            | accent chaud (bannière)           | `#ef7d12`                                            | `#ee964b`                                            |
| `--color-ligne`             | bordures, séparateurs             | `#efe7dc`                                            | `#356257`                                            |
| `--color-badge`             | fond pastille « Jouable »         | `#d9f6ec`                                            | `#2f5a4d`                                            |
| `--color-badge-encre`       | texte pastille                    | `#0d8064`                                            | `#f4d35e`                                            |
| `--rayon-carte`             | coins cartes / bannière           | `24px`                                               | `14px`                                               |
| `--rayon-moyen`             | coins boutons / pastilles         | `16px`                                               | `10px`                                               |
| `--font-titre`              | police d'affichage                | `var(--font-fredoka)`                                | `var(--font-gochi)`                                  |
| `--font-corps`              | police de lecture                 | `var(--font-nunito)`                                 | `var(--font-quicksand)`                              |
| `--degrade-banniere`        | fond bannière « à la une »        | `linear-gradient(135deg,#ff9233,#e8650b)`            | `linear-gradient(135deg,#ee964b,#cf6f2a)`            |
| `--texture-fond`            | texture de page (subtile)         | `radial-gradient(circle at 12% 18%,rgba(21,168,143,.06),transparent 38%), radial-gradient(circle at 88% 8%,rgba(239,125,18,.07),transparent 34%)` | `radial-gradient(circle at 30% 20%,rgba(255,255,255,.04),transparent 40%), radial-gradient(circle at 80% 80%,rgba(255,255,255,.03),transparent 40%)` |

> Remarque accessibilité : ces paires ont été pensées pour un contraste correct (AA pour le
> texte courant). En Phase 5, **vérifie** `--color-encre-douce` sur `--color-fond` dans les
> deux modes et ajuste si < 4.5:1 pour le texte normal.

---

## Phase 1 — Fondations du design system

**Fichiers : `app/layout.tsx`, `app/globals.css`.**

1. Dans `app/layout.tsx`, charge les 3 polices manquantes via `next/font/google`, en plus de
   Nunito déjà présente, et expose leurs variables sur `<html>` :
   - `Fredoka` → `variable: "--font-fredoka"` (subset latin, poids 400–700)
   - `Gochi_Hand` → `variable: "--font-gochi"` (poids 400)
   - `Quicksand` → `variable: "--font-quicksand"` (poids 400–700)
   - Ajoute toutes les `*.variable` à la `className` de `<html>` (à côté de `nunito.variable`).
2. Dans `app/globals.css` :
   - Déclare **tous les tokens du tableau** dans le bloc `@theme` (valeurs jour) — y compris
     en remplaçant les `--color-principal*` actuels par les nouvelles valeurs jour.
   - Ajoute le bloc `.dark { … }` avec **toutes** les surcharges nuit.
   - Mets le `body` sur les tokens :
     ```css
     body {
       font-family: var(--font-corps), system-ui, sans-serif;
       background-color: var(--color-fond);
       background-image: var(--texture-fond);
       color: var(--color-encre);
     }
     ```
   - Ajoute une transition douce de thème (≈ 200 ms) sur `background-color` et `color`, mais
     **enveloppe-la dans `@media (prefers-reduced-motion: no-preference)`**.
3. Dans `app/layout.tsx`, remplace sur `<body>` les classes `bg-slate-50 text-slate-800
   dark:bg-slate-950 dark:text-slate-200` par `bg-fond text-encre` (le `body` CSS gère déjà
   fond + texte ; garde-en une seule source de vérité, supprime les classes redondantes).

**Critères de validation (à me montrer avant Phase 2)**
- `npm run dev` démarre sans erreur, `npm run lint` passe.
- Basculer le bouton thème change **le fond de page et la police de tout le site** :
  crème + Fredoka/Nunito en jour, ardoise verte + Gochi/Quicksand en nuit.
- Aucun warning d'hydratation en console.

---

## Phase 2 — Chrome partagé (en-tête, navigation, pastilles)

**Fichiers : `components/EnTete.tsx`, `components/Logo.tsx`, `components/BoutonTheme.tsx`,
`components/BasculeEspace.tsx`, `components/BarreOnglets.tsx`, `components/Badge.tsx`, et les
wrappers de pages `app/page.tsx`, `app/prof/page.tsx`, `app/eleve/page.tsx`,
`app/classe/page.tsx`.**

Règle de conversion (à appliquer partout) :

| Codé en dur actuel                                  | Remplacer par                                  |
|-----------------------------------------------------|------------------------------------------------|
| `bg-white` / `dark:bg-slate-*` (fond élément)       | `bg-surface`                                   |
| `border-slate-200` / `dark:border-slate-*`          | `border-ligne`                                 |
| `text-slate-800` / `dark:text-slate-100`            | `text-encre`                                   |
| `text-slate-400/500` / `dark:text-slate-400`        | `text-encre-douce`                             |
| `ring-principal` / `text-principal`                 | inchangé (le token bascule déjà)               |
| `rounded-2xl` / `rounded-3xl` (conteneurs)          | `rounded-carte`                                |
| `rounded-lg` (boutons/pastilles)                    | `rounded-moyen`                                |
| `rounded-full` (pills onglets)                      | inchangé (pills dans les deux thèmes)          |

Détails :
- **EnTete** : `bg-surface/80 backdrop-blur border-b border-ligne`. Retire les variantes
  `dark:` devenues inutiles.
- **Logo** : le mot « rituelio » passe en `font-titre` et `text-encre` (retire
  `text-slate-900 dark:text-white`). La bulle reste `text-principal`.
- **BoutonTheme** : `bg-surface border-ligne hover:bg-fond`. (Optionnel : `title` /
  `aria-label` plus parlants — « Passer en mode Tableau (nuit) » / « Passer en mode Bonbon
  (jour) ».)
- **BasculeEspace** (onglet prof/élève) : conteneur `bg-surface border-ligne`, onglet actif
  `bg-principal text-sur-principal`, inactif `text-encre-douce`.
- **BarreOnglets** (filtres catégories) : pills inactives `bg-surface text-encre border-ligne`,
  pill active `bg-principal text-sur-principal`.
- **Badge** : `bg-badge text-badge-encre`.
- Tous les **titres** (`h1`/`h2`/`h3`) du chrome reçoivent `font-titre`.

**Validation** : en-tête, bascule prof/élève, filtres et pastilles cohérents dans les deux
modes ; titres en Fredoka (jour) / Gochi (nuit).

---

## Phase 3 — Catalogue, cartes et bannière « à la une »

**Fichiers : `components/CarteJeu.tsx`, `components/CarteJeuEleve.tsx`,
`components/CarteNouveauJeu.tsx`, `components/GrilleJeux.tsx`, `components/TuileALaUne.tsx`,
`lib/couleurs.ts`.**

1. **CarteJeu / CarteJeuEleve** : appliquer la table de conversion de la Phase 2.
   - Conteneur : `rounded-carte border-ligne bg-surface`.
   - Titre `h3` : ajouter `font-titre`, couleur `text-encre`.
   - Résumé : `text-encre-douce`.
   - Durée : `text-encre-douce`.
   - Séparateur du bas : `border-ligne`.
   - Bouton « ▶ Projeter » : `bg-badge text-badge-encre rounded-moyen
     hover:bg-principal hover:text-sur-principal`.
2. **CarteNouveauJeu** (carte pointillée) : `border-2 border-dashed border-ligne text-encre-douce
   rounded-carte hover:border-principal hover:text-principal`.
3. **TuileALaUne** (bannière) : remplace `couleurBanniere(jeu.couleur)` par un fond piloté par
   le thème :
   ```tsx
   <section
     className="overflow-hidden rounded-carte p-6 text-white shadow-sm sm:p-8"
     style={{ backgroundImage: "var(--degrade-banniere)" }}
   >
   ```
   Titre en `font-titre`. (Choix assumé conforme à la maquette : la bannière est orange dans
   les deux modes, indépendante de l'accent du jeu mis en avant. Laisse un commentaire
   indiquant comment revenir à un dégradé par accent si je le souhaite plus tard.)
4. **`lib/couleurs.ts`** : la bande colorée d'en-tête de carte garde le système actuel
   (pastels `*-100` en jour, tons `*-400/15` en nuit) — il fonctionne déjà dans les deux modes.
   Vérifie seulement le rendu visuel ; ajuste l'alpha sombre si une bande « bave » trop sur le
   fond ardoise. **Ne supprime pas** la fonction `couleurBanniere` (encore utilisée ailleurs ?
   vérifie les usages avant toute suppression).

**Validation** : l'écran « Espace prof » ressemble à la maquette Bonbon Pop en jour, et bascule
en Tableau craie en nuit, cartes + bannière comprises.

---

## Phase 4 — Vue projection et écrans de jeu

**Fichiers : `components/VueProjection.tsx`, `components/jeux/*.tsx`
(`MotDuJour`, `QuizCulture`, `DefiLecture`, `Pendu`, `ChaineLexicale`),
`app/jeux/[id]/page.tsx`, `app/jeux/[id]/projeter/page.tsx`.**

1. **VueProjection** — décision pédagogique : la vue plein écran est destinée au
   **vidéoprojecteur / TBI**. Elle doit utiliser la palette **Tableau (sombre, fort contraste)
   QUELLE QUE SOIT** le mode jour/nuit choisi dans l'app (projeter un fond crème clair au
   beamer fatigue les yeux et délave les couleurs).
   - Force le conteneur racine en classe `dark` (ex. `<div className="dark fixed inset-0 …">`)
     OU code-le directement sur les tokens nuit. Le plus simple : ajouter `dark` sur le
     conteneur racine, puis remplacer `bg-slate-900 text-white` par `bg-fond text-encre`, et
     les `bg-white/10`, `text-slate-300/400`, `text-principal` par les tokens
     (`bg-surface`, `text-encre-douce`, `text-principal`). Ainsi la vue reste « tableau » même
     en mode jour.
   - Conserve la navigation clavier et la logique inchangées.
2. **components/jeux/*** : passe de conversion de tokens (table Phase 2), titres en `font-titre`.
   Ces écrans doivent rester lisibles dans les deux modes hors projection (l'élève peut jouer
   sur son poste).

**Validation** : « ▶ Projeter » donne un rendu Tableau sombre net en jour **comme** en nuit ;
les écrans de jeu en navigation normale suivent bien le thème actif.

---

## Phase 5 — Finitions, accessibilité, QA

1. **Contraste** : vérifie en jour et en nuit que texte courant et texte secondaire atteignent
   AA (≥ 4.5:1 ; ≥ 3:1 pour les gros titres). Ajuste les hex `--color-encre-douce` si besoin.
2. **Focus visible** : `focus-visible:ring-principal` reste lisible sur `--color-fond` dans les
   deux modes (en nuit, l'anneau jaune craie sur ardoise doit ressortir).
3. **Mouvement** : toutes les transitions de thème/hover sous
   `@media (prefers-reduced-motion: no-preference)`.
4. **Cohérence des polices** : aucun titre n'est resté en police par défaut ; aucun corps de
   texte n'est en Fredoka/Gochi.
5. **Nettoyage** : recherche les `slate-`, `teal-`, `bg-white`, `text-white` résiduels
   (`rg "slate-|teal-|bg-white|text-white" app components`) ; soit ils sont volontaires (vue
   projection, texte blanc sur bannière), soit on les passe en tokens.
6. **QA finale** : capture l'écran « Espace prof », l'espace élève et une vue projection dans
   les **deux** modes, et montre-les-moi.

---

## Garde-fous (ne pas faire)

- Ne renomme/casse pas le câblage `next-themes` existant (attribut `class`, `defaultTheme`,
  `enableSystem`) ni le `suppressHydrationWarning`.
- N'introduis pas de dépendance nouvelle (tout se fait avec Tailwind v4 + `next/font`).
- Ne passe pas les tokens switchables en `@theme inline`.
- Ne crée pas de classes Tailwind dynamiques (`bg-${x}-100`) — interdit en v4 (voir
  `lib/couleurs.ts`).
- Garde les noms de variables et de composants **en français**.
- N'effectue aucun `git merge`/PR vers `main` : je valide chaque phase, puis je gère le flux
  `vinth → PR → main` moi-même.

## Flux Git (rappel, à exécuter par moi)
```powershell
git checkout vinth
# … phase réalisée par Claude Code, je valide via npm run dev …
git add -A
git commit -m "feat(themes): mode jour Bonbon Pop / nuit Tableau — phase N"
```

---

### Démarrage attendu
> Commence par la **Phase 1 uniquement**. Quand elle est prête et que `npm run dev` tourne,
> résume ce que tu as changé et **attends ma validation** avant la Phase 2.
