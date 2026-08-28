# Rituelio — Vision

> Document de cap. À lire avant tout cadrage de gros chantier.
> Résume ce que Rituelio EST, ce qu'il N'EST PAS, et l'ordre des chantiers.

## En une phrase

Rituelio est le **hub numérique de l'école** : une interface propre et
multilingue qui regroupe les outils du prof — rituels et jeux de classe,
gestion de l'année (« Ma classe »), évaluations, bibliothèque de ressources
prêtes à l'emploi, annotation privée de documents — et qui **orchestre les
plateformes existantes** (Vulkan, ClassDojo, Kahoot, Genially, Blooket,
YouTube…) au lieu de les réinventer.

## Non-objectifs (aussi importants que le reste)

- **Pas un ENT complet** : pas de messagerie parents, pas de vie scolaire
  officielle. L'appel reste sur Vulkan (obligation légale), la discipline
  officielle sur ClassDojo — Rituelio raccourcit le chemin vers eux.
- **Pas d'éditeur de diaporamas** : on fournit des supports prêts à
  l'emploi (téléchargeables) et on embarque les outils de création
  existants (Genially…) par lien/embed.
- **Pas d'hébergement de manuels** : jamais de stockage partagé d'œuvres
  sous droits. Uniquement le dépôt PRIVÉ par prof de ses propres
  ressources, pour annotation personnelle.

## Les 4 piliers

### 1. Multi-prof (échéance : rentrée 2026)
- Comptes profs individuels (l'auth serveur existe déjà : passer de 1 à N).
- Chaque donnée a un propriétaire : classes, notes, comportements,
  prépas, annotations sont cloisonnés par compte.
- **Page perso customisable** : système de favoris / outils épinglés
  (tuiles réordonnables), chaque prof compose son tableau de bord.
- Rôles simples au départ : prof / élève (admin plus tard).

### 2. Bibliothèque de ressources (remplissage progressif)
- Une entrée = des métadonnées : niveau (CP→4e), matière, compétence du
  programme, langue, type.
- Types : diaporama téléchargeable, fiche imprimable (PDF), quiz/éval
  Rituelio, lien externe organisé (Kahoot, Genially, Blooket, vidéo…).
- Recherche/filtres par niveau × matière × compétence × langue.
- Favoris par prof ; suggestion « à la une » possible plus tard.
- Le coût principal est ÉDITORIAL (produire/trier), pas technique.

### 3. Annotation privée de documents (chantier lourd, après la rentrée)
- Dépôt par prof de SES fichiers (PDF, scans) dans SON espace privé.
- Visionneuse PDF dans le navigateur (pdf.js) + couche d'annotations
  maison : surligner, souligner, écrire ; sauvegarde par compte.
- Export : version annotée (PDF aplati) ou version propre.
- Jamais de partage inter-profs de ces fichiers (cadre légal).
- Points durs : rendu PDF fiable, stockage (taille des scans), export.

### 4. Multilingue (décision d'architecture immédiate)
- **Interface toujours traduite** : FR / EN / ES via i18n (login,
  navigation, aide, réglages… tout).
- **Contenus typés par langue** : chaque jeu/ressource porte sa langue
  et un drapeau « traduisible ».
  - Traduisibles (sans ancrage culturel) : mot du jour, conjugaison,
    roue des noms, pendu… → données multilingues.
  - Non traduisibles (ancrage culturel) : quiz Révolution française… →
    restent dans leur langue, listés comme contenu francophone.
- Les liens externes s'ouvrent dans la langue choisie quand la
  plateforme cible le permet.

## Ordre des chantiers

| Priorité | Chantier | Pourquoi cet ordre |
|---|---|---|
| 1 | Finir le socle mono-prof : « Ma classe » (PR 0-9), module Évaluations | C'est la valeur de démonstration pour les collègues |
| 2 | i18n de l'interface + structure de données multilingue | Touche tous les data/*.ts : plus tôt = moins cher |
| 3 | Multi-prof + page perso favoris/épinglage | Bloquant pour la rentrée |
| 4 | Bibliothèque de ressources (v1 : liens organisés + fichiers) | Se remplit ensuite en continu |
| 5 | Annotation PDF privée | Chantier lourd, isolé, après la rentrée |

## Règles de conduite

- Intégrer > réinventer : si un outil existant fait mieux, on l'embarque
  ou on le lie, on ne le clone pas.
- Chaque chantier lourd commence par un prompt de CADRAGE (plan proposé
  par Claude Code, validé avant tout code).
- Données élèves = sensibles : tout derrière l'auth, cloisonné par prof.
- Une PR = un morceau testable ; le prof relit et merge lui-même.
