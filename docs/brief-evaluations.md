# Cadrage — Module « Évaluations » (générique, extensible)

> **État d'avancement** : PR 1 (socle) et PR 2 (composition d'épreuves) livrées.
> Prochaine étape : PR 3 (lancer une passation + rejoindre par code, côté élève).

## Contexte

Rituelio possède déjà un **mode évaluation** mais **spécifique à la conjugaison** :
tables `sessions`/`submissions`/`answers`, code `lib/serveur/evaluations.ts`,
route `/api/evaluations`, composants `components/evaluation/`, note /20 recalculée
à la lecture, join public par code sans authentification élève, et un **pont vers
le carnet de notes déjà livré** (`lib/serveur/import-carnet.ts`, `taches.origine='rituelio'`).

L'objectif est un **module d'évaluations riche et générique** : le prof compose une
suite de **questions** (avec **médias**), chaque question ayant un **type de réponse**
choisi dans une liste **extensible** (architecture à plugins), les élèves passent
l'épreuve sur leur appareil (join par code, réutilisant le mécanisme conjugaison),
avec **correction automatique** des types objectifs et **file manuelle** pour le reste.
Le résultat doit rester **compatible carnet de notes** (barème, `session_code`).

## Décisions validées

1. **Épreuve = modèle réutilisable** : on sépare l'`épreuve` (modèle) de la
   `passation` (un lancement : code + classe + statut). Les questions sont **figées
   au lancement** pour qu'éditer le modèle ne casse jamais les copies déjà rendues.
2. **Médias : URL / YouTube d'abord** (liens externes + image/audio/vidéo par URL +
   YouTube avec début/fin). Upload de fichiers (Vercel Blob) = **PR ultérieure** ;
   le schéma le prévoit déjà (`source IN ('url','youtube','upload')`).
3. **Retour élève : rien** — l'élève envoie sa copie sans voir score ni correction
   (comme la conjugaison). Seul le prof corrige/note. Un mode « révéler le score »
   pourra s'ajouter plus tard.
4. **Première tranche de types : QCM (choix unique) + réponse courte (auto) +
   réponse longue (manuelle)** — couvre les 3 paradigmes de correction. Les autres
   types (Vrai/Faux, QCM multiple, texte à trous, relier, remettre en ordre)
   s'ajoutent ensuite **un par un**.

## Décision de nommage — namespace `epreuves`

Le mot `evaluation(s)` est saturé par le module conjugaison (route, fichiers serveur,
types, dossier composants). Pour **éviter toute collision et toute confusion durable**,
tout le code générique utilise le namespace **`epreuves`** (une « épreuve » = un
contrôle), tout en gardant le **libellé UI « Évaluations »**.

| Surface | Conjugaison (existant, inchangé) | Générique (nouveau) |
|---|---|---|
| Route API | `/api/evaluations` | `/api/epreuves`, `/api/passations` |
| Serveur | `lib/serveur/evaluations.ts` | `lib/serveur/epreuves.ts` |
| Logique pure | `lib/conjugaison.ts` | `lib/epreuves/**` |
| Composants | `components/evaluation/` | `components/epreuves/` |
| Tables | `sessions`, `submissions`… | `epreuves`, `passations`, `copies`, `reponses` |

Les deux mécanismes conjugaison et générique **cohabitent** ; on ne refactore pas
l'existant. À terme, la conjugaison pourra devenir un type de plugin, hors périmètre ici.

## Architecture

### Modèle de données (`lib/serveur/schema.sql`, idempotent, `npm run db:migrate`)

Conventions du repo : id `TEXT` (UUID applicatif), timestamps `BIGINT` (epoch-ms),
cloisonnement `user_id` sur chaque table prof, `ON DELETE CASCADE`. **Config
type-spécifique + bonnes réponses en JSONB** (extensible sans migration).

- `epreuves` — modèle réutilisable : `id, user_id→prof_users, titre, description,
  melange_questions BOOLEAN, created_at, updated_at`.
- `epreuve_questions` — `id, epreuve_id→epreuves, type TEXT (clé plugin), enonce,
  points NUMERIC, config JSONB (inclut les bonnes réponses = SECRET), ordre`.
- `epreuve_medias` — `id, epreuve_id, question_id→epreuve_questions (NULL = média
  d'intro), genre CHECK('image','audio','video','lien'), source CHECK('url','youtube','upload'),
  url, debut_s, fin_s, mime, taille_octets, legende, ordre`.
