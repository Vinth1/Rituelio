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
