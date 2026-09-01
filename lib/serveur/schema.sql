-- Schéma Postgres complet de Rituelio (source de vérité unique).
-- Idempotent : appliqué par `npm run db:migrate` (scripts/migrate.mts). À rejouer
-- après chaque évolution (les CREATE ... IF NOT EXISTS ne cassent rien).
-- Conventions : identifiants = UUID applicatifs (TEXT) ; horodatages = epoch-ms (BIGINT).

-- ===== Comptes & sessions prof (authentification) =====
CREATE TABLE IF NOT EXISTS prof_users (
  id TEXT PRIMARY KEY,
  identifiant TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS prof_sessions (
  id TEXT PRIMARY KEY,                 -- = SHA-256 du jeton posé dans le cookie
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prof_sessions_user ON prof_sessions(user_id);

-- ===== Classes & élèves (ex-localStorage, désormais côté serveur) =====
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_classes_user ON classes(user_id);
CREATE TABLE IF NOT EXISTS eleves (
  id TEXT PRIMARY KEY,
  classe_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id);

-- ===== Mode évaluation (conjugaison) =====
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  user_id TEXT REFERENCES prof_users(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,  -- FK + snapshot du nom
  class_name TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ouverte',
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_id);
CREATE TABLE IF NOT EXISTS session_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  infinitive TEXT NOT NULL,
  tense TEXT NOT NULL,
  grammatical_mode TEXT NOT NULL,
  order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_items_session ON session_items(session_id);
-- Formes attendues FIGÉES au lancement de l'évaluation. Indispensable pour les
-- verbes personnalisés, que le serveur ne peut pas retrouver (ils appartiennent
-- à un prof), et garantit qu'une copie déjà rendue garde sa note même si la
-- banque ou le moteur évoluent. NULL sur les évaluations créées avant cette
-- colonne : la correction retombe alors sur `trouverConjugaison`.
-- C'est le CORRIGÉ : ne jamais l'exposer à l'élève (cf. `evaluationParCode`).
ALTER TABLE session_items ADD COLUMN IF NOT EXISTS formes JSONB;
CREATE TABLE IF NOT EXISTS session_constraints (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_constraints_session ON session_constraints(session_id);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  eleve_id TEXT REFERENCES eleves(id) ON DELETE SET NULL,  -- mapping carnet (à venir)
  submitted_at BIGINT NOT NULL,
  teacher_comment TEXT NOT NULL DEFAULT '',
  forced_note INTEGER
);
CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  line_index INTEGER NOT NULL,
  pronoun TEXT NOT NULL,
  answer TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_answers_submission ON answers(submission_id);
CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sentence_text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sentences_submission ON sentences(submission_id);
CREATE TABLE IF NOT EXISTS submission_constraints (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  validated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_submission_constraints_submission ON submission_constraints(submission_id);

-- ===== « Ma classe » (tables seulement — l'UI viendra dans des PR ultérieures) =====
CREATE TABLE IF NOT EXISTS reglages_prof (
  user_id TEXT PRIMARY KEY REFERENCES prof_users(id) ON DELETE CASCADE,
  url_vulkan TEXT,
  url_classdojo TEXT,
  lien_doc_ecole TEXT
);
CREATE TABLE IF NOT EXISTS trimestres (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  annee TEXT NOT NULL,                 -- ex. "2026-2027"
  numero INTEGER NOT NULL CHECK (numero IN (1, 2, 3)),
  date_debut TEXT NOT NULL,            -- ISO "2026-09-01"
  date_fin TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trimestres_user ON trimestres(user_id);
CREATE TABLE IF NOT EXISTS matieres (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  classe_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matieres_classe ON matieres(classe_id);
CREATE TABLE IF NOT EXISTS creneaux (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  classe_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  matiere_id TEXT REFERENCES matieres(id) ON DELETE SET NULL,  -- réservé (futur carnet)
  matiere TEXT NOT NULL DEFAULT '',    -- libellé matière en saisie libre
  jour INTEGER NOT NULL CHECK (jour BETWEEN 1 AND 5),  -- lundi..vendredi
  heure_debut TEXT NOT NULL,           -- "08:45"
  heure_fin TEXT NOT NULL,             -- "09:30"
  salle TEXT
);
CREATE INDEX IF NOT EXISTS idx_creneaux_classe ON creneaux(classe_id);
-- Bases déjà créées avant l'ajout du libellé libre : colonne ajoutée après coup.
ALTER TABLE creneaux ADD COLUMN IF NOT EXISTS matiere TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS prepas_cours (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  creneau_id TEXT REFERENCES creneaux(id) ON DELETE SET NULL,
  date_iso TEXT NOT NULL,              -- le cours concret ("2026-06-08")
  titre TEXT NOT NULL,
  objectifs TEXT,
  deroule TEXT,                        -- markdown simple
  materiel TEXT,
  activites_rituelio TEXT[] NOT NULL DEFAULT '{}',  -- ids d'activités du catalogue
  statut TEXT NOT NULL DEFAULT 'a-preparer'
    CHECK (statut IN ('a-preparer', 'prete', 'faite')),
  notes_apres TEXT                     -- bilan à chaud après le cours
);
CREATE INDEX IF NOT EXISTS idx_prepas_user ON prepas_cours(user_id);
CREATE INDEX IF NOT EXISTS idx_prepas_creneau ON prepas_cours(creneau_id);
-- Au plus une prépa par (prof, créneau, date concrète) — sert aussi à l'upsert.
CREATE UNIQUE INDEX IF NOT EXISTS idx_prepas_unique
  ON prepas_cours(user_id, creneau_id, date_iso);
CREATE TABLE IF NOT EXISTS taches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  matiere_id TEXT NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  trimestre INTEGER NOT NULL CHECK (trimestre IN (1, 2, 3)),
  date_iso TEXT NOT NULL,
  nom TEXT NOT NULL,                    -- "évaluation passé composé"
  bareme NUMERIC NOT NULL,             -- Total Marks (ex. 20)
  ponderation NUMERIC NOT NULL,        -- Weighting (Σ = 1 par trimestre)
  origine TEXT CHECK (origine IN ('manuel', 'rituelio')),
  session_code TEXT,                   -- trace d'une éval Rituelio importée
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_taches_matiere ON taches(matiere_id);
-- % et grade (échelle ITSW) restent CALCULÉS à l'affichage, jamais stockés.
CREATE TABLE IF NOT EXISTS notes_eleves (
  tache_id TEXT NOT NULL REFERENCES taches(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  points NUMERIC,                      -- Mark ; NULL = absent / non noté
  commentaire TEXT,
  PRIMARY KEY (tache_id, eleve_id)
);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes_eleves(eleve_id);
CREATE TABLE IF NOT EXISTS faits_comportement (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  classe_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date_iso TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('merit', 'demerit', 'incident', 'accident', 'win-cident')),
  raison TEXT NOT NULL,                -- taxonomie école
  details TEXT,
  consequence_id TEXT,                 -- NULL = À TRAITER (visible sur le dashboard)
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_faits_eleve ON faits_comportement(eleve_id);
-- Index partiel pour le dashboard « à traiter » (faits sans conséquence).
CREATE INDEX IF NOT EXISTS idx_faits_a_traiter
  ON faits_comportement(user_id) WHERE consequence_id IS NULL;
CREATE TABLE IF NOT EXISTS consequences (
  id TEXT PRIMARY KEY,
  fait_id TEXT NOT NULL REFERENCES faits_comportement(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  nature TEXT NOT NULL,                -- catalogue configurable
  echeance_iso TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en-attente'
    CHECK (statut IN ('en-attente', 'faite', 'annulee', 'escaladee')),
  rappel_jours INTEGER,
  bilan TEXT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_consequences_fait ON consequences(fait_id);
-- Index pour le dashboard « en retard / à traiter » (par prof, statut, échéance).
CREATE INDEX IF NOT EXISTS idx_consequences_dashboard
  ON consequences(user_id, statut, echeance_iso);

-- ============================================================================
-- Module « Évaluations » générique (namespace `epreuves`) — voir le cadrage.
-- Une ÉPREUVE est un modèle réutilisable ; une PASSATION est un lancement
-- (code + classe + statut) dont les questions sont FIGÉES au lancement, pour
-- qu'éditer le modèle plus tard ne change jamais les copies déjà rendues.
-- Config type-spécifique + bonnes réponses en JSONB → types de question
-- extensibles sans migration. Cloisonnement `user_id` ; la note est recalculée
-- à la lecture (rien de stocké côté note, hors correction manuelle / note forcée).
-- ============================================================================
CREATE TABLE IF NOT EXISTS epreuves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  melange_questions BOOLEAN NOT NULL DEFAULT false,  -- mélange l'ordre par élève
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_epreuves_user ON epreuves(user_id);

CREATE TABLE IF NOT EXISTS epreuve_questions (
  id TEXT PRIMARY KEY,
  epreuve_id TEXT NOT NULL REFERENCES epreuves(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                   -- clé de plugin : 'qcm', 'reponse-courte', …
  enonce TEXT NOT NULL DEFAULT '',
  points NUMERIC NOT NULL DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}',   -- config type-spécifique + bonnes réponses (secret)
  ordre INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_epreuve_questions_epreuve ON epreuve_questions(epreuve_id);

CREATE TABLE IF NOT EXISTS epreuve_medias (
  id TEXT PRIMARY KEY,
  epreuve_id TEXT NOT NULL REFERENCES epreuves(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES epreuve_questions(id) ON DELETE CASCADE,  -- NULL = média d'intro
  genre TEXT NOT NULL CHECK (genre IN ('image', 'audio', 'video', 'lien')),
  source TEXT NOT NULL CHECK (source IN ('url', 'youtube', 'upload')),
  url TEXT NOT NULL,                    -- URL externe (v1) ou clé de blob (upload, PR ultérieure)
  debut_s INTEGER,                      -- YouTube : début (secondes)
  fin_s INTEGER,                        -- YouTube : fin (secondes)
  mime TEXT,
  taille_octets BIGINT,
  legende TEXT,
  ordre INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_epreuve_medias_epreuve ON epreuve_medias(epreuve_id);
CREATE INDEX IF NOT EXISTS idx_epreuve_medias_question ON epreuve_medias(question_id);

-- Un lancement : code + classe + statut. `epreuve_id` = source (contenu figé
-- dans passation_questions), `class_name` = snapshot (comme la conjugaison).
CREATE TABLE IF NOT EXISTS passations (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  epreuve_id TEXT REFERENCES epreuves(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,                  -- snapshot du titre de l'épreuve
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  class_name TEXT NOT NULL,             -- snapshot du nom de classe
  date TEXT NOT NULL,                   -- ISO "2026-06-08"
  status TEXT NOT NULL DEFAULT 'ouverte' CHECK (status IN ('ouverte', 'terminee')),
  bareme_total NUMERIC NOT NULL,        -- Σ des points au lancement (barème)
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_passations_user ON passations(user_id);
CREATE INDEX IF NOT EXISTS idx_passations_class ON passations(class_id);

-- Snapshot FIGÉ des questions au lancement (correction stable même si le modèle évolue).
CREATE TABLE IF NOT EXISTS passation_questions (
  id TEXT PRIMARY KEY,
  passation_id TEXT NOT NULL REFERENCES passations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  enonce TEXT NOT NULL DEFAULT '',
  points NUMERIC NOT NULL DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}',   -- config + bonnes réponses FIGÉES
  medias JSONB NOT NULL DEFAULT '[]',   -- médias figés (déjà résolus en URLs)
  ordre INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_passation_questions_passation ON passation_questions(passation_id);

CREATE TABLE IF NOT EXISTS copies (
  id TEXT PRIMARY KEY,
  passation_id TEXT NOT NULL REFERENCES passations(id) ON DELETE CASCADE,
  eleve_prenom TEXT NOT NULL,           -- prénom libre anonyme (comme la conjugaison)
  eleve_id TEXT REFERENCES eleves(id) ON DELETE SET NULL,  -- mapping carnet (ultérieur)
  submitted_at BIGINT NOT NULL,
  teacher_comment TEXT NOT NULL DEFAULT '',
  forced_note NUMERIC                   -- note forcée GLOBALE ; NULL = note auto
);
CREATE INDEX IF NOT EXISTS idx_copies_passation ON copies(passation_id);

CREATE TABLE IF NOT EXISTS reponses (
  id TEXT PRIMARY KEY,
  copie_id TEXT NOT NULL REFERENCES copies(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES passation_questions(id) ON DELETE CASCADE,
  contenu JSONB NOT NULL DEFAULT '{}',  -- réponse brute de l'élève (type-spécifique)
  points_manuels NUMERIC,               -- correction manuelle / override ; NULL = auto
  commentaire TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reponses_copie_question ON reponses(copie_id, question_id);
CREATE INDEX IF NOT EXISTS idx_reponses_copie ON reponses(copie_id);

-- ===== Verbes personnalisés (conjugaison) =====
-- Verbe ajouté par un prof, absent de data/verbes.ts. `formes` ne contient que
-- les cases CORRIGÉES à la main (clé « mode|temps ») : le reste est régénéré par
-- le moteur, si bien qu'un verbe perso profite des évolutions de celui-ci.
-- Scopé user_id : un prof ne voit jamais les verbes d'un autre.
CREATE TABLE IF NOT EXISTS verbes_perso (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  infinitif TEXT NOT NULL,
  groupe TEXT NOT NULL DEFAULT '3e groupe'
    CHECK (groupe IN ('1er groupe', '2e groupe', '3e groupe')),
  auxiliaire TEXT NOT NULL DEFAULT 'avoir'
    CHECK (auxiliaire IN ('avoir', 'être')),
  formes JSONB NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verbes_perso_unique ON verbes_perso(user_id, infinitif);

-- ===== Dictées =====
-- Texte de dictée saisi par le prof, étiqueté par des tags libres
-- (« imparfait », « compléments-circonstanciels »…) qui servent à le retrouver.
-- Le texte est la source de vérité de la correction collective : c'est lui
-- qu'on découpe en mots pour valider l'épellation des élèves.
-- Scopé user_id : un prof ne voit jamais les dictées d'un autre.
CREATE TABLE IF NOT EXISTS dictees (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES prof_users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  texte TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dictees_user ON dictees(user_id);
-- GIN : sert le `tags @> ...` de la recherche par hashtags.
CREATE INDEX IF NOT EXISTS idx_dictees_tags ON dictees USING GIN (tags);
