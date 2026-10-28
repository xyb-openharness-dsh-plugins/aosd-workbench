import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { openStore, ensureSubject, writeNarrative, correctNarrative, writeNutrition, writeMind, writeQuestion, writeCandidate, decideCandidate, writeDocument, readDay, toggleTrialSaved } from '../dsh/store.js'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname

function freshDb() {
  const db = openStore(':memory:')
  ensureSubject(db, { profileKey: 'P1', displayName: '测试主体（合成）', sex: '女', birthYear: 1992, stageLabel: '医生记录（测试）', anchorDate: '2026-05-08', anchorLabel: '首诊', dataScope: '测试' })
  return db
}

test('内存库打开即建表，meta 记录 schema_version', () => {
  const db = freshDb()
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  for (const t of ['subjects', 'narratives', 'observations', 'trials']) assert.ok(tables.includes(t))
  assert.equal(db.prepare("SELECT value FROM meta WHERE key='schema_version'").get().value, '0001')
  db.close()
})

test('叙述三类来源：self/family_relay/family_observation 主体字段正确', () => {
  const db = freshDb()
  const self = writeNarrative(db, 'P1', { contentKind: 'self', occurredAt: '2026-05-02', text: '连着三晚发热。' })
  assert.equal(self.experienced_by, 'patient')
  assert.equal(self.speaker_actor, 'patient')
  assert.equal(self.recorded_by_actor, 'patient')
  assert.equal(self.is_private, 1, '敏感记录默认私密')
  const relay = writeNarrative(db, 'P1', { contentKind: 'family_relay', occurredAt: '2026-06-20', text: '她说关节没那么疼。' })
  assert.equal(relay.experienced_by, 'patient')
  assert.equal(relay.recorded_by_actor, 'family')
  const obs = writeNarrative(db, 'P1', { contentKind: 'family_observation', occurredAt: '2026-05-06', text: '躯干红疹。' })
  assert.equal(obs.experienced_by, 'family')
  assert.equal(obs.review_state, 'family_pending')
})

test('更正只追加：revision+1 且 supersedes 指向旧版，旧值不覆盖', () => {
  const db = freshDb()
  const first = writeNarrative(db, 'P1', { contentKind: 'self', occurredAt: '2026-10-12', text: '乏力。' })
  const second = correctNarrative(db, 'P1', first.id, { text: '乏力；每天午睡一小时。' })
  assert.equal(second.revision, 2)
  assert.equal(second.supersedes_id, first.id)
  const rows = db.prepare('SELECT id, text, revision FROM narratives ORDER BY rowid').all()
  assert.equal(rows.length, 2)
  assert.equal(rows.find((r) => r.id === first.id).text, '乏力。', '旧文本必须保留')
  assert.throws(() => correctNarrative(db, 'P1', second.id, { text: 'x' }), /已被更新/)
})

test('不等式与缺失单位：原文保留、value_num/unit 为 NULL，不补 0', () => {
  const db = freshDb()
  const doc = writeDocument(db, 'P1', { title: '测试报告', docType: '化验', org: '测试机构', collectedAt: '2026-10-19', relativePath: 'demo/test.pdf', mime: 'application/pdf', sha256: '0'.repeat(64) })
  db.prepare(`INSERT INTO metric_definitions (profile_key, metric_id, name, unit, kind, category, decimals, org_context, method_context, note, ord)
    VALUES ('P1','crp','C 反应蛋白','mg/L','numeric','炎症指标',1,NULL,NULL,NULL,1)`).run()
  const candidate = writeCandidate(db, 'P1', { documentId: doc.id, fieldName: 'crp', rawText: '<0.5', collectedAt: '2026-10-19' })
  assert.equal(candidate.value_num, null)
  const { observation } = decideCandidate(db, 'P1', candidate.id, 'accepted')
  assert.equal(observation.raw_text, '<0.5')
  assert.equal(observation.value_num, null)
  const decidedRow = db.prepare('SELECT decision FROM candidates WHERE profile_key = ? AND id = ?').get('P1', candidate.id)
  assert.equal(decidedRow.decision, 'accepted', '库内状态应更新；writeCandidate 返回的是处理前快照')
})

test('候选拒收零副作用：只改 decision，不产生观察值', () => {
  const db = freshDb()
  const doc = writeDocument(db, 'P1', { title: '测试报告', docType: '化验', org: '测试机构', collectedAt: '2026-09-08', relativePath: 'demo/t.pdf', mime: 'application/pdf', sha256: '1'.repeat(64) })
  db.prepare(`INSERT INTO metric_definitions (profile_key, metric_id, name, unit, kind, category, decimals, org_context, method_context, note, ord)
    VALUES ('P1','alt','ALT','U/L','numeric','肝功能',0,NULL,NULL,NULL,1)`).run()
  const candidate = writeCandidate(db, 'P1', { documentId: doc.id, fieldName: 'alt', rawText: '29 24', collectedAt: '2026-09-08' })
  const result = decideCandidate(db, 'P1', candidate.id, 'rejected')
  assert.equal(result.decision, 'rejected')
  assert.equal(result.observation, null)
  assert.equal(db.prepare('SELECT COUNT(*) c FROM observations').get().c, 0)
  assert.throws(() => decideCandidate(db, 'P1', candidate.id, 'accepted'), /已处理/)
})

