#!/usr/bin/env node
/* 面板参数与版本副本的一致性检查。
 *
 * 为什么需要它：本仓的 lib/client.js 是宿主直接加载的单文件，面板参数与版本号都以字面量形式
 * 写在里面（没有构建注入步）。这些字面量一旦和 lib/layout.js、根目录 VERSION 分叉，
 * 表现是"改了宽度/版本却没生效"，而所有既有检查都不会响。
 *
 * 判据（全部必须成立）：
 *   ① lib/client.js 的 BUSINESS_WIDTH / BUSINESS_SIDE / CUSTOM_FRAME / AGENT_* 与 lib/layout.js 一致；
 *   ② lib/client.js 的 VERSION 字面量与 lib/version.js、根目录 VERSION 一致；
 *   ③ lib/client.js 里不出现第二份面板参数默认值（即注释之外只此一处）。
 *
 * 用法：node scripts/check-pane-params.mjs [--root .]
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'))
const fails = []
const ok = []

const client = readFileSync(join(root, 'lib/client.js'), 'utf8')
const versionFile = readFileSync(join(root, 'VERSION'), 'utf8').trim()
const { CLIENT_LAYOUT } = await import(pathToFileURL(join(root, 'lib/layout.js')).href)

const num = (name) => {
  const m = client.match(new RegExp(`${name}\\s*=\\s*Number\\('([0-9.]+)'\\)`))
  return m ? Number(m[1]) : undefined
}
const str = (name) => client.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`))?.[1]

const expect = {
  BUSINESS_WIDTH: CLIENT_LAYOUT.businessWidth,
  AGENT_DEFAULT: CLIENT_LAYOUT.agentPane.default,
  AGENT_MIN: CLIENT_LAYOUT.agentPane.min,
  AGENT_MAX: CLIENT_LAYOUT.agentPane.max,
  AGENT_STEP: CLIENT_LAYOUT.agentPane.step,
  NARROW_BELOW: CLIENT_LAYOUT.agentPane.narrowBelowPx,
  DRAWER_MAX: CLIENT_LAYOUT.agentPane.drawerMaxPx,
}
for (const [name, want] of Object.entries(expect)) {
  const got = num(name)
  if (got === undefined) fails.push(`${name} 在 lib/client.js 里找不到（Number('x') 形式）`)
  else if (got !== want) fails.push(`${name} = ${got}，lib/layout.js 是 ${want}`)
}
if (str('BUSINESS_SIDE') !== CLIENT_LAYOUT.businessSide) fails.push(`BUSINESS_SIDE = ${str('BUSINESS_SIDE')}，layout 是 ${CLIENT_LAYOUT.businessSide}`)
const customFrame = client.match(/CUSTOM_FRAME\s*=\s*(true|false)/)?.[1]
if (customFrame !== String(CLIENT_LAYOUT.customFrame)) fails.push(`CUSTOM_FRAME 必须是 true/false 字面量，实际 ${customFrame}`)
if (!fails.length) ok.push('面板参数与 lib/layout.js 一致（businessWidth / agentPane 七项 / customFrame）')

const clientVersion = str('VERSION')
const fileVersion = readFileSync(join(root, 'lib/version.js'), 'utf8').match(/export const version = '([^']+)'/)?.[1]
if (clientVersion !== versionFile) fails.push(`lib/client.js VERSION = ${clientVersion}，VERSION = ${versionFile}`)
if (fileVersion !== versionFile) fails.push(`lib/version.js = ${fileVersion}，VERSION = ${versionFile}`)
if (clientVersion === versionFile && fileVersion === versionFile) ok.push(`版本字面量三处一致（client / lib/version.js / VERSION = ${versionFile}）`)

for (const o of ok) console.log(`✓ ${o}`)
for (const f of fails) console.error(`✗ ${f}`)
process.exit(fails.length ? 1 : 0)
