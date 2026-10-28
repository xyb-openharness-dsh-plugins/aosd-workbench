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
const baselines = JSON.parse(read('reference/baselines/navigation.json')).sources
for (const { id: name, pages: baseline, expectedOverlapRate: expected } of baselines) {
  check(typeof expected === 'number', `${name} 缺期望重名率`)
  const overlap = pages.filter((page) => baseline.includes(page))
  const rate = overlap.length / pages.length
  check(rate === expected && rate <= .7, `${name} 一级重名率 ${rate} ≠ ${expected}`)
}

check(/send:true/.test(interaction) && /34 号/.test(interaction), 'AI 交互未按34号一键发送合同')
check(/config\.root/.test(spec) && /唯一数据库/.test(spec), '未选外部目录的事实库落点不清')
check(/未获相应授权的内容不得写入患者共享档案，\*\*默认不持久化未授权草稿\*\*/.test(spec), '未授权代记默认持久化边界缺失')
check(/采样\/报告日期及各自精度/.test(spec) && /revision\/原件hash/.test(spec), '指标日期或快照revision合同缺失')
const settings = read('docs/SETTINGS-DESIGN.md')
check(!/临床试验区域/.test(settings) && !/研究匹配入口/.test(settings), '一期设置仍残留临床研究区域')
check(!/只保留公共线索位置/.test(scenarios), '一期场景仍残留研究占位')

const app = read('prototypes/v0.2/app.js')
const requiredPages = ['dashboard', 'voices', 'day', 'documents', 'metrics', 'timeline', 'treatment', 'trials', 'nutrition', 'mind', 'visit', 'resources']
for (const page of requiredPages) {
  check(app.includes(`['${page}',`), `导航缺页面 ${page}`)
}
check(/viewTimeline/.test(app) && /monotonePath/.test(app), '一图秀未实现')
check(/metricCards/.test(app) && /rotateY\(180deg\)/.test(read('prototypes/v0.2/style.css')), '指标卡缺少翻面实现')
check(/viewTrials/.test(app) && /基础建档/.test(app) && /结果分析/.test(app), '临床研究缺三页结构')
check(/data-primer-open/.test(app) && /DISEASE_PRIMER/.test(app), '36号疾病概要入口缺失')
check(/viewNutrition/.test(app) && /viewMind/.test(app), '营养或心理页缺失')
check(/openManualRecord/.test(app) && /demoCandidates/.test(app), '手工/AI写入演示链缺失')
check(/data-action="upload"/.test(app) && /逐项确认/.test(app), '上传-解析-确认闭环缺失')
check(/本地阅读/.test(interaction) && /官方 PDF/.test(interaction), '指南缺本地/官方双入口')
check(!spec.includes('G1 已签') && !interaction.includes('已签认，不能'), '草案不得冒充已签G1')

if (failures.length) {
  console.error(failures.map((x) => `FAIL ${x}`).join('\n'))
  process.exit(1)
}
console.log(`PASS M1 contract：8场景双向存在、0访谈声明、两组基准重名率均<=70%、34号发送与指南双入口；不含患者价值/医学审核判断`)
