# Rituelio — Brief « Ma classe » (gestion de l'année)

> Nouvelle grande catégorie de l'espace prof, à côté des activités.
> Objectif : piloter l'année — emploi du temps, prépa hebdo, notes, appel,
> comportement avec conséquences réelles — sans quitter Rituelio.

---

## 0. Le point structurant : où vivent les données

Jusqu'ici Rituelio stocke tout en localStorage (un seul navigateur, aucune
donnée sensible). Cette catégorie change la nature des données : **notes
nominatives + incidents de comportement d'élèves mineurs**. Trois conséquences :

1. **RGPD / confidentialité** : ces données ne doivent être accessibles
   qu'après connexion prof (la vraie auth serveur déjà décidée avec le
   backend). Un localStorage non protégé sur un poste de classe projeté
   devant les élèves n'est pas acceptable pour des notes.
2. **Perte de données** : localStorage = effacé si l'on vide le cache.
   Inacceptable pour un trimestre de notes.
3. **Multi-appareils** : tu voudras saisir des notes depuis chez toi et
   faire l'appel depuis la classe.

**Recommandation : cette catégorie s'appuie sur le backend** (le même
chantier que le mode évaluation Conjugaison + login prof). Le plan par PR
ci-dessous met donc le backend en premier. Alternative possible si tu veux
prototyper vite : commencer en localStorage derrière un simple écran,
puis migrer — mais c'est du travail jeté et un risque réel sur des vraies
notes. À trancher (question 1).

---

## 1. Vue d'ensemble de la catégorie

Nouvel onglet **« Ma classe »** (ou « Mon année ») dans l'espace prof,
avec un tableau de bord et 5 modules :

| Module | Rôle | Source aujourd'hui |
|---|---|---|
| 📅 Emploi du temps | Ta semaine type, par créneau | (tête / papier) |
| 📝 Prépa hebdo | Détail cours par cours, semaine par semaine | (variable) |
| 📔 Carnet de notes | Notes par matière/classe/trimestre, export Excel école | `Grades_2025_26 – Class X.xlsx` |
| ✅ Appel & liens | Raccourcis Vulkan (appel obligatoire) + ClassDojo | Dziennik Vulkan, ClassDojo |
| ⚖️ Comportement | Incidents → conséquences datées → rappels | `Behaviour_Tracking_Document.xlsx` |

