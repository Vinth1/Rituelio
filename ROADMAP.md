# Rituelio — Feuille de route v1

## Objectif de la v1

Une première version **locale** et soignée, avec :

- une interface ludique et claire (le design retenu) ;
- un **écran d'accueil qui sépare l'espace Prof et l'espace Élève** ;
- **3 à 5 jeux** sous forme de fiches bien structurées (pas encore de jeux interactifs) ;
- un **mode d'affichage adapté à la projection** au tableau ;
- consultable sur les ordinateurs portables de l'école.

Pas de mise en ligne, pas de comptes, pas de base de données : tout tourne en
local (`npm run dev`), et le contenu est édité à la main dans `data/jeux.ts`.

## Déjà fait

- Projet Next.js + Tailwind, dépôt GitHub, flux branches + PR.
- Modèle de données `data/jeux.ts`.
- Première interface ludique (en cours via la branche `feat/interface-ludique`).

## Proposition d'identité visuelle (à valider)

- **Nom** : « Rituelio », en lettres rondes et minuscules, chaleureux.
- **Couleur principale** : un bleu-turquoise énergique (scolaire sans être enfantin).
- **Couleurs d'accent** : une par rituel (ambre, corail, vert, violet…), pour
  colorer les cartes — comme dans la maquette.
- **Logo** : une forme simple et mémorisable (par ex. un dé stylisé ou une bulle
  avec une étoile), géométrique et arrondie ; un SVG basique suffit pour démarrer.
- **Typographie** : une sans-serif arrondie et très lisible (ex. Nunito, Baloo
  ou Poppins), qui passe bien à la projection.
- **Ton général** : ludique mais ordonné — couleurs vives sur fond clair,
  beaucoup d'espace, coins arrondis.

## Les jalons (chacun = une branche + une PR)

### Jalon 1 — Identité & thème
- Valider la palette et la typo, puis les déclarer dans la config Tailwind
  (couleur principale + couleurs d'accent par rituel).
- Créer un logo simple (SVG).
- Appliquer la typo et les couleurs partout.

### Jalon 2 — Accueil & séparation Prof / Élève
- Page d'accueil de choix : deux grands boutons « Espace prof » et « Espace élève ».
- Deux routes : `/prof` et `/eleve`.
- Note : en v1 c'est un simple choix d'interface, pas une vraie connexion
  sécurisée. Un mot de passe prof pourra venir plus tard.

### Jalon 3 — Espace Prof (le sélecteur de jeux)
- Le design ludique : barre d'onglets par rituel + tuile « à la une » + grille
  de cartes colorées.
- Accès à toutes les infos d'un jeu, y compris l'onglet « Plus d'infos / Aide »
  (objectifs, conseils pédagogiques).
- Un bouton « Projeter » sur chaque jeu (voir Jalon 6).

### Jalon 4 — Espace Élève (version simplifiée)
- La même grille de jeux, mais épurée et plus grande : gros boutons, navigation
  simple, adaptée aux portables des élèves.
- On masque tout ce qui est réservé au prof (objectifs, conseils).
- L'élève ouvre un jeu et voit comment y jouer (règles / déroulé).

### Jalon 5 — Les fiches de jeux (le contenu)
- Page de fiche complète : titre, résumé, matériel, déroulé (étapes), variantes.
- Onglet « Plus d'infos / Aide » visible uniquement côté prof.
- Rédiger et saisir **3 à 5 vrais jeux** dans `data/jeux.ts`.

### Jalon 6 — Mode projection
- Une vue « affichage classe » : grands caractères, fort contraste, une étape à
  la fois si utile — pensée pour le tableau / TBI.

### Jalon 7 — Finitions v1
- Responsive vérifié (portables de l'école + projection).
- Accessibilité (contrastes, navigation clavier, tailles de texte).
- Navigation cohérente (retour à l'accueil, bascule prof/élève).
- Petit `README` avec quelques captures d'écran.
- Relecture générale.

## « Première bonne version » = quand…

- l'accueil propose Prof / Élève ;
- les deux espaces affichent joliment 3 à 5 jeux ;
- chaque jeu a une fiche claire (règles + variantes), avec l'aide pédagogique
  côté prof ;
- on peut projeter un jeu au tableau ;
- tout fonctionne en local sur un portable, et c'est agréable à regarder et à utiliser.

## Après la v1 (pour plus tard)

- Premiers jeux vraiment jouables (ex. le morpion des verbes).
- Mise en ligne (Vercel) + nom de domaine.
- Mot de passe / comptes prof, favoris, suivi des élèves.
- Recherche, et davantage de rituels.