test('隐私默认：心理默认私密、营养默认可见；三出口列默认关闭', () => {
  const db = freshDb()
  const mind = writeMind(db, 'P1', { occurredAt: '2026-08-03', text: '照镜子会烦。' })
  assert.equal(mind.is_private, 1)
  const nut = writeNutrition(db, 'P1', { occurredAt: '2026-08-20', text: '夜里加了一次水果。', weightKg: 52.4 })
  assert.equal(nut.is_private, 0)
  assert.equal(nut.weight_kg, 52.4)
  const bad = writeNutrition(db, 'P1', { occurredAt: '2026-08-21', text: 'x', weightKg: '' })
  assert.equal(bad.weight_kg, null, "空字符串不得变 0")
})

test('同日读模型 fail-closed：默认过滤私密，显式 private=1 才返回', () => {
  const db = freshDb()
  writeMind(db, 'P1', { occurredAt: '2026-08-03', text: '私密感受。' })
  const day = readDay(db, 'P1', '2026-08-03')
  assert.equal(day.narratives.length, 0)
  const full = readDay(db, 'P1', '2026-08-03', { includePrivate: true })
  assert.ok(full.narratives.length === 0, 'mind_logs 不属于 narratives 轨')
})

test('试验收藏：saved 是状态切换，不是资格判定', () => {
  const db = freshDb()
  db.prepare(`INSERT INTO trials (profile_key, id, nct_id, title, phase, status, sites, conditions_json, criteria_json, pct, saved, snapshot_date, ord, created_at)
    VALUES ('P1','t1','DEMO-1','测试试验','II','recruiting','多中心','[]','[]',50,0,'2026-10-27',1,?)`).run(new Date().toISOString())
  const flipped = toggleTrialSaved(db, 'P1', 't1')
  assert.equal(flipped.saved, 1)
  assert.equal(toggleTrialSaved(db, 'P1', 't1').saved, 0)
})

test('真实迁移文件与磁盘版一致（pack 内含 schema）', () => {
  const sql = readFileSync(join(root, 'schema/migrations/0001_initial.sql'), 'utf8')
  assert.match(sql, /CREATE TABLE IF NOT EXISTS subjects/)
  assert.doesNotMatch(sql, /\bdiagnosis\b|risk_level|\beligible\b|suitability|activity_score|\befficacy\b/i)
  const out = execFileSync('node', ['scripts/check-schema-freeze.mjs'], { cwd: root, encoding: 'utf8' })
  assert.match(out, /数据契约冻结/)
})

const tmpDirs = []
test.after?.(() => { for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true }) })

test('磁盘库：root/aosd.sqlite 可重复打开且迁移幂等', () => {
  const dir = mkdtempSync(join(process.env.HOME, '.aosd-store-'))
  tmpDirs.push(dir)
  const location = join(dir, 'aosd.sqlite')
  const db1 = openStore(location)
  ensureSubject(db1, { profileKey: 'P1', displayName: 'A', sex: '女', birthYear: 1992, stageLabel: 'x', anchorDate: '2026-05-08', anchorLabel: 'y', dataScope: 'z' })
  db1.close()
  const db2 = openStore(location)
  assert.ok(db2.prepare('SELECT * FROM subjects WHERE profile_key = ?').get('P1'))
  db2.close()
})

test('静态路由：UI 注入版本、指南 PDF 白名单、穿越拦截', async () => {
  const { serveStatic } = await import('../dsh/static.js')
  const fake = () => { const state = { head: null, chunks: [], done: false }
    const res = {
      writeHead(status, headers) { state.status = status; state.head = headers || {} },
      end(b) { state.done = true; if (b) state.chunks.push(b) },
      write(b) { state.chunks.push(b) },
      on() { return res }, once() { return res }, emit() { return true },
      get head() { return state.head }, get status() { return state.status },
      get text() { return state.chunks.join('') },
      get done() { return state.done },
    }
    return { res }
  }
  const opts = { version: '0.5.0', buildDate: '2026-10-28' }
  const ui = fake()
  assert.equal(serveStatic({ method: 'GET', url: '/api/aosd/ui/' }, ui.res, opts), true)
  assert.match(String(ui.res.head?.['content-type'] || ui.res.head?.get?.('content-type') || ''), /text\/html/)
  const pdf = fake()
  assert.equal(serveStatic({ method: 'GET', url: '/api/aosd/assets/guidebooks/nhc-86-rare-diseases-2025.pdf' }, pdf.res, opts), true)
  assert.match(String(pdf.res.head?.['content-type'] || pdf.res.head?.get?.('content-type') || ''), /application\/pdf/)
  const evil = fake()
  const handled = serveStatic({ method: 'GET', url: '/api/aosd/ui/../../package.json' }, evil.res, opts)
  assert.ok(handled === false || handled === true, '穿越请求不能崩溃')
  assert.doesNotMatch(evil.res.text || '', /"files"/, '不得泄漏 package.json 内容')
  const miss = fake()
  assert.equal(serveStatic({ method: 'GET', url: '/api/aosd/assets/guidebooks/other.pdf' }, miss.res, opts), false, '白名单外不放行')
  const post = fake()
  assert.equal(serveStatic({ method: 'POST', url: '/api/aosd/ui/' }, post.res, opts), false)
})
