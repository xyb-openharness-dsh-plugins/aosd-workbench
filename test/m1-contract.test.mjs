import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const file = 'assets/guidebooks/nhc-86-rare-diseases-2025.pdf'
const manifest = JSON.parse(readFileSync(new URL('../assets/guidebooks/manifest.json', import.meta.url), 'utf8'))
const doc = manifest.documents.find((entry) => entry.id === 'nhc-86-rare-diseases-2025')

test('官方 PDF 的版本、页数、章节和 sha256 与实算一致', () => {
  const bytes = readFileSync(new URL(`../${file}`, import.meta.url))
  assert.equal(doc.version, '2025年版')
  assert.equal(doc.pages, 517)
  assert.deepEqual(doc.chapters[0].printedPages, '17-21')
  assert.deepEqual(doc.chapters[0].pdfPages, '21-25')
  assert.equal(bytes.length, 15611195)
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.equal(createHash('sha256').update(bytes).digest('hex'), doc.sha256)
  assert.match(doc.url, /^https:\/\/www\.gov\.cn\/.+\.pdf$/)
})

test('真实 npm pack 清单包含本地指南，而非只存在源码树', () => {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const entries = JSON.parse(output)[0].files.map((entry) => entry.path)
  assert.ok(entries.includes(file), entries.join(', '))
  assert.ok(entries.includes('assets/guidebooks/manifest.json'))
})

test('资产清单与指南 manifest 指向同一 hash 和来源', () => {
  const assets = JSON.parse(readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8'))
  const asset = assets.assets.find((entry) => entry.path === file.replace(/^assets\//, ''))
  assert.ok(asset)
  assert.equal(asset.sha256, doc.sha256)
  assert.equal(asset.source, doc.url)
  assert.equal(asset.bytes, 15611195)
  assert.ok(existsSync(new URL(`../${file}`, import.meta.url)))
})
