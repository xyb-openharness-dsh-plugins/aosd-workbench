#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

const scenarios = read('docs/SCENARIOS.md')
const interaction = read('docs/INTERACTION-DESIGN.md')
const users = read('docs/USER-RESEARCH.md')
const spec = read('docs/SPEC.md')
for (let i = 1; i <= 8; i++) {
  const id = `S${String(i).padStart(2, '0')}`
  check(scenarios.includes(id), `场景清单缺 ${id}`)
  check(interaction.includes(id), `交互路径缺 ${id}`)
}
check(/真实患者访谈 \*\*0\*\*/.test(users) && /真实家属访谈 \*\*0\*\*/.test(users), '用户研究未明确患者与家属访谈均为0')
check(/临床审核 \*\*0\*\*/.test(users), '用户研究未明确临床审核为0')
check(!/患者原话[：:]\s*[“"]/.test(scenarios), '不得把设计假设标成患者原话')

const pages = ['看板', '本人与代记', '同日经过', '报告与核对', '指标回看', '用药与医嘱', '复诊准备', '疾病与资源']
const cervical = ['看板', '病情整理', '我的分期', '治疗历程', '性与生育', '放疗与长期影响', '检查与指标', '病情一图秀', '营养支持', '心理支持', '复诊准备', '临床研究']
const breast = ['看板', '病情整理', '病情一图秀', '临床', '营养支持', '心理支持', '全程与康复', '收藏与回顾']
for (const [name, baseline, expected] of [['cervical', cervical, .25], ['breast', breast, .125]]) {
  const overlap = pages.filter((page) => baseline.includes(page))
  const rate = overlap.length / pages.length
  check(rate === expected && rate <= .7, `${name} 一级重名率 ${rate} ≠ ${expected}`)
}

check(/send:true/.test(interaction) && /34 号/.test(interaction), 'AI 交互未按34号一键发送合同')
check(/本地阅读/.test(interaction) && /官方 PDF/.test(interaction), '指南缺本地/官方双入口')
check(!spec.includes('G1 已签') && !interaction.includes('已签认，不能'), '草案不得冒充已签G1')

if (failures.length) {
  console.error(failures.map((x) => `FAIL ${x}`).join('\n'))
  process.exit(1)
}
console.log(`PASS M1 contract：8场景双向存在、0访谈声明、重名率 cervical=25% breast=12.5%、34号发送与指南双入口；不含患者价值/医学审核判断`)