- `passations` — un lancement : `id, code UNIQUE, user_id, epreuve_id→epreuves (SET NULL),
  titre (snapshot), class_id→classes (SET NULL), class_name (snapshot), date,
  status CHECK('ouverte','terminee'), bareme_total NUMERIC, created_at`.
- `passation_questions` — **snapshot figé** des questions au lancement : `id,
  passation_id→passations, type, enonce, points, config JSONB (avec réponses figées),
  medias JSONB, ordre`.
- `copies` — copie élève : `id, passation_id→passations, eleve_prenom (libre anonyme),
  eleve_id→eleves (SET NULL, mapping carnet ultérieur), submitted_at, teacher_comment,
  forced_note NUMERIC`.
- `reponses` — `id, copie_id→copies, question_id→passation_questions, contenu JSONB
  (réponse brute élève), points_manuels NUMERIC (NULL = auto), commentaire`.
  Index unique `(copie_id, question_id)`.

**Cloisonnement** : `epreuves` et `passations` portent `user_id` ; `copies`/`reponses`
héritent via `passation_id`. Aucune route publique ne lit `copies`/`reponses`.

**Note recalculée à la lecture** : auto → rien de stocké, recalcul via `corrige()` ;
manuel → `points_manuels` stocké ; override prof → `points_manuels` prend le pas ;
`forced_note` global écrase le total. Score copie = `{ note = Σ points, max = bareme_total }`
— **points bruts + barème, sans mise à l'échelle /20** (le carnet calcule déjà `points/bareme`).

> **Gotcha postgres.js** : écrire le JSONB avec `${sql.json(obj)}` (sinon un tableau JS
> est interprété comme tableau Postgres, pas comme du JSON).

### Architecture plugin des types de question

Le **cœur pur** (correction + strip public) est **isomorphe** (pas de React, pas de
`postgres`) donc importable côté serveur **et** client — comme `lib/conjugaison.ts`.

| Surface | Nature | Emplacement |
|---|---|---|
| Correction (auto) + version publique (retire les bonnes réponses) | Pur isomorphe | `lib/epreuves/questions/<type>.ts` + `registre.ts` |
| Édition (prof compose) | React client | `components/epreuves/questions/<Type>Editeur.tsx` |
| Passation (élève répond) | React client | `components/epreuves/questions/<Type>Saisie.tsx` + `registre-ui.ts` |

**Interface pure** (`lib/epreuves/questions/types.ts`) : `type`, `label`, `icone`,
`autoCorrige` ; `configParDefaut()` ; `valideConfig(brut)` ; `versionPublique(config)`
(**retire les bonnes réponses**) ; `valideReponse(brut)` / `reponseVide()` ;
`corrige(config, reponse, points) → { points, max } | null` (`null` = file manuelle).

**Ajouter un type = 1 dossier + 2 lignes de registre**, **aucune migration** (JSONB).

### Médias (v1 : URL / YouTube uniquement)

`epreuve_medias` déjà discriminé par `source` (`url`|`youtube`|`upload`). **v1 = URL
externe + image/audio/vidéo par URL + YouTube clippé (`debut_s`/`fin_s`)** → zéro infra.
**Upload (Vercel Blob)** = PR ultérieure, additive, sans changement de schéma. Un média
d'éval est **public-par-code** : ne jamais y mettre de contenu sensible.

## Réutilisation de l'existant

- **Garde prof** : `sessionProf()` / `refuserSiNonProf()` (`lib/serveur/session-prof.ts`).
- **DB** : `sql()` + `transaction()` (`lib/serveur/db.ts`).
- **Génération de code** : calquer `genererCode`/`prefixeCode` de `lib/serveur/evaluations.ts`
  (unicité vs `passations.code`).
- **Classes/élèves** : `classesDeProf(userId)`, `classeAppartientA(userId, classeId)`.
- **Normalisation texte** : `normaliserReponse()` (`lib/epreuves/texte.ts`) généralise
  `normaliser()` de `lib/conjugaison.ts` (garde les espaces internes ; casse/accents optionnels).
- **Patrons UI** : `components/evaluation/SuiviEvaluation.tsx` (polling 3 s, feedback
  emerald/rose), `RejoindreEvaluation.tsx`, `ConjugaisonEleve.tsx`.
- **Design system** : tokens sémantiques FR de `app/globals.css` — jamais slate/teal en
  dur, jamais de classe Tailwind dynamique (v4). Accents via `lib/couleurs.ts`.
- **Compat carnet** : produire `{ note, max=bareme_total }` par copie. Pont générique
  (PR 9) = généraliser `lib/serveur/import-carnet.ts` (barème = `bareme_total`) +
  `lib/appariement.ts` + anti-doublon `session_code`.

## Contraintes projet

- **Next 16** : `params` est une `Promise` → `const { code } = await ctx.params;` ;
  `export const dynamic = "force-dynamic"` sur les routes dynamiques.
- `lib/serveur/**` **jamais importé côté client** ; le cœur plugin pur reste sans
  dépendance serveur ni React.
- **RGPD** (élèves mineurs) : copies/réponses **derrière l'auth prof** + cloisonnement ;
  prénom libre anonyme ; `ON DELETE CASCADE` + action « supprimer la passation ».
- Branche `vinth` ; commits petits et fréquents en français ; **NE JAMAIS merger** ;
  avancer PR par PR, vérifiée avant la suivante.

## Découpage en PR

**PR 1 — Poser le socle des épreuves (schéma + cœur plugin pur)** ✅
Tables ; `lib/epreuves/questions/{types,registre}.ts` ; `lib/epreuves/texte.ts` ;
plugins purs `qcm` + `reponse-courte` ; tests unitaires (`npm test`).

**PR 2 — Composer et enregistrer une épreuve (QCM + réponse courte)** ✅
`lib/serveur/epreuves.ts` (CRUD, gardé `user_id`) ; `/api/epreuves(/[id])` ;
`/prof/epreuves` (liste + éditeur) ; `registre-ui.ts` + `QcmEditeur`/`ReponseCourteEditeur`.

**PR 3 — Lancer une passation et la rejoindre par code (élève)**
`lancerPassation` (snapshot + code) ; `POST /api/epreuves/[id]/passations`, public
`GET /api/passations/[code]` (dépouillé) + `POST /api/passations/[code]/copies` ;
UI publique `/passer` (miroir de `/rejoindre`). **Test anti-fuite** : aucune bonne
réponse dans le GET public.

**PR 4 — Suivre, corriger, file manuelle (réponse longue)**
`copiesCorrigees` (recalcul lecture) ; routes de correction ; `SuiviPassation` (polling)
+ file de correction manuelle ; plugin `reponse-longue`. Bouton « Terminer ».

**PR 5 — Vrai/Faux et QCM multiple** (2 plugins ; politique de score partiel/tout-ou-rien).
**PR 6 — Texte à trous** (jetons `{{trou}}`, crédit partiel par trou).
**PR 7 — Relier/associer et Remettre dans l'ordre** (crédit partiel).
**PR 8 (ultérieure) — Téléverser des médias (Vercel Blob)** (MIME/taille, additif).
**PR 9 (ultérieure) — Pont générique épreuve → carnet** (généraliser `import-carnet.ts`).

### Où le module apparaît
- **Prof (auteur)** : espace `/prof/epreuves` (liste + éditeur + lancement), lié depuis
  `app/prof/page.tsx`. Outil CRUD, pas une catégorie de jeu projetable.
- **Élève (passation)** : route publique `/passer` (miroir de `/rejoindre`).

## Points de vigilance

- **Auto-correction texte** : égalité après `normaliserReponse` + **variantes acceptées** ;
  **pas de fuzzy en v1** ; accents significatifs → toggle `ignorerAccents` par question.
- **Politiques de score** : QCM multiple tout-ou-rien (défaut) vs partiel (plancher 0) ;
  relier/ordre = crédit partiel proportionnel, plancher 0.
- **Sécurité** : point de sérialisation public unique + test anti-fuite ; rejeter tout
  `type` absent du registre ; `valideConfig`/`valideReponse` systématiques ; unicité du
  `code` ; snapshot au lancement.
- **RGPD** : copies derrière auth prof + cloisonnement ; prénom anonyme ; suppression en
  cascade ; prévoir (futur) purge auto après N mois.

## Questions ouvertes restantes (non bloquantes)

Temporalité (échéance/minuteur vs clôture manuelle) ; une tentative vs reprises / dédup
par prénom ; mélange des questions et des options (anti-triche) ; sections/parties dans
une épreuve ; pièce jointe (photo) sur réponse longue.
