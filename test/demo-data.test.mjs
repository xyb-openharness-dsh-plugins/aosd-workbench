import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDemoProfiles, buildDemoDatabase, readDemoFromDatabase } from '../demo/build-demo-data.mjs'

const data = buildDemoProfiles()

test('两套档案均为合成数据且处于 6 个月窗口', () => {
  assert.equal(data.meta.synthetic, true)
  assert.deepEqual(data.meta.window, { start: '2026-04-27', end: '2026-10-27' })
  assert.deepEqual(Object.keys(data.profiles), ['A', 'B'])
  for (const profile of Object.values(data.profiles)) {
    assert.match(profile.tag, /合成/)
    for (const doc of profile.documents) {
      assert.ok(doc.collectedAt >= data.meta.window.start && doc.collectedAt <= data.meta.window.end, doc.id)
    }
    for (const observation of profile.observations) {
      assert.ok(observation.collectedAt >= data.meta.window.start && observation.collectedAt <= data.meta.window.end, observation.id)
    }
  }
})

test('SQLite 与 JS 数据同源，字段逐一相等', () => {
  const db = buildDemoDatabase(':memory:')
  const fromDb = readDemoFromDatabase(db)
  db.close()
  for (const key of ['A', 'B']) {
    const js = data.profiles[key]
    const dbP = fromDb.profiles[key]
    assert.equal(dbP.displayName, js.displayName)
    for (const field of ['narratives', 'documents', 'candidates', 'metrics', 'observations', 'medications', 'replies', 'questions', 'snapshots']) {
      assert.equal(dbP[field].length, js[field].length, `${key}.${field} 条数`)
      assert.deepEqual(
        dbP[field].map((row) => row.id ?? row.metricId),
        js[field].map((row) => row.id ?? row.metricId),
        `${key}.${field} 主键顺序`,
      )
    }
  }
})

test('分类指标不进入数值序列，缺单位/缺上限/不等式保留为空', () => {
  for (const profile of Object.values(data.profiles)) {
    const qual = profile.metrics.filter((m) => m.kind === 'qual')
    const qualIds = new Set(qual.map((m) => m.id))
    for (const metric of qual) {
      assert.equal(metric.unit, null)
      assert.equal(metric.decimals, null)
    }
    for (const observation of profile.observations.filter((o) => qualIds.has(o.metricId))) {
      assert.equal(observation.valueNum, null, observation.id)
      assert.equal(observation.unit, null, observation.id)
    }
  }
  const inequality = data.profiles.A.observations.find((o) => o.rawText === '<0.5')
  assert.ok(inequality)
  assert.equal(inequality.valueNum, null)
  const missingUnit = data.profiles.B.observations.find((o) => o.metricId === 'rf')
  assert.equal(missingUnit.unit, null)
  const missingHigh = data.profiles.B.observations.find((o) => o.metricId === 'alt' && o.refHigh === null)
  assert.ok(missingHigh)
})

test('三类叙述、授权默认与私密记录可区分', () => {
  const kinds = new Set(data.profiles.A.narratives.map((n) => n.contentKind))
  assert.ok(kinds.has('self') && kinds.has('family_observation') && kinds.has('family_relay'))
  const relay = data.profiles.A.narratives.find((n) => n.contentKind === 'family_relay')
  assert.equal(relay.experiencedBy, 'patient')
  assert.equal(relay.recordedBy, 'mother')
  const priv = data.profiles.A.narratives.find((n) => n.isPrivate)
  assert.equal(priv.familyVisible, false)
  assert.equal(priv.exportAllowed, false)
  assert.equal(priv.aiAllowed, false)
  const revised = data.profiles.A.narratives.filter((n) => n.id.startsWith('n-A-12'))
  assert.equal(revised.length, 2)
  assert.equal(revised[1].supersedesId, revised[0].id)
})

test('候选拒收不进入观察值；未解析文档无确认指标', () => {
  /* 断言的是规则而不是固定条数：任何候选（含拒收/待核对）都不直接等于观察值。 */
  for (const profile of Object.values(data.profiles)) {
    const observationIds = new Set(profile.observations.map((o) => o.id))
    for (const candidate of profile.candidates) {
      assert.ok(!observationIds.has(candidate.id), `候选不应直接进入观察值：${candidate.id}`)
    }
  }
  assert.ok(data.profiles.A.candidates.some((c) => c.decision === 'pending'))
  assert.equal(data.profiles.B.candidates.filter((c) => c.decision === 'rejected').length, 1)
  const unparsed = data.profiles.B.documents.find((d) => d.reviewState === 'unverified')
  assert.ok(unparsed)
  assert.equal(data.profiles.B.observations.filter((o) => o.documentId === unparsed.id).length, 0)
})

test('就诊快照保存所选 revision/hash/review_state 并可标记过时', () => {
  const stale = data.profiles.A.snapshots.find((s) => s.stale)
  assert.ok(stale)
  assert.equal(stale.reviewStates['n-A-12'], 'confirmed')
  for (const snapshot of [...data.profiles.A.snapshots, ...data.profiles.B.snapshots]) {
    assert.match(snapshot.sha256, /^[0-9a-f]{64}$/)
    assert.ok(snapshot.itemIds.length > 0)
    assert.ok(snapshot.questionIds.length > 0)
  }
})

test('不含任何判读列名', () => {
  const db = buildDemoDatabase(':memory:')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  assert.ok(tables.length > 0)
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name)
    for (const banned of ['diagnosis', 'risk_level', 'eligible', 'suitability', 'activity_score', 'efficacy']) {
      assert.ok(!columns.includes(banned), `${table}.${banned}`)
    }
  }
  db.close()
})
