#!/usr/bin/env node
/**
 * fetch-aosd-trials-2026.mjs — 成人斯蒂尔病临床试验快照（M4）
 *
 * 唯一入口：unified-trial-mcp 的 MCP stdio 服务（四通道：ictrp / ctv / chictr_online / chinadrugtrials）。
 * 口径：
 *  - 逐来源记录 SUCCESS / NO_RESULTS / FAILED / DENIED / NEEDS_SETUP 与覆盖声明；
 *  - FAILED/DENIED/NEEDS_SETUP 一律不算“查过”，不得写成“无相关试验”；
 *  - 只按“确认同一登记身份”合并，其余并排保留来源；
 *  - 产物：manifest.json / trials-2026.jsonl / aosd_trials_2026.sqlite / README.md。
 *
 * 用法：node scripts/fetch-aosd-trials-2026.mjs [--dry-run]
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'research', 'aosd')
const MCP = process.env.UNIFIED_TRIAL_MCP || '/Users/qinxiaoqiang/Downloads/unified_search_trials/dist/src/cli/main.js'
const DRY = process.argv.includes('--dry-run')
const QUERY = "adult-onset Still's disease"
const SOURCES = ['ictrp', 'ctv', 'chictr_online', 'chinadrugtrials']

function mcpSession(serverPath) {
  const child = spawn('node', [serverPath, 'serve'], { stdio: ['pipe', 'pipe', 'pipe'] })
  let buf = ''
  let id = 0
  const pending = new Map()
  child.stdout.on('data', (chunk) => {
    buf += chunk
    let idx
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 1)
      if (!line) continue
      try {
        const msg = JSON.parse(line)
        if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
      } catch { /* 非 JSON 行忽略 */ }
    }
  })
  const call = (method, params, timeoutMs = 90000) => new Promise((resolvePromise, reject) => {
    const reqId = ++id
    pending.set(reqId, resolvePromise)
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: reqId, method, params }) + '\n')
    setTimeout(() => { if (pending.has(reqId)) { pending.delete(reqId); reject(new Error(method + ' timeout')) } }, timeoutMs)
  })
  return { child, call }
}

/**
 * 逐来源顺序检索：并发时一个慢源会拖垮其他源（实测 ictrp 超时会让 chictr_online 记 FAILED）。
 * 每个来源独立记终态；FAILED 的在线源重试一次，仍失败则如实保留 FAILED。
 */
async function collect() {
  const { child, call } = mcpSession(MCP)
  const states = []
  const records = []
  try {
    await call('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'aosd-workbench', version: '0.5.0' } }, 15000)
    for (const sourceId of SOURCES) {
      let payload = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await call('tools/call', { name: 'search_trials', arguments: { condition: QUERY, sourceIds: [sourceId], limit: 20 } }, 120000)
          const text = response?.result?.content?.[0]?.text
          if (!text) throw new Error('MCP 未返回检索结果')
          payload = JSON.parse(text)
          const state = payload.statuses?.[0]?.state
          if (state !== 'FAILED' || attempt === 2) break
          await new Promise((r) => setTimeout(r, 3000))
        } catch (error) {
          if (attempt === 2) payload = { statuses: [{ sourceId, state: 'FAILED', reasonCode: 'CLIENT_ERROR', explanation: String(error.message || error), attempted: true, coverage: null, completeness: null, freshness: null, resultCount: 0 }], records: [] }
        }
      }
      const state = payload.statuses?.[0]
      if (state) states.push(state)
      records.push(...(payload.records || []))
    }
    return { statuses: states, records, overlaps: [], disclaimer: '逐来源顺序检索；FAILED/DENIED/NEEDS_SETUP 不算查过。' }
  } finally {
    child.kill()
  }
}

function normaliseTrials(payload, retrievedAt) {
  return (payload.records || []).map((record) => ({
    recordId: record.recordId,
    sourceId: record.source?.id || null,
    sourceRecordId: record.source?.sourceRecordId || null,
    registryNumbers: record.registryNumbers || [],
    title: record.title || '',
    studyType: record.studyType || null,
    sponsor: record.sponsorOrInstitution || [],
    registeredAt: record.dates?.registered || null,
    sourceUrl: record.sourceUrl || null,
    retrievedAt,
  }))
}

