import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { scanProject, scanText } from '../scripts/check-derivative-leftovers.mjs'

test('业务文件中的底本残留仍然命中', () => {
  // 负例词表只在运行中拼接，测试文件自身不是患者可见产物。
  const legacyBrand = ['Cervi', 'Pal'].join('')
  const hits = scanText(`const brand = '${legacyBrand}'`, 'public/app.js')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].file, 'public/app.js')
})

test('仅检查器自己的规则与测试样本不扫描', () => {
  const result = scanProject(new URL('..', import.meta.url).pathname)
  assert.equal(result.hits.length, 0, JSON.stringify(result.hits))
})

test('临时项目里的业务残留不会被检查器豁免吞掉', () => {
  const root = mkdtempSync(join(process.env.HOME, '.aosd-check-'))
  mkdirSync(join(root, 'public'))
  writeFileSync(join(root, 'public/app.js'), `const brand = '${['Cervi', 'Pal'].join('')}'\n`)
  const result = scanProject(root)
  assert.equal(result.hits.length, 1)
  assert.equal(result.hits[0].file, 'public/app.js')
})
