-- 成人斯蒂尔病工作台 · 生产数据契约 0001（G3 基线，用户 2026-10-27 指示启用 SQLite 唯一存储）
-- 规则：只记录“谁/何时/在哪/原文是什么”；全库不含任何判读/资格/评分类列（禁用词表见 freeze-contract.md）。
-- 所有 INSERT 必须显式列名；复合主键读取 ORDER BY rowid；可空值显式 NULL；分类指标 kind='qual' 且 unit/decimals 为 NULL。

CREATE TABLE IF NOT EXISTS subjects (
  profile_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sex TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  stage_label TEXT NOT NULL,            -- 医生登记原文，不是推断
  anchor_date TEXT NOT NULL,
  anchor_label TEXT NOT NULL,
  data_scope TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS section_titles (
  profile_key TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  ord INTEGER NOT NULL,
  PRIMARY KEY (profile_key, key)
);

CREATE TABLE IF NOT EXISTS source_actors (
  actor_id TEXT NOT NULL,
  profile_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('patient','family','doctor','institution','ai')),
  display_name TEXT NOT NULL,
  relationship TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, actor_id)
);

CREATE TABLE IF NOT EXISTS narratives (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  experienced_by TEXT NOT NULL CHECK (experienced_by IN ('patient','family')),
  content_kind TEXT NOT NULL CHECK (content_kind IN ('self','family_relay','family_observation')),
  speaker_actor TEXT NOT NULL,
  recorded_by_actor TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  occurred_precision TEXT NOT NULL DEFAULT 'day',
  recorded_at TEXT NOT NULL,
  text TEXT NOT NULL,
  impact TEXT,
  is_private INTEGER NOT NULL DEFAULT 1 CHECK (is_private IN (0,1)),
  family_visible INTEGER NOT NULL DEFAULT 0 CHECK (family_visible IN (0,1)),
  export_allowed INTEGER NOT NULL DEFAULT 0 CHECK (export_allowed IN (0,1)),
  ai_allowed INTEGER NOT NULL DEFAULT 0 CHECK (ai_allowed IN (0,1)),
  review_state TEXT NOT NULL DEFAULT 'draft' CHECK (review_state IN ('draft','confirmed','family_pending','unverified')),
  revision INTEGER NOT NULL DEFAULT 1,
  supersedes_id TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);
CREATE INDEX idx_narratives_day ON narratives (profile_key, occurred_at);

CREATE TABLE IF NOT EXISTS documents (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  org TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  reported_at TEXT,
  time_precision TEXT NOT NULL DEFAULT 'day',
  relative_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  hash_kind TEXT NOT NULL DEFAULT 'file',
  review_state TEXT NOT NULL DEFAULT 'unverified' CHECK (review_state IN ('confirmed','candidate','unverified')),
  note TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS metric_definitions (
  profile_key TEXT NOT NULL,
  metric_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('numeric','qual')),
  category TEXT NOT NULL,
  decimals INTEGER,
  org_context TEXT,
  method_context TEXT,
  note TEXT,
  ord INTEGER NOT NULL,
  PRIMARY KEY (profile_key, metric_id)
);

CREATE TABLE IF NOT EXISTS candidates (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  value_text TEXT,
  value_num REAL,
  unit TEXT,
  ref_low REAL,
  ref_high REAL,
  collected_at TEXT NOT NULL,
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','accepted','rejected')),
  decided_by_actor TEXT,
  decided_at TEXT,
  note TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS observations (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  metric_id TEXT NOT NULL,
  document_id TEXT,
  raw_text TEXT NOT NULL,
  value_num REAL,                        -- 缺失/不等式必须 NULL，不得补 0
  unit TEXT,                             -- 未知单位必须 NULL，不得用字典补
  ref_low REAL,
  ref_high REAL,
  collected_at TEXT NOT NULL,
  reported_at TEXT,
  time_precision TEXT NOT NULL DEFAULT 'day',
  review_state TEXT NOT NULL DEFAULT 'confirmed',
  revision INTEGER NOT NULL DEFAULT 1,
  supersedes_id TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id),
  FOREIGN KEY (profile_key, metric_id) REFERENCES metric_definitions (profile_key, metric_id),
  FOREIGN KEY (profile_key, document_id) REFERENCES documents (profile_key, id)
);

CREATE TABLE IF NOT EXISTS medication_events (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  dose_text TEXT NOT NULL,
  route TEXT NOT NULL,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('planned','actual')),
  started_on TEXT NOT NULL,
  ended_on TEXT,
  note TEXT,
  doctor_quote TEXT,
  patient_understanding TEXT,
  source_document_id TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  supersedes_id TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS clinical_replies (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  speaker TEXT NOT NULL,
  dept TEXT NOT NULL,
  quote TEXT NOT NULL,
  patient_understanding TEXT,
  related_question_id TEXT,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS questions (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  text TEXT NOT NULL,
  topic TEXT NOT NULL,
  is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0,1)),
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unasked' CHECK (status IN ('unasked','asked','answered')),
  answer_reply_id TEXT,
  created_at TEXT NOT NULL,
  ord INTEGER NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  text TEXT NOT NULL,
  intake TEXT,
  weight_kg REAL,
  note TEXT,
  is_private INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0,1)),
  recorded_by_actor TEXT NOT NULL,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS mind_logs (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  text TEXT NOT NULL,
  mood TEXT,
  sleep TEXT,
  is_private INTEGER NOT NULL DEFAULT 1 CHECK (is_private IN (0,1)),
  note TEXT,
  recorded_by_actor TEXT NOT NULL,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS trial_profiles (
  profile_key TEXT PRIMARY KEY,
  doctor_record TEXT NOT NULL,
  disease_duration TEXT NOT NULL,
  treatment_lines_json TEXT NOT NULL,
  key_findings_json TEXT NOT NULL,
  comorbidity_json TEXT NOT NULL,
  notes TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trials (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  nct_id TEXT NOT NULL,
  title TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL,
  sites TEXT,
  conditions_json TEXT NOT NULL,
  criteria_json TEXT NOT NULL,
  pct INTEGER NOT NULL CHECK (pct BETWEEN 0 AND 100),
  saved INTEGER NOT NULL DEFAULT 0 CHECK (saved IN (0,1)),
  snapshot_date TEXT NOT NULL,
  ord INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS visit_snapshots (
  profile_key TEXT NOT NULL,
  id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  cutoff_at TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('brief','detail')),
  item_ids_json TEXT NOT NULL,
  item_revisions_json TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  question_order_json TEXT NOT NULL,
  review_states_json TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0 CHECK (stale IN (0,1)),
  ord INTEGER NOT NULL,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