Le **tableau de bord** (page d'entrée de la catégorie) affiche : les cours
du jour (tirés de l'emploi du temps), les conséquences en attente ou en
retard (module comportement), et les boutons Vulkan / ClassDojo — c'est lui
qui transforme le registre en système à rappels.

---

## 2. Module Emploi du temps

**Besoin.** Semaine type : quels cours, quelles classes, quels créneaux.

**Modèle.**
```ts
type Creneau = {
  id: string
  jour: 1|2|3|4|5            // lundi–vendredi
  heureDebut: string          // "08:45"
  heureFin: string            // "09:30"
  matiere: string             // "Français", "Science sociale"…
  classeId: string            // lien vers lib/classes.ts
  salle?: string
}
```

**UI.** Grille hebdomadaire (colonnes = jours, lignes = heures), édition par
clic sur un créneau. Couleur par classe (convention lib/couleurs.ts).
Le « cours suivant » et « aujourd'hui » se déduisent de l'heure système.

**Questions ouvertes.** Durée standard des cours (45 min ?) ; y a-t-il des
semaines A/B ou une seule semaine type ? ; l'année a-t-elle des périodes
(trimestres avec dates officielles) à configurer quelque part — utile aussi
pour le carnet de notes.

---

## 3. Module Prépa hebdo

**Besoin.** Pour une semaine donnée, voir chaque cours de l'emploi du temps
et y attacher sa préparation, cours par cours.

**Modèle.**
```ts
type PrepaCours = {
  id: string
  creneauId: string
  dateISO: string             // le cours concret ("2026-06-08")
  titre: string               // "Le passé composé — séance 3"
  objectifs?: string
  deroule?: string            // markdown simple
  materiel?: string
  activitesRituelio?: string[] // ids d'activités du catalogue → liens directs
  statut: "a-preparer" | "prete" | "faite"
  notesApres?: string         // bilan à chaud après le cours
}
```

**UI.** Vue « Semaine du … » : la grille de l'emploi du temps, chaque case
montrant le statut de prépa (rien / en cours / prête / faite). Clic → fiche
de prépa. Navigation semaine précédente/suivante. Bouton « dupliquer la
prépa » (une même séance donnée à 2 classes = cas fréquent).

**Lien fort avec le catalogue** : `activitesRituelio` permet de lancer
directement une activité depuis la fiche de prépa, en mode projection.
C'est LE pont entre « Ma classe » et le reste de Rituelio.

---

## 4. Module Carnet de notes

**Besoin.** Reproduire la logique du classeur école, en ne gardant que TES
matières (French Language / Science / Social Studies pour la 4.2, etc.),
avec saisie manuelle ET import automatique depuis les activités notées de
Rituelio (ex. mode évaluation Conjugaison), puis **export au format Excel
école** pour rester compatible avec le circuit officiel.

**Modèle (calqué sur le fichier réel).**
```ts
type Matiere = { id: string; nom: string; classeId: string }

type Tache = {                       // = "Task" du classeur
  id: string; matiereId: string
  trimestre: 1|2|3
  dateISO: string
  nom: string                        // "évaluation passé composé"
  bareme: number                     // Total Marks (ex. 20)
  ponderation: number                // Weighting (ex. 0.5) — Σ = 1 par trimestre
  origine?: "manuel" | "rituelio"    // trace si importée d'une activité
}

type NoteEleve = {
  tacheId: string; eleveId: string
  points?: number                    // Mark ; absent → undefined
  commentaire?: string               // "absent", "bonus"…
}
// % et grade (1–6) sont CALCULÉS, pas stockés :
// % = points / bareme ; grade selon l'échelle ITSW
// (100→6, 81–99→5, 61–80→4, 41–60→3, 31–40→2, ≤30→1)
// moyenne trimestre = Σ(% × ponderation)
```

**UI.** Choix classe → matière → trimestre ; tableau élèves × tâches
(saisie directe au clavier, tabulation de cellule en cellule, % et note
calculés en direct, ligne de moyenne). Gestion des absents (case vide +
mention). Ajout d'une tâche = date, nom, barème, pondération avec contrôle
« Σ pondérations = 1 ».

**Import depuis Rituelio.** Toute activité notée (à commencer par le mode
évaluation Conjugaison, dont le barème /20 existe déjà) propose en fin de
session « Envoyer vers le carnet de notes » → crée une Tache (origine :
"rituelio") + les NoteEleve correspondantes. Prévoir un mapping élèves
(profils élèves Rituelio ↔ liste officielle de la classe).

**Export Excel.** Génération d'un .xlsx par matière au format du classeur
école (mêmes colonnes Task/Date/Total Marks/Weighting en tête, mêmes
colonnes Mark/%/Grade/Comment par élève) pour copier-coller ou remettre tel
quel. C'est un gros gain : tu saisis dans Rituelio, l'école reçoit son format.
(Import de l'existant : optionnel, cf. question 5.)

---

## 5. Module Appel & liens externes

**Réalité contrainte.** L'appel DOIT se faire dans Dziennik Vulkan
(obligation gouvernementale) ; la discipline « officielle » passe par
ClassDojo. Pas d'API publique exploitable raisonnablement pour l'un ou
l'autre → on ne simule rien, on **raccourcit le chemin**.

**Implémentation.**
- Boutons bien visibles sur le tableau de bord ET sur la vue du cours en
  cours : « 📋 Faire l'appel (Vulkan) » et « 🏫 ClassDojo », ouvrant les
  sites dans un nouvel onglet (URLs configurables dans un petit écran de
  réglages, pour pointer direct vers ta classe si l'URL profonde marche).
- Le bouton Vulkan sur le cours du jour peut porter un rappel visuel
  (« appel non pointé pour ce cours ? ») purement local : simple case
  « appel fait » par cours, cochée à la main — zéro intégration, juste une
  aide-mémoire honnête.

---

## 6. Module Comportement & conséquences (le cœur qualitatif)

**Ton diagnostic.** Le doc école enregistre (balance de points, notes de
comportement par trimestre) mais ne DÉCLENCHE rien. Tu veux l'inverse :
chaque fait notable entraîne une conséquence datée, suivie, avec rappels.

**Principe de design : la boucle fermée.**
```
Fait observé → Enregistrement (type + raison) → Conséquence choisie
   → Échéance → Rappel au bon moment → Fait/Non fait → Clôture (ou escalade)
```
Rien ne « meurt » dans un tableau : un incident sans conséquence assignée
ou une conséquence non close reste visible sur le tableau de bord.

**Modèle.**
```ts
type FaitComportement = {
  id: string; eleveId: string; classeId: string
  dateISO: string
  type: "merit" | "demerit" | "incident" | "accident" | "win-cident"
  raison: string              // taxonomie école (listes du classeur, reprises telles quelles)
  details?: string
  consequenceId?: string      // undefined = À TRAITER (visible dashboard)
}

type Consequence = {
  id: string; faitId: string; eleveId: string
  nature: string              // catalogue configurable, cf. question 3
  echeanceISO: string
  statut: "en-attente" | "faite" | "annulee" | "escaladee"
  rappelJours?: number        // rappel J-1, jour J…
  bilan?: string              // comment ça s'est passé
}
```

**Règles d'escalade (reprises de l'école, automatisables).**
Le classeur définit déjà : 3 demerits en une semaine → incident ;
2 incidents en une semaine / 3 en un mois → behaviour contract ;
5 merits en une semaine → student profile award, etc.
→ Le système COMPTE et SUGGÈRE (« Rayan a 3 demerits cette semaine →
proposer un incident ? ») mais ne crée jamais tout seul : tu restes le juge.

**Rappels.** Sans backend de notifications, le rappel le plus fiable est
**à l'ouverture** : le tableau de bord liste « aujourd'hui / en retard /
à traiter », avec badge sur l'onglet « Ma classe ». Un e-mail quotidien
récapitulatif est possible une fois le backend en place (question 2).

**Vue élève.** Fiche par élève : historique, balance (compatible avec la
colonne « Balance » du doc école), conséquences en cours. Export du
trimestre au format du doc école si tu veux le reverser.

**Lien vers le doc officiel.** Bouton configurable vers le Google Sheet
école (le classeur contient déjà ces liens par classe) tant que la double
saisie reste demandée par l'administration.

---

## 7. Plan d'approche — PR par PR (une PR = un morceau testable)

L'ordre suppose la décision « backend d'abord ». Chaque PR suit ton
workflow : branche vinth, pas de merge auto, tu relis.

| # | PR | Contenu | Dépend de |
|---|---|---|---|
| 0 | Backend + auth prof | Le chantier déjà décidé (mode évaluation + login serveur). Ajoute les tables/collections de « Ma classe ». | — |
| 1 | Squelette « Ma classe » | Onglet, routing, tableau de bord vide, réglages (URLs Vulkan/ClassDojo, dates des trimestres). | 0 |
| 2 | Emploi du temps | Modèle Creneau, grille hebdo, édition. | 1 |
| 3 | Appel & liens | Boutons dashboard + cours du jour, case « appel fait ». | 2 |
| 4 | Carnet de notes v1 | Matières/Tâches/Notes, saisie tableau, calculs %/grade/moyennes. | 1 |
| 5 | Export Excel école | Génération .xlsx au format du classeur. | 4 |
| 6 | Comportement v1 | Faits + taxonomie école, fiche élève, balance. | 1 |
| 7 | Conséquences & rappels | Conséquences datées, statuts, dashboard « à traiter / en retard », suggestions d'escalade. | 6 |
| 8 | Prépa hebdo | PrepaCours, vue semaine, duplication, liens activités. | 2 |
| 9 | Pont activités → notes | « Envoyer vers le carnet » depuis les activités notées (Conjugaison éval en premier). | 4 + backend éval |

Les PR 2-3 (léger) et 4-5 (le plus utile au quotidien) peuvent être
inversées selon ta priorité (question 4). La 7 est celle qui réalise ta
demande « des conséquences réelles » — elle mérite une relecture design
ensemble avant implémentation.

---

## 8. Questions à trancher avant de lancer

1. **Données & backend** : on attend le backend (recommandé) ou on
   prototype en localStorage au risque de migrer/perdre ?
2. **Rappels** : à l'ouverture de l'app uniquement, ou aussi un e-mail
   quotidien récapitulatif (nécessite le backend + un service d'envoi) ?
3. **Catalogue de conséquences** : quelles conséquences appliques-tu
   réellement (mot aux parents, retenue, réparation, excuses écrites,
   perte de privilège, travail supplémentaire…) ? Liste concrète à figer —
   c'est elle qui rend le système crédible.
4. **Priorité des modules** : notes d'abord, ou comportement d'abord ?
5. **Import de l'existant** : veux-tu importer le classeur 2025-26 (listes
   d'élèves + tâches + notes) pour démarrer avec l'historique, ou partir
   propre à la rentrée 2026 ?
6. **Emploi du temps** : durée des créneaux, semaine unique ou A/B, et
   dates officielles des trimestres 2026-27 ?
7. **Périmètre classes** : uniquement tes classes/matières (4.2 Français +
   Science sociale, etc.) — me confirmer la liste complète pour préparer
   les seeds.