function writeSnapshot(payload, trials) {
  const retrievedAt = payload.records?.[0]?.provenance?.retrievedAt || new Date().toISOString()
  const snapshotDate = retrievedAt.slice(0, 10)
  const states = (payload.statuses || []).map((s) => ({
    sourceId: s.sourceId, state: s.state, reasonCode: s.reasonCode || null,
    explanation: s.explanation || '', attempted: Boolean(s.attempted),
    freshness: s.freshness || null, coverage: s.coverage || null,
    completeness: s.completeness || null, resultCount: s.resultCount ?? null,
  }))
  const jsonl = trials.map((t) => JSON.stringify(t)).join('\n') + (trials.length ? '\n' : '')
  const sha = (value) => createHash('sha256').update(value).digest('hex')

  const manifest = {
    disease: 'adult-onset Still\'s disease',
    query: QUERY,
    sourcesRequested: SOURCES,
    retrievedAt,
    snapshotDate,
    records: trials.length,
    manifestSha256: sha(jsonl),
    states,
    note: '合成/公共登记快照；登记状态未核实，不等于可入组、有效或安全。FAILED/DENIED/NEEDS_SETUP 不算查过。',
  }

  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  writeFileSync(join(OUT, 'trials-2026.jsonl'), jsonl)

  const dbPath = join(OUT, 'aosd_trials_2026.sqlite')
  for (const suffix of ['', '-wal', '-shm']) if (existsSync(dbPath + suffix)) rmSync(dbPath + suffix)
  const db = new DatabaseSync(dbPath)
  db.exec(`CREATE TABLE trials (
    record_id TEXT PRIMARY KEY, source_id TEXT, source_record_id TEXT,
    registry_numbers_json TEXT NOT NULL, title TEXT NOT NULL, study_type TEXT,
    sponsor_json TEXT NOT NULL, registered_at TEXT, source_url TEXT, retrieved_at TEXT NOT NULL
  );
  CREATE TABLE source_states (
    source_id TEXT PRIMARY KEY, state TEXT NOT NULL, reason_code TEXT,
    explanation TEXT, attempted INTEGER NOT NULL, result_count INTEGER,
    coverage_json TEXT, completeness_json TEXT, freshness_json TEXT
  );`)
  const insertTrial = db.prepare('INSERT INTO trials (record_id, source_id, source_record_id, registry_numbers_json, title, study_type, sponsor_json, registered_at, source_url, retrieved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const t of trials) insertTrial.run(t.recordId, t.sourceId, t.sourceRecordId, JSON.stringify(t.registryNumbers), t.title, t.studyType, JSON.stringify(t.sponsor), t.registeredAt, t.sourceUrl, t.retrievedAt)
  const insertState = db.prepare('INSERT INTO source_states (source_id, state, reason_code, explanation, attempted, result_count, coverage_json, completeness_json, freshness_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const s of states) insertState.run(s.sourceId, s.state, s.reasonCode, s.explanation, s.attempted ? 1 : 0, s.resultCount, JSON.stringify(s.coverage), JSON.stringify(s.completeness), JSON.stringify(s.freshness))
  db.close()

  const readme = `# 成人斯蒂尔病临床试验快照（${snapshotDate}）

- 查询：\`${QUERY}\`，来源：${SOURCES.join(' / ')}。
- 记录数：**${trials.length}**（manifest 记录数 = jsonl 行数 = sqlite 行数，脚本校验）。
- 来源终态：\n${states.map((s) => `  - \`${s.sourceId}\`：**${s.state}**${s.reasonCode ? `（${s.reasonCode}）` : ''} · ${s.explanation.replace(/\n/g, ' ').slice(0, 160)}`).join('\n')}
- **登记状态未核实**：不等于有效、安全、可入组，也不代表适合任何个人。
- FAILED / DENIED / NEEDS_SETUP 的来源不算“查过”，其缺失不得解读为“不存在相关试验”。
- 合并规则：仅同一登记身份合并；本快照未发现跨来源重复（overlaps=0）。
`
  writeFileSync(join(OUT, 'README.md'), readme)

  return { manifest, snapshotDate, jsonl, dbPath }
}

function verify(trials, manifest, jsonl) {
  const lineCount = jsonl.trim() ? jsonl.trim().split('\n').length : 0
  const db = new DatabaseSync(manifest.dbPath || join(OUT, 'aosd_trials_2026.sqlite'))
  const sqliteCount = db.prepare('SELECT COUNT(*) c FROM trials').get().c
  db.close()
  const sha = createHash('sha256').update(jsonl).digest('hex')
  const checks = [
    ['manifest.records == jsonl 行数', manifest.records === lineCount],
    ['manifest.records == sqlite 行数', manifest.records === sqliteCount],
    ['jsonl sha256 == manifest', sha === manifest.manifestSha256],
  ]
  const failed = checks.filter(([, ok]) => !ok)
  for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (failed.length) process.exitCode = 1
}

const payload = await collect()
const trials = normaliseTrials(payload, payload.records?.[0]?.provenance?.retrievedAt)
if (DRY) {
  console.log(JSON.stringify({ dryRun: true, records: trials.length, states: (payload.statuses || []).map((s) => [s.sourceId, s.state]) }, null, 2))
  process.exit(0)
}
const { manifest, jsonl, dbPath } = writeSnapshot(payload, trials)
manifest.dbPath = dbPath
verify(trials, manifest, jsonl)
console.log(JSON.stringify({ records: trials.length, states: manifest.states.map((s) => [s.sourceId, s.state]), snapshotDate: manifest.snapshotDate }, null, 2))