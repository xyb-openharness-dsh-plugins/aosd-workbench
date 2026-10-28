/**
 * dsh/store.js — SQLite 唯一存储的读写层（生产事实库）。
 *
 * 数据库位置：宿主注入的 config.root 目录下 aosd.sqlite（本地模式可用 ':memory:'）。
 * 四条硬契约（schema/freeze-contract.md）：
 *  ① 无判读列；② 可空缺失即 NULL（`<0.5` 保留原文、value_num 为 NULL）；③ 更正只追加（revision+supersedes）；④ 隐私默认 fail-closed。
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MIGRATIONS = [join(dirname(fileURLToPath(import.meta.url)), '..', 'schema', 'migrations', '0001_initial.sql')]

export function openStore(location) {
  if (location && location !== ':memory:') mkdirSync(dirname(location), { recursive: true })
  const db = new DatabaseSync(location || ':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA journal_mode = WAL')
  const hasMeta = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'").get()
  if (!hasMeta) for (const file of MIGRATIONS) db.exec(readFileSync(file, 'utf8'))
  db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '0001')").run()
  return db
}

const now = () => new Date().toISOString()
const requireText = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw storeError('invalid_input', `${field} 必填`)
  return value.trim()
}
const storeError = (code, message, extra = {}) => Object.assign(new Error(message), { code: 'store/' + code, ...extra })
export const isStoreError = (e) => e && typeof e.code === 'string' && e.code.startsWith('store/')

/** 可空数值：null/undefined/'' 一律 NULL，绝不 Number(null)===0。 */
function optionalNum(value, field) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) throw storeError('invalid_input', `${field} 不是有效数值`)
  return n
}
function optionalText(value) {
  if (value == null || value === '') return null
  if (typeof value !== 'string') throw storeError('invalid_input', '可选文本必须是字符串')
  return value.trim() || null
}
function bool(value, fallback) {
  if (value == null) return fallback
  return value ? 1 : 0
}
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** 确保主体与默认 actor 存在（本地单人库：actor 即 subject 本人/家属标签）。 */
export function ensureSubject(db, { profileKey, displayName, sex, birthYear, stageLabel, anchorDate, anchorLabel, dataScope }) {
  db.prepare(`INSERT INTO subjects (profile_key, display_name, sex, birth_year, stage_label, anchor_date, anchor_label, data_scope, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile_key) DO UPDATE SET display_name=excluded.display_name`).run(
    profileKey, requireText(displayName, 'displayName'), requireText(sex, 'sex'),
    optionalNum(birthYear, 'birthYear'), requireText(stageLabel, 'stageLabel'),
    requireText(anchorDate, 'anchorDate'), requireText(anchorLabel, 'anchorLabel'),
    requireText(dataScope, 'dataScope'), now())
  for (const [actorId, kind, name] of [['patient', 'patient', '患者本人'], ['family', 'family', '家属']]) {
    db.prepare(`INSERT INTO source_actors (actor_id, profile_key, kind, display_name, relationship, created_at)
      VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`).run(actorId, profileKey, kind, name, kind === 'family' ? '家属' : null, now())
  }
  return db.prepare('SELECT * FROM subjects WHERE profile_key = ?').get(profileKey)
}

function nextOrd(db, table, profileKey) {
  const row = db.prepare(`SELECT COALESCE(MAX(ord), 0) + 1 AS ord FROM ${table} WHERE profile_key = ?`).get(profileKey)
  return row.ord
}

/**
 * 写入叙述。content_kind 决定三个主体字段：
 *  self → speaker=patient/recordedBy=patient；family_relay → experienced_by=patient、speaker=patient、recordedBy=family；
 *  family_observation → experienced_by=family、speaker/recordedBy=family。
 * 未经授权（family 系）默认不持久化由调用方把关；这里强制私密默认与出口默认。
 */
