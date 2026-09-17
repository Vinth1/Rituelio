# Brief — Ouverture multi-prof

> **État d'avancement** : cadrage validé le 2026-09-17. PR 1 (documentation,
> diagnostic et script de vérification) livrée (#9). PR 2 (évaluations de
> conjugaison) en revue. Prochaines étapes : PR 3 (écriture des classes), puis
> ouverture.
>
> Pilier 1 de [`vision.md`](vision.md). Audit fait sur `main` = `b8028f5`.

## Contexte

Un collègue veut utiliser Rituelio. Jusqu'ici l'application tourne avec un seul
compte prof, amorcé par `PROF_MOT_DE_PASSE` au premier login. Objectif : chaque prof
crée son compte et ne voit **que** ses propres données.

## Décision structurante : aucun partage entre profs

Classes, élèves, notes, comportement, prépas, créneaux, épreuves : **tout est privé
par compte**. Si deux profs interviennent sur la même classe réelle de l'école (par
exemple Français et Sciences sociales sur la 4.2), chacun crée et gère **sa propre
version** de cette classe dans son compte. Aucune donnée n'est visible ni modifiable
par un autre compte.

Conséquence : **aucune logique de partage ni de permissions entre profs**. Un
`user_id` = un silo complet.

## 1. Audit

### 1.1 L'inscription existe et fonctionne

`/inscription` crée un **vrai compte utilisable** ; elle n'a rien à voir avec
l'amorçage du compte unique.

- Le formulaire envoie email, identifiant, mot de passe et code d'inscription à
  `POST /api/auth/inscription`.
- Le serveur vérifie `CLE_INSCRIPTION` (comparaison à temps constant), l'email,
  l'identifiant (3 caractères minimum) et le mot de passe (6 minimum), crée le compte
  (`creerCompte`, mot de passe haché scrypt), ouvre la session et pose le cookie.
- Le nouveau prof arrive connecté sur `/prof`, avec un compte vide.
- L'amorçage (`amorcerSiBesoin`) est indépendant : il ne crée le compte « prof » que
  si la table des comptes est vide. Sans effet dès qu'un compte existe.
- Le lien « Créer un compte » figure déjà sur `/connexion`.

Limites relevées (non bloquantes, voir PR 4) : sans `CLE_INSCRIPTION`, le formulaire
s'affiche quand même et répond « Code d'inscription invalide » ; l'identifiant
distingue les majuscules ; connexion par identifiant uniquement ; deux inscriptions
simultanées identiques renvoient une erreur 500 ; changer de mot de passe ne ferme pas
les autres sessions.

### 1.2 Cloisonnement, donnée par donnée

Toutes les routes prof utilisent l'identifiant **de la session**, jamais un
identifiant de propriétaire envoyé par le navigateur, et les pages serveur filtrent
aussi par compte.

| Donnée | Tables | `user_id` en base | Requêtes | Verdict |
|---|---|---|---|---|
| Classes / élèves | `classes`, `eleves` (via la classe) | ✅ | lecture ✅ / **écriture ❌** | **Trou 2** |
| Carnet de notes | `matieres`, `taches`, `notes_eleves` (via la tâche) | ✅ | ✅ tâche et élève vérifiés ; export ✅ | OK |
| Import éval → carnet | — | — | ✅ | OK |
| Faits de comportement | `faits_comportement` | ✅ | ✅ élève et classe vérifiés | OK |
| Conséquences | `consequences` | ✅ | pas encore de code | règles §5 |
| Prépas | `prepas_cours` | ✅ | ✅ créneau vérifié | OK |
| Créneaux | `creneaux` | ✅ | ✅ classe vérifiée | OK |
| Réglages Ma classe | `reglages_prof`, `trimestres` | ✅ | ✅ | OK |
| Épreuves | `epreuves` (+ questions, médias) | ✅ | ✅ | OK |
| Passations / copies | `passations`, `copies`, `reponses` | ✅ | pas encore de code | règles §5 |
| **Éval. conjugaison** | `sessions` (+ tables enfants) | ⚠️ **nullable** | création et historique ✅ / **correction ❌** | **Trou 1** |
| Dictées, images, verbes perso | — | ✅ | ✅ | OK |
| Favoris / page perso | — | — | n'existe pas | chantier séparé |

