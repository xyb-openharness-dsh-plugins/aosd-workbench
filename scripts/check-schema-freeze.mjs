#!/usr/bin/env node
/**
 * check-schema-freeze.mjs — 数据契约闸门
 *  1) schema/migrations/0001_initial.sql 的 sha256 必须与 schema/freeze-contract.md 记录一致；
 *  2) 迁移文件内禁用判读列（diagnosis/risk_level/eligible/suitability/activity_score/efficacy）；
 *  3) freeze-contract.md 引用的关键表必须真实存在于 0001。
 * 用法：node scripts/check-schema-freeze.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const migration = join(ROOT, 'schema/migrations/0001_initial.sql')
const contract = join(ROOT, 'schema/freeze-contract.md')
const fails = []

if (!existsSync(migration)) {
  console.error('✗ 缺 schema/migrations/0001_initial.sql（数据层未建）')
  process.exit(1)
}
if (!existsSync(contract)) {
  console.error('✗ 缺 schema/freeze-contract.md（冻结前不得写业务库）')
  process.exit(1)
}

const sql = readFileSync(migration, 'utf8')
const actual = createHash('sha256').update(sql).digest('hex')
const doc = readFileSync(contract, 'utf8')
const recorded = doc.match(/SHA-256：`([0-9a-f]{64})`/)?.[1]
if (!recorded) fails.push('freeze-contract.md 里没有 SHA-256 记录')
else if (recorded !== actual) fails.push(`freeze SHA 不一致：contract=${recorded.slice(0, 12)}… actual=${actual.slice(0, 12)}…（改结构必须新增 0002，不改 0001）`)

const banned = ['diagnosis', 'risk_level', 'eligible', 'suitability', 'activity_score', 'efficacy']
for (const word of banned) {
  if (new RegExp(`\\b${word}\\b`, 'i').test(sql)) fails.push(`0001 出现禁用判读列：${word}`)
}

const tables = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/g)].map((m) => m[1])
for (const required of ['subjects', 'narratives', 'documents', 'candidates', 'metric_definitions', 'observations', 'medication_events', 'clinical_replies', 'questions', 'nutrition_logs', 'mind_logs', 'trial_profiles', 'trials', 'visit_snapshots', 'meta']) {
  if (!tables.includes(required)) fails.push(`0001 缺关键表：${required}`)
}

if (fails.length) {
  console.error(fails.map((x) => `✗ ${x}`).join('\n'))
  process.exit(1)
}
console.log(`✓ 数据契约冻结：SHA-256 一致（${actual.slice(0, 12)}…），${tables.length} 张表，无判读列`)