export function writeNarrative(db, profileKey, input) {
  const kind = requireText(input.contentKind, 'contentKind')
  if (!['self', 'family_relay', 'family_observation'].includes(kind)) throw storeError('invalid_input', 'contentKind 不在词表')
  const experiencedBy = kind === 'family_observation' ? 'family' : 'patient'
  const speaker = kind === 'self' ? 'patient' : (input.speakerActor === 'family' ? 'family' : 'patient')
  const recordedBy = kind === 'self' ? 'patient' : 'family'
  const id = nextId('n')
  db.prepare(`INSERT INTO narratives (profile_key, id, experienced_by, content_kind, speaker_actor, recorded_by_actor,
      occurred_at, occurred_precision, recorded_at, text, impact, is_private, family_visible, export_allowed, ai_allowed,
      review_state, revision, supersedes_id, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)`).run(
    profileKey, id, experiencedBy, kind, speaker, recordedBy,
    requireText(input.occurredAt, 'occurredAt'), input.occurredPrecision || 'day', now(),
    requireText(input.text, 'text'), optionalText(input.impact),
    bool(input.isPrivate, kind === 'self' ? 1 : 0),
    0, 0, 0,
    kind === 'family_observation' ? 'family_pending' : 'draft',
    nextOrd(db, 'narratives', profileKey), now())
  return db.prepare('SELECT * FROM narratives WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

/** 更正：不覆盖旧行，新增 revision+1 且 supersedes_id 指向旧版。 */
export function correctNarrative(db, profileKey, narrativeId, patch) {
  const prev = db.prepare('SELECT * FROM narratives WHERE profile_key = ? AND id = ?').get(profileKey, narrativeId)
  if (!prev) throw storeError('not_found', '原记录不存在')
  if (prev.supersedes_id) throw storeError('conflict', '该记录已被更新，请对最新版本更正')
  const id = nextId('n')
  db.prepare(`INSERT INTO narratives (profile_key, id, experienced_by, content_kind, speaker_actor, recorded_by_actor,
      occurred_at, occurred_precision, recorded_at, text, impact, is_private, family_visible, export_allowed, ai_allowed,
      review_state, revision, supersedes_id, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    profileKey, id, prev.experienced_by, prev.content_kind, prev.speaker_actor, prev.recorded_by_actor,
    prev.occurred_at, prev.occurred_precision, now(),
    requireText(patch.text ?? prev.text, 'text'), optionalText(patch.impact ?? prev.impact),
    prev.is_private, prev.family_visible, prev.export_allowed, prev.ai_allowed,
    'confirmed', prev.revision + 1, prev.id, nextOrd(db, 'narratives', profileKey), now())
  return db.prepare('SELECT * FROM narratives WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

/** 营养/心理：体重与心情只记录不计算；心理默认私密。 */
export function writeNutrition(db, profileKey, input) {
  const id = nextId('nut')
  db.prepare(`INSERT INTO nutrition_logs (profile_key, id, occurred_at, text, intake, weight_kg, note, is_private, recorded_by_actor, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    profileKey, id, requireText(input.occurredAt, 'occurredAt'), requireText(input.text, 'text'),
    optionalText(input.intake), optionalNum(input.weightKg, 'weightKg'), optionalText(input.note),
    bool(input.isPrivate, 0), input.recordedByActor || 'patient', nextOrd(db, 'nutrition_logs', profileKey), now())
  return db.prepare('SELECT * FROM nutrition_logs WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

export function writeMind(db, profileKey, input) {
  const id = nextId('mind')
  db.prepare(`INSERT INTO mind_logs (profile_key, id, occurred_at, text, mood, sleep, is_private, note, recorded_by_actor, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    profileKey, id, requireText(input.occurredAt, 'occurredAt'), requireText(input.text, 'text'),
    optionalText(input.mood), optionalText(input.sleep),
    bool(input.isPrivate, 1), optionalText(input.note), input.recordedByActor || 'patient',
    nextOrd(db, 'mind_logs', profileKey), now())
  return db.prepare('SELECT * FROM mind_logs WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

export function writeQuestion(db, profileKey, input) {
  const id = nextId('q')
  db.prepare(`INSERT INTO questions (profile_key, id, text, topic, is_private, sort_order, status, created_at, ord)
    VALUES (?, ?, ?, ?, ?, ?, 'unasked', ?, ?)`).run(
    profileKey, id, requireText(input.text, 'text'), requireText(input.topic, 'topic'),
    bool(input.isPrivate, 0), optionalNum(input.sortOrder, 'sortOrder') ?? nextOrd(db, 'questions', profileKey),
    now(), nextOrd(db, 'questions', profileKey))
  return db.prepare('SELECT * FROM questions WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

/** 候选决策：接受 → 生成观察值（原文照抄/缺失 NULL）并回写 accepted；拒收 → 只改 decision，零副作用。 */
export function decideCandidate(db, profileKey, candidateId, decision, actor = 'patient') {
  if (!['accepted', 'rejected'].includes(decision)) throw storeError('invalid_input', 'decision 只能是 accepted/rejected')
  const candidate = db.prepare('SELECT * FROM candidates WHERE profile_key = ? AND id = ?').get(profileKey, candidateId)
  if (!candidate) throw storeError('not_found', '候选不存在')
  if (candidate.decision !== 'pending') throw storeError('conflict', '候选已处理，不可重复决定')
  if (decision === 'rejected') {
    db.prepare("UPDATE candidates SET decision = 'rejected', decided_by_actor = ?, decided_at = ? WHERE profile_key = ? AND id = ?")
      .run(actor, now(), profileKey, candidateId)
    return { decision: 'rejected', observation: null }
  }
  const metric = db.prepare('SELECT * FROM metric_definitions WHERE profile_key = ? AND metric_id = ?').get(profileKey, candidate.field_name)
  if (!metric) throw storeError('invalid_input', `指标 ${candidate.fieldName} 未在指标目录登记`)
  const obsId = nextId('o')
  db.prepare(`INSERT INTO observations (profile_key, id, metric_id, document_id, raw_text, value_num, unit, ref_low, ref_high,
      collected_at, reported_at, time_precision, review_state, revision, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'day', 'confirmed', 1, ?, ?)`).run(
    profileKey, obsId, candidate.field_name, candidate.document_id, candidate.raw_text,
    candidate.value_num, candidate.unit, candidate.ref_low, candidate.ref_high,
    candidate.collected_at, candidate.collected_at, nextOrd(db, 'observations', profileKey), now())
  db.prepare("UPDATE candidates SET decision = 'accepted', decided_by_actor = ?, decided_at = ? WHERE profile_key = ? AND id = ?")
    .run(actor, now(), profileKey, candidateId)
  return { decision: 'accepted', observation: db.prepare('SELECT * FROM observations WHERE profile_key = ? AND id = ?').get(profileKey, obsId) }
}

/** 登记候选（AI/解析产出，待核对，不入事实）。valueNum 从原文提取失败必须 NULL。 */
export function writeCandidate(db, profileKey, input) {
  const id = nextId('c')
  db.prepare(`INSERT INTO candidates (profile_key, id, document_id, field_name, raw_text, value_text, value_num, unit,
      ref_low, ref_high, collected_at, decision, note, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).run(
    profileKey, id, requireText(input.documentId, 'documentId'), requireText(input.fieldName, 'fieldName'),
    requireText(input.rawText, 'rawText'), optionalText(input.valueText), optionalNum(input.valueNum, 'valueNum'),
    optionalText(input.unit), optionalNum(input.refLow, 'refLow'), optionalNum(input.refHigh, 'refHigh'),
    requireText(input.collectedAt, 'collectedAt'), optionalText(input.note), nextOrd(db, 'candidates', profileKey), now())
  return db.prepare('SELECT * FROM candidates WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

/** 登记报告原件（患者文件与公共资产分根由路由层校验路径）。 */
export function writeDocument(db, profileKey, input) {
  const id = nextId('doc')
  db.prepare(`INSERT INTO documents (profile_key, id, title, doc_type, org, collected_at, reported_at, time_precision,
      relative_path, mime, sha256, hash_kind, review_state, note, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    profileKey, id, requireText(input.title, 'title'), requireText(input.docType, 'docType'),
    requireText(input.org, 'org'), requireText(input.collectedAt, 'collectedAt'),
    optionalText(input.reportedAt), input.timePrecision || 'day',
    requireText(input.relativePath, 'relativePath'), requireText(input.mime, 'mime'),
    requireText(input.sha256, 'sha256'), input.hashKind || 'file', 'unverified',
    optionalText(input.note), nextOrd(db, 'documents', profileKey), now())
  return db.prepare('SELECT * FROM documents WHERE profile_key = ? AND id = ?').get(profileKey, id)
}

/** 同日四轨读模型（私密 fail-closed：includePrivate=false 时过滤 is_private=1）。 */
export function readDay(db, profileKey, date, { includePrivate = false } = {}) {
  const privClause = includePrivate ? '' : ' AND is_private = 0'
  return {
    narratives: db.prepare(`SELECT * FROM narratives WHERE profile_key = ? AND occurred_at = ?${privClause} ORDER BY rowid`).all(profileKey, date),
    documents: db.prepare('SELECT * FROM documents WHERE profile_key = ? AND collected_at = ? ORDER BY rowid').all(profileKey, date),
    medications: db.prepare("SELECT * FROM medication_events WHERE profile_key = ? AND started_on = ? AND event_kind = 'actual' ORDER BY rowid").all(profileKey, date),
    replies: db.prepare('SELECT * FROM clinical_replies WHERE profile_key = ? AND occurred_at = ? ORDER BY rowid').all(profileKey, date),
  }
}

/** 试验收藏：saved 是用户动作，不是资格判定。 */
export function toggleTrialSaved(db, profileKey, trialId) {
  const trial = db.prepare('SELECT * FROM trials WHERE profile_key = ? AND id = ?').get(profileKey, trialId)
  if (!trial) throw storeError('not_found', '试验不存在')
  db.prepare('UPDATE trials SET saved = ? WHERE profile_key = ? AND id = ?').run(trial.saved ? 0 : 1, profileKey, trialId)
  return db.prepare('SELECT * FROM trials WHERE profile_key = ? AND id = ?').get(profileKey, trialId)
}

/* ---------------- 读取模型（M5 模块接线用） ---------------- */
export function listNutrition(db, profileKey) {
  return db.prepare('SELECT * FROM nutrition_logs WHERE profile_key = ? ORDER BY occurred_at, rowid').all(profileKey)
}
export function listMind(db, profileKey, { includePrivate = false } = {}) {
  const sql = includePrivate
    ? 'SELECT * FROM mind_logs WHERE profile_key = ? ORDER BY occurred_at, rowid'
    : 'SELECT * FROM mind_logs WHERE profile_key = ? AND is_private = 0 ORDER BY occurred_at, rowid'
  return db.prepare(sql).all(profileKey)
}
export function listTrials(db, profileKey) {
  return db.prepare('SELECT * FROM trials WHERE profile_key = ? ORDER BY rowid').all(profileKey)
}
export function getSourceStates(db) {
  return db.prepare('SELECT * FROM source_states ORDER BY rowid').all()
}
export function getTrialProfile(db, profileKey) {
  return db.prepare('SELECT * FROM trial_profiles WHERE profile_key = ?').get(profileKey) || null
}
export function upsertTrialSnapshot(db, profileKey, { profile, trials, states, snapshotDate }) {
  db.prepare(`INSERT INTO trial_profiles (profile_key, doctor_record, disease_duration, treatment_lines_json, key_findings_json, comorbidity_json, notes, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile_key) DO UPDATE SET doctor_record=excluded.doctor_record, disease_duration=excluded.disease_duration,
      treatment_lines_json=excluded.treatment_lines_json, key_findings_json=excluded.key_findings_json,
      comorbidity_json=excluded.comorbidity_json, notes=excluded.notes, updated_at=excluded.updated_at`).run(
    profileKey, profile.doctorRecord, profile.diseaseDuration, JSON.stringify(profile.treatmentLines),
    JSON.stringify(profile.keyFindings), JSON.stringify(profile.comorbidity), profile.notes || null, new Date().toISOString())
  db.prepare('DELETE FROM trials WHERE profile_key = ?').run(profileKey)
  const insert = db.prepare(`INSERT INTO trials (profile_key, id, nct_id, title, phase, status, sites, conditions_json, criteria_json, pct, saved, snapshot_date, ord, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  trials.forEach((t, i) => insert.run(profileKey, t.nctId, t.nctId, t.title, t.phase, t.status, t.sites || null,
    JSON.stringify(t.conditions || []), JSON.stringify(t.criteria || []), t.pct, t.saved ? 1 : 0, snapshotDate, i + 1, new Date().toISOString()))
  db.prepare('DELETE FROM source_states').run()
  const ins = db.prepare('INSERT INTO source_states (source_id, state, reason_code, explanation, attempted, result_count, coverage_json, completeness_json, freshness_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const st of states) ins.run(st.sourceId, st.state, st.reasonCode || null, st.explanation || '', st.attempted ? 1 : 0,
    st.resultCount ?? null, JSON.stringify(st.coverage || null), JSON.stringify(st.completeness || null), JSON.stringify(st.freshness || null))
}