### 1.3 Les deux trous

Tous deux sont confirmés par `npm run test:cloisonnement` : **42 ✅, 7 ❌**, les 7
échecs étant exactement ceux-ci.

**Trou 1 — la correction des évaluations de conjugaison vérifie qu'on est connecté,
pas qu'on est le propriétaire** (`lib/serveur/evaluations.ts`).

- `GET /api/evaluations/[code]/copies` (`copiesDe(code)`) : n'importe quel prof connecté
  lit les prénoms, réponses et notes de l'évaluation d'un autre.
- `PATCH /api/evaluations/[code]` (`terminer(code)`) : il clôture l'évaluation d'un autre.
- `PATCH /api/evaluations/[code]/copies/[id]` (`forcerNote`, `fixerCommentaire`,
  `definirContraintesValidees`) : il modifie la correction d'une copie d'un autre ; le
  `code` de l'URL n'est même pas comparé à la copie.
- Aggravant : un code = 4 caractères du nom de classe + 3 chiffres, soit 900
  possibilités ; deux profs ayant une « 4.2 » partagent le préfixe `42-`.

**Trou 2 — l'écriture des classes ne vérifie pas le propriétaire**
(`remplacerClasses`, `lib/serveur/classes.ts`).

`INSERT … ON CONFLICT (id) DO UPDATE SET nom` n'a aucune condition sur le compte. Si
B envoie l'identifiant d'une classe de A : la classe de A est renommée ; les élèves de
A absents de la liste sont supprimés, **et avec eux, en cascade, leurs notes et leurs
faits de comportement** ; un élève de A peut aussi être renommé. B ne voit rien, sa
propre lecture étant filtrée : les dégâts sont silencieux.

### 1.4 Stockage local du navigateur : risque accepté

La copie locale des classes (`rituelio.classes`, noms des élèves compris) et les autres
clés `rituelio.*` ne sont pas rattachées à un compte ni vidées à la déconnexion.
Plusieurs outils la relisent quand l'API renvoie une liste vide, et `/classe` propose
d'« importer » les classes trouvées dans le navigateur.

**Décision : on ne change rien.** Chaque prof utilise son propre profil Chrome, protégé
par mot de passe : personne n'ouvre le navigateur d'un autre. Si cet usage change
(ordinateur ou profil partagé), rouvrir ce point : purge à la déconnexion, repli local
seulement en cas de panne réseau, retrait du bandeau d'import.

Relevé au passage, hors chantier : `/jeux/[id]/projeter` n'a pas de garde de connexion.

### 1.5 Données existantes : rien à déplacer

- Toutes les tables exigent un `user_id` (sauf `sessions`), et chaque écriture a pris
  l'identifiant de la session, c'est-à-dire le compte unique. **Les données actuelles
  sont déjà rattachées à ce compte.**
- La bascule SQLite → Postgres (`c9b78d2`) n'a repris que le schéma, pas de données :
  il ne devrait exister aucune ligne ancienne sans propriétaire.
- Seule incertitude : des `sessions` sans propriétaire. Aujourd'hui lisibles par code,
  elles deviendraient inaccessibles une fois le Trou 1 corrigé. La PR 2 les rattache.

## 2. Décisions prises au cadrage

| Question | Décision |
|---|---|
| Partage entre profs | Aucun (voir plus haut) |
| Où est la prod ? | **Neon**, via l'intégration Vercel ; variables de base communes à **Production et Preview** |
| `CLE_INSCRIPTION` en prod | Déjà définie (Production et Preview) ; à remplacer avant l'ouverture |
| Ordinateurs partagés | Non concerné (profils Chrome personnels) ; rien à changer |
| Limitation des tentatives de connexion | Pas pour l'instant |
| Mot de passe minimum | Reste à 6 caractères |
| Mot de passe oublié / script admin | Pas pour l'instant |
| Favoris / page perso | Chantier séparé, après l'ouverture |

⚠️ **Preview = données réelles, a priori.** Les variables de base (`DATABASE_URL`…) sont
les mêmes pour Production et Preview, et aucune variable propre à une branche n'apparaît :
une URL de Preview (celle d'une PR) tourne donc sur la base de prod. Y tester une PR,
c'est modifier les vraies données.

## 3. Flux d'inscription visé

1. Le prof référent remplace `CLE_INSCRIPTION` sur Vercel par un code long (32
   caractères ou plus) et redéploie.
2. Il transmet le code et le lien `/inscription` au collègue, en dehors de Rituelio.
3. Le collègue crée son compte et arrive connecté sur un `/prof` vide.
4. Il crée **ses propres** classes dans `/classe`, puis remplit « Ma classe ».
5. Le prof référent retire `CLE_INSCRIPTION` (Production et Preview) et redéploie :
   les inscriptions sont fermées.

## 4. Plan par PR

Ordre : tant qu'un seul compte existe, les trous ne sont pas exploitables et chaque PR
est invisible pour le prof en usage réel. **Les PR 2 et 3 sont en prod avant de
transmettre le code d'inscription.**

### PR 1 — Documentation, diagnostic et vérification (sans changement de comportement)

- `docs/vision.md` et `docs/brief-ma-classe.md` rapatriés sur `main`, ce brief, règles
  de cloisonnement dans `CLAUDE.md`.
- `npm run db:diagnostic` (`scripts/diagnostic-cloisonnement.mts`) : volumes par compte,
  évaluations sans propriétaire, liens entre comptes différents. Transaction READ ONLY,
  que des nombres.
- `npm run test:cloisonnement` (`scripts/verifier-cloisonnement.mts`) : deux comptes
  jetables, 49 vérifications, comptes supprimés à la fin. Local uniquement.
- **Test** : le script échoue exactement sur les 7 cas des Trous 1 et 2.

### PR 2 — Évaluations de conjugaison filtrées par propriétaire (Trou 1)

- `copiesDe`, `terminer`, `forcerNote`, `fixerCommentaire`,
  `definirContraintesValidees` reçoivent `userId` et filtrent sur `sessions.user_id`,
  écritures comprises ; `copieDuProf` vérifie qu'une copie appartient à l'évaluation du
  `code` de l'URL, et celle-ci au prof.
- Routes : 404 pour une évaluation ou une copie d'un autre prof. `import-carnet.ts`
  adapté.
- `schema.sql` : rattachement des `sessions` sans propriétaire, **uniquement s'il n'existe
  qu'un compte**, puis `user_id` obligatoire. Avec plusieurs comptes et des lignes sans
  propriétaire, la migration échoue et s'annule entièrement : rien n'est perdu, on
  tranche à la main. Vérifié en local : un compte, deux comptes, migration rejouée,
  base neuve.
- Script : nouveau cas (B corrige une copie de A via le code de **sa** propre
  évaluation) et contrôles inverses (A corrige, envoie au carnet et clôture son
  évaluation).
- **Test** : 53 vérifications, 49 ✅ ; les 4 ❌ restants sont ceux du Trou 2.
- **Mise en prod : migrer AVANT de merger** (§6), depuis la branche de la PR. L'ancien
  code écrit toujours un `user_id` et supporte la colonne obligatoire ; le nouveau code
  sans migration rendrait invisibles d'éventuelles évaluations sans propriétaire.

### PR 3 — Écriture des classes cloisonnée (Trou 2)

- `remplacerClasses` : dans la transaction et **avant toute écriture**, refus (409) si un
  identifiant de classe ou d'élève envoyé appartient à un autre compte ; rien n'est
  écrit. En double sécurité, `ON CONFLICT … DO UPDATE … WHERE` sur le propriétaire.
- `GestionClasses` affiche l'erreur au lieu d'un simple « erreur ».
- **Test** : `npm run test:cloisonnement` entièrement vert. À la main : ajouter,
  renommer et supprimer classes et élèves ; carnet et comportement intacts.

### Ouverture (sans code)

1. PR 2 migrée en prod (§6) puis mergée, PR 3 mergée et déployée.
2. `npm run db:diagnostic` sur la prod : aucun lien entre comptes, aucune évaluation
   sans propriétaire.
3. Nouveau `CLE_INSCRIPTION` (§3), transmis au collègue.
4. Après son inscription, retrait de `CLE_INSCRIPTION`.

### PR 4 — Confort de connexion (non bloquante, à confirmer au moment de la faire)

- Identifiant insensible aux majuscules (index unique sur `lower(identifiant)`) et
  connexion par identifiant ou par email.
- Message « déjà pris » au lieu d'une erreur 500 lors d'inscriptions simultanées.
- « Inscriptions fermées » sur `/inscription` quand le code n'est pas défini.
- Changer de mot de passe ferme les autres sessions.
- `.env.example` : renvoi obsolète vers `/prof/reglages` (désormais `/profil`).

## 5. Règles pour tout module prof (existant ou à venir)

À appliquer notamment aux conséquences (Ma classe), aux passations (Évaluations) et aux
favoris :

1. Une route prof lit `session.userId` ; elle ne fait jamais confiance à un identifiant
   de propriétaire venu du navigateur.
2. Toute requête sur une table à `user_id` filtre dessus — **lectures, mises à jour,
   suppressions, et recherches par code comprises**.
3. Une table sans `user_id` (élèves, notes, copies, réponses…) se lit par jointure vers
   le parent qui en a un.
4. Tout identifiant reçu qui sert de lien (`classeId`, `eleveId`, `creneauId`,
   `matiereId`…) est vérifié comme appartenant au prof avant d'écrire.
5. Un upsert `ON CONFLICT (id)` sur un identifiant fourni par le navigateur vérifie le
   propriétaire : sinon il écrase la ligne d'un autre compte.
6. Une route publique élève (par code) ne renvoie jamais de données prof : corrigé,
   copies des autres, noms.
7. Chaque nouveau module ajoute ses cas dans `scripts/verifier-cloisonnement.mts`.

## 6. Exploitation : diagnostic et migration sur la prod

Les deux scripts lisent `DATABASE_URL` dans l'environnement en priorité, puis dans
`.env.local`. Sous PowerShell :

```powershell
# 1. Récupérer l'URL de prod dans un fichier à part (ignoré par Git) — surtout pas
#    dans .env.local, qui doit rester sur la base Docker locale.
vercel env pull .env.production.local --environment=production

# 2. Copier la valeur de DATABASE_URL de ce fichier, puis :
$env:DATABASE_URL = "<URL de prod>"
npm run db:diagnostic          # lecture seule
npm run db:migrate             # après la sauvegarde ci-dessous, depuis la branche
                               # dont on veut appliquer le schema.sql
Remove-Item Env:DATABASE_URL   # revenir à la base locale
Remove-Item .env.production.local
```

**Sauvegarde avant toute migration** : console Neon → projet → *Branches* → *Create
branch* depuis la branche principale. La branche est une copie instantanée, restaurable
si la migration tourne mal.

`npm run test:cloisonnement` ne se lance **jamais** sur la prod ni sur une Preview : il
crée des comptes et, tant qu'un trou existe, abîme des données. Il refuse d'ailleurs
tout serveur ou toute base non locale.

## Hors périmètre

- Partage ou permissions entre profs (exclu par décision).
- Rôle admin.
- Contraintes de propriétaire directement en base (clés étrangères composites) : les
  vérifications applicatives et le script suffisent à ce stade.
- Favoris / page perso : chantier séparé.
