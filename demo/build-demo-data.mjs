#!/usr/bin/env node
/**
 * demo/build-demo-data.mjs — 两套合成患者档案（6 个月窗口）的唯一数据源。
 *
 * 产出：
 *   demo/demo-data.sqlite           （本机核对/后续 API 用，派生文件，不入库）
 *   prototypes/v0.2/demo-data.js    （原型 file:// 直接加载）
 *
 * 纪律：
 *  - 全部为合成数据（synthetic），不含真实姓名、医院、病历号或联系方式；
 *  - 日期窗口 2026-04-27 ~ 2026-10-27；化验按 2–4 周一点并延续到窗口末尾；
 *  - 所有 INSERT 写显式列名；可空值显式 null；复合主键读取 ORDER BY rowid；
 *  - 分类指标 kind='qual'、unit/dec 为 NULL，不进入数值序列；
 *  - 只记录“谁、何时、在哪、原文是什么”，不生成诊断/活动度/风险/疗效判断。
 */
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GENERATED_AT = '2026-10-27T12:00:00+08:00'
const WINDOW = { start: '2026-04-27', end: '2026-10-27' }
const demoHash = (seed) => createHash('sha256').update(String(seed)).digest('hex')

const sections = () => [
  { key: 'today', title: '今天', ord: 1 },
  { key: 'voices', title: '本人与代记', ord: 2 },
  { key: 'day', title: '同日经过', ord: 3 },
  { key: 'documents', title: '报告与核对', ord: 4 },
  { key: 'metrics', title: '指标回看', ord: 5 },
  { key: 'medications', title: '用药与医嘱', ord: 6 },
  { key: 'visit', title: '复诊准备', ord: 7 },
  { key: 'resources', title: '疾病与资源', ord: 8 },
]

/* ---------- 档案 A：系统型病程，母亲参与代记 ---------- */
const A = {
  key: 'A',
  displayName: '演示档案 A · 系统型病程（合成）',
  sex: '女',
  birthYear: 1992,
  tag: 'DEMO-A · 合成 · 系统型 · 家属代记',
  stageLabel: '医生记录：成人斯蒂尔病（2026-05）',
  anchorDate: '2026-05-08',
  anchorLabel: '首次风湿免疫科门诊',
  dataScope: '2026-04-27 至 2026-10-27 · 全部合成',
  sections: sections(),
  narratives: [
    { id: 'n-A-01', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-05-02', recordedAt: '2026-05-02T09:20:00+08:00', text: '连着三晚发热，最高 39.2℃，晚上起来，早上自己退。', impact: '没法上班', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 1 },
    { id: 'n-A-02', experiencedBy: 'family', contentKind: 'family_observation', speaker: 'mother', recordedBy: 'mother', relationship: '母亲', occurredAt: '2026-05-06', recordedAt: '2026-05-06T21:05:00+08:00', text: '躯干上一片一片红，热退下去就淡了；她不让我拍照。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 2 },
    { id: 'n-A-03', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-05-08', recordedAt: '2026-05-08T08:40:00+08:00', text: '咽痛两天，吞咽时明显。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 3 },
    { id: 'n-A-04', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-05-13', recordedAt: '2026-05-13T19:10:00+08:00', text: '膝盖和手腕疼，走路下楼要扶栏杆。', impact: '下楼困难', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 4 },
    { id: 'n-A-05', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-06-02', recordedAt: '2026-06-02T16:00:00+08:00', text: '这几天特别累，下午只能躺着，工作请了假。', impact: '请假三天', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 5 },
    { id: 'n-A-06', experiencedBy: 'patient', contentKind: 'family_relay', speaker: 'patient', recordedBy: 'mother', relationship: '母亲', occurredAt: '2026-06-20', recordedAt: '2026-06-20T18:30:00+08:00', text: '她说今天关节没那么疼，想下楼走走。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 6 },
    { id: 'n-A-07', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-07-08', recordedAt: '2026-07-08T20:15:00+08:00', text: '又发热了，38.7℃，伴皮疹。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 7 },
    { id: 'n-A-08', experiencedBy: 'family', contentKind: 'family_observation', speaker: 'mother', recordedBy: 'mother', relationship: '母亲', occurredAt: '2026-07-11', recordedAt: '2026-07-11T12:10:00+08:00', text: '这两天精神差，吃得少，问她只说没事。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 8 },
    { id: 'n-A-09', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-08-03', recordedAt: '2026-08-03T22:00:00+08:00', text: '担心一直吃激素，脸变大，照镜子不想出门。', impact: '不想出门', isPrivate: true, familyVisible: false, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 9 },
    { id: 'n-A-10', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-09-02', recordedAt: '2026-09-02T09:05:00+08:00', text: '昨天打完针，晚上低热 37.8℃，今天早上退了。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 10 },
    { id: 'n-A-11', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-09-30', recordedAt: '2026-09-30T21:40:00+08:00', text: '手臂内侧又起了淡红色疹子，不痒。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 11 },
    { id: 'n-A-12', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-10-12', recordedAt: '2026-10-12T17:20:00+08:00', text: '乏力，走两层楼要歇一下。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 12 },
    { id: 'n-A-12b', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-10-12', recordedAt: '2026-10-14T08:30:00+08:00', text: '乏力，走两层楼要歇一下；这周每天午睡一小时。', impact: '午睡一小时', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 2, supersedesId: 'n-A-12', ord: 13 },
    { id: 'n-A-13', experiencedBy: 'patient', contentKind: 'family_relay', speaker: 'patient', recordedBy: 'mother', relationship: '母亲', occurredAt: '2026-10-20', recordedAt: '2026-10-20T19:00:00+08:00', text: '她说复查抽血结果出来了，想下次门诊一起问。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 14 },
  ],
  documents: [
    { id: 'A-doc-lab-2026-05-04', title: '血常规 + 炎症指标 + 生化', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-05-04', reportedAt: '2026-05-04', timePrecision: 'day', relativePath: 'demo/docs/A/2026-05-04-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告；原值照抄，未做判读。', ord: 1 },
    { id: 'A-doc-lab-2026-05-25', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-05-25', reportedAt: '2026-05-25', timePrecision: 'day', relativePath: 'demo/docs/A/2026-05-25-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 2 },
    { id: 'A-doc-lab-2026-06-15', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-06-15', reportedAt: '2026-06-15', timePrecision: 'day', relativePath: 'demo/docs/A/2026-06-15-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 3 },
    { id: 'A-doc-lab-2026-07-06', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-07-06', reportedAt: '2026-07-06', timePrecision: 'day', relativePath: 'demo/docs/A/2026-07-06-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 4 },
    { id: 'A-doc-lab-2026-07-27', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-07-27', reportedAt: '2026-07-27', timePrecision: 'day', relativePath: 'demo/docs/A/2026-07-27-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 5 },
    { id: 'A-doc-lab-2026-08-17', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-08-17', reportedAt: '2026-08-17', timePrecision: 'day', relativePath: 'demo/docs/A/2026-08-17-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 6 },
    { id: 'A-doc-lab-2026-09-07', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-09-07', reportedAt: '2026-09-07', timePrecision: 'day', relativePath: 'demo/docs/A/2026-09-07-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 7 },
    { id: 'A-doc-lab-2026-09-28', title: '血常规 + 炎症指标', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-09-28', reportedAt: '2026-09-28', timePrecision: 'day', relativePath: 'demo/docs/A/2026-09-28-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 8 },
    { id: 'A-doc-lab-2026-10-19', title: '血常规 + 炎症指标 + 铁蛋白 + IL-6', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-10-19', reportedAt: '2026-10-19', timePrecision: 'day', relativePath: 'demo/docs/A/2026-10-19-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告；IL-6 原文为“<0.5”。', ord: 9 },
    { id: 'A-doc-ct-2026-08-18', title: '胸部 CT（合成）', docType: '影像', org: '演示医院·影像科', collectedAt: '2026-08-18', reportedAt: '2026-08-19', timePrecision: 'day', relativePath: 'demo/docs/A/2026-08-18-ct.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成影像报告原文，无真实影像文件。', ord: 10 },
    { id: 'A-doc-note-2026-10-09', title: '门诊病历（合成）', docType: '门诊病历', org: '演示医院·风湿免疫科', collectedAt: '2026-10-09', reportedAt: '2026-10-09', timePrecision: 'day', relativePath: 'demo/docs/A/2026-10-09-note.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成病历；医嘱原话见“用药与医嘱”。', ord: 11 },
  ],
  candidates: [
    { id: 'c-A-01', documentId: 'A-doc-lab-2026-10-19', fieldName: 'C 反应蛋白', rawText: '5', valueText: '5', valueNum: 5, unit: 'mg/L', refLow: 0, refHigh: 8, collectedAt: '2026-10-19', decision: 'pending', note: '待逐项核对；未入事实。', ord: 1 },
    { id: 'c-A-02', documentId: 'A-doc-lab-2026-10-19', fieldName: '铁蛋白', rawText: '170', valueText: '170', valueNum: 170, unit: 'ng/mL', refLow: 15, refHigh: 150, collectedAt: '2026-10-19', decision: 'pending', note: '待逐项核对；未入事实。', ord: 2 },
  ],
  metrics: [
    { id: 'crp', name: 'C 反应蛋白', unit: 'mg/L', kind: 'numeric', category: '炎症指标', decimals: 1, orgContext: '演示医院', methodContext: '免疫比浊法（合成）', note: '参考范围来自合成报告，不是通用标准。', ord: 1 },
    { id: 'esr', name: '红细胞沉降率', unit: 'mm/h', kind: 'numeric', category: '炎症指标', decimals: 0, orgContext: '演示医院', methodContext: '魏氏法（合成）', note: '参考范围来自合成报告。', ord: 2 },
    { id: 'ferritin', name: '铁蛋白', unit: 'ng/mL', kind: 'numeric', category: '炎症指标', decimals: 0, orgContext: '演示医院', methodContext: '化学发光法（合成）', note: '参考范围来自合成报告。', ord: 3 },
    { id: 'wbc', name: '白细胞计数', unit: '×10⁹/L', kind: 'numeric', category: '血常规', decimals: 1, orgContext: '演示医院', methodContext: '流式法（合成）', note: '参考范围来自合成报告。', ord: 4 },
    { id: 'neutrophil_pct', name: '中性粒细胞百分比', unit: '%', kind: 'numeric', category: '血常规', decimals: 0, orgContext: '演示医院', methodContext: '流式法（合成）', note: '参考范围来自合成报告。', ord: 5 },
    { id: 'alt', name: '丙氨酸氨基转移酶', unit: 'U/L', kind: 'numeric', category: '肝功能', decimals: 0, orgContext: '演示医院', methodContext: '速率法（合成）', note: '参考范围来自合成报告。', ord: 6 },
    { id: 'hgb', name: '血红蛋白', unit: 'g/L', kind: 'numeric', category: '血常规', decimals: 0, orgContext: '演示医院', methodContext: '比色法（合成）', note: '参考范围来自合成报告。', ord: 7 },
    { id: 'plt', name: '血小板计数', unit: '×10⁹/L', kind: 'numeric', category: '血常规', decimals: 0, orgContext: '演示医院', methodContext: '流式法（合成）', note: '参考范围来自合成报告。', ord: 8 },
    { id: 'il6', name: '白介素-6', unit: 'pg/mL', kind: 'numeric', category: '炎症指标', decimals: 1, orgContext: '演示医院', methodContext: '化学发光法（合成）', note: '仅 1 次记录，原文“<0.5”；不连线。', ord: 9 },
    { id: 'rash_extent', name: '皮疹范围（自述分类）', unit: null, kind: 'qual', category: '自述分类', decimals: null, orgContext: null, methodContext: null, note: '患者自述分类，不是医学分级，不进入数值序列。', ord: 10 },
  ],
  observations: [],
  medications: [
    { id: 'm-A-01', drugName: '泼尼松', doseText: '30 mg 口服 每日一次', route: '口服', eventKind: 'planned', startedOn: '2026-05-08', endedOn: null, note: '首次门诊医嘱起始；原文照抄。', doctorQuote: '先完善感染和肿瘤筛查；泼尼松 30 mg 起始。', patientUnderstanding: '开始激素，等筛查结果。', sourceDocumentId: 'A-doc-note-2026-10-09', revision: 1, ord: 1 },
    { id: 'm-A-02', drugName: '泼尼松', doseText: '20 mg 口服 每日一次', route: '口服', eventKind: 'planned', startedOn: '2026-06-19', endedOn: null, note: '复诊调整；剂量按门诊记录原文。', doctorQuote: '炎症指标下来了，激素减到 20 mg。', patientUnderstanding: '减量，两周复查。', sourceDocumentId: null, revision: 1, ord: 2 },
    { id: 'm-A-03', drugName: '泼尼松', doseText: '15 mg 口服 每日一次', route: '口服', eventKind: 'planned', startedOn: '2026-07-31', endedOn: null, note: '复诊调整。', doctorQuote: '维持 15 mg，下次复查再评估。', patientUnderstanding: '先维持。', sourceDocumentId: null, revision: 1, ord: 3 },
    { id: 'm-A-04', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注 每 4 周', route: '静脉', eventKind: 'planned', startedOn: '2026-05-15', endedOn: null, note: '计划输注；实际日期逐次记录。', doctorQuote: '托珠单抗继续，不要自行停药。', patientUnderstanding: '每四周一次。', sourceDocumentId: null, revision: 1, ord: 4 },
    { id: 'm-A-05', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-05-15', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 5 },
    { id: 'm-A-06', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-06-12', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 6 },
    { id: 'm-A-07', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-07-10', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 7 },
    { id: 'm-A-08', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-08-07', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 8 },
    { id: 'm-A-09', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-09-04', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 9 },
    { id: 'm-A-10', drugName: '托珠单抗', doseText: '8 mg/kg 静脉输注', route: '静脉', eventKind: 'actual', startedOn: '2026-10-02', endedOn: null, note: '实际输注。', doctorQuote: null, patientUnderstanding: null, sourceDocumentId: null, revision: 1, ord: 10 },
    { id: 'm-A-11', drugName: '甲氨蝶呤', doseText: '10 mg 口服 每周一次', route: '口服', eventKind: 'planned', startedOn: '2026-09-11', endedOn: null, note: '因关节症状加用（合成）；实际服用未逐次记录。', doctorQuote: '关节症状还在，加甲氨蝶呤 10 mg 每周。', patientUnderstanding: '每周一次。', sourceDocumentId: null, revision: 1, ord: 11 },
  ],
  nutrition: [
    { id: 'nut-A-01', occurredAt: '2026-05-13', text: '这两天胃口差，只吃了半碗粥。', intake: '半碗粥', weightKg: null, note: '发热期间记录', isPrivate: false, ord: 1 },
    { id: 'nut-A-02', occurredAt: '2026-06-02', text: '下午特别累，午饭没吃，晚上补了一小碗面。', intake: '一小碗面', weightKg: null, note: null, isPrivate: false, ord: 2 },
    { id: 'nut-A-03', occurredAt: '2026-07-11', text: '家人说这两天吃得少。', intake: '少于平时', weightKg: null, note: '家属观察', isPrivate: false, ord: 3 },
    { id: 'nut-A-04', occurredAt: '2026-08-20', text: '激素后容易饿，夜里加了一次水果。', intake: '水果一份', weightKg: 52.4, note: '体重为家用秤自测', isPrivate: false, ord: 4 },
    { id: 'nut-A-05', occurredAt: '2026-09-18', text: '胃口比上个月好，能吃完一份午饭。', intake: '一份午饭', weightKg: 53.1, note: null, isPrivate: false, ord: 5 },
    { id: 'nut-A-06', occurredAt: '2026-10-15', text: '早上恶心，只喝了豆浆。', intake: '豆浆一杯', weightKg: 52.8, note: null, isPrivate: false, ord: 6 },
  ],
  mind: [
    { id: 'mind-A-01', occurredAt: '2026-06-10', text: '担心长期吃激素，脸变圆，不想见朋友。', mood: '低落', sleep: '入睡难', isPrivate: true, note: '默认私密，不导出、不发送 AI', ord: 1 },
    { id: 'mind-A-02', occurredAt: '2026-08-03', text: '照镜子会烦，但今天愿意出门走一圈。', mood: '复杂', sleep: '尚可', isPrivate: true, note: null, ord: 2 },
    { id: 'mind-A-03', occurredAt: '2026-09-22', text: '和妈妈聊了复查的事，心里踏实一点。', mood: '平稳', sleep: '尚可', isPrivate: false, note: '患者选择可让家属看到', ord: 3 },
    { id: 'mind-A-04', occurredAt: '2026-10-12', text: '工作请假多了，怕同事问。', mood: '焦虑', sleep: '一般', isPrivate: true, note: null, ord: 4 },
  ],
  profileDoc: {
    definition: '成人斯蒂尔病是一种罕见、病因不明的自身炎症性疾病。',
    diagnosisText: '医生记录：成人斯蒂尔病（2026-05，首次风湿免疫科门诊）。',
    keyReports: ['A-doc-lab-2026-05-04', 'A-doc-note-2026-10-09'],
    careTeam: ['演示医院 · 风湿免疫科'],
  },
  replies: [
    { id: 'r-A-01', occurredAt: '2026-05-08', speaker: '医生', dept: '风湿免疫科', quote: '考虑成人斯蒂尔病，先完善感染和肿瘤筛查；泼尼松 30 mg 起始。', patientUnderstanding: '开始激素，等筛查结果。', relatedQuestionId: null, ord: 1 },
    { id: 'r-A-02', occurredAt: '2026-06-19', speaker: '医生', dept: '风湿免疫科', quote: '炎症指标下来了，激素减到 20 mg，两周复查。', patientUnderstanding: '减量，两周复查。', relatedQuestionId: 'q-A-01', ord: 2 },
    { id: 'r-A-03', occurredAt: '2026-08-14', speaker: '医生', dept: '风湿免疫科', quote: '托珠单抗继续，发热再出现先联系门诊；不要自行停药。', patientUnderstanding: '发热先联系门诊。', relatedQuestionId: 'q-A-02', ord: 3 },
    { id: 'r-A-04', occurredAt: '2026-10-09', speaker: '医生', dept: '风湿免疫科', quote: '目前维持 15 mg，下次复查再评估；疫苗问题按预防接种门诊意见。', patientUnderstanding: '先维持，疫苗问接种门诊。', relatedQuestionId: 'q-A-04', ord: 4 },
  ],
  questions: [
    { id: 'q-A-01', text: '激素减到多少可以停？', topic: '用药', isPrivate: false, sortOrder: 1, status: 'answered', answerReplyId: 'r-A-02', createdAt: '2026-06-15', ord: 1 },
    { id: 'q-A-02', text: '打托珠单抗期间发热，还要不要马上来门诊？', topic: '发热与就诊', isPrivate: false, sortOrder: 2, status: 'answered', answerReplyId: 'r-A-03', createdAt: '2026-07-09', ord: 2 },
    { id: 'q-A-03', text: '皮疹反复是不是病情活动？', topic: '皮疹', isPrivate: false, sortOrder: 3, status: 'unasked', answerReplyId: null, createdAt: '2026-09-30', ord: 3 },
    { id: 'q-A-04', text: '能不能打流感疫苗？', topic: '疫苗', isPrivate: false, sortOrder: 4, status: 'answered', answerReplyId: 'r-A-04', createdAt: '2026-09-28', ord: 4 },
    { id: 'q-A-05', text: '月经变少和病或药有关吗？', topic: '私密', isPrivate: true, sortOrder: 5, status: 'unasked', answerReplyId: null, createdAt: '2026-10-12', ord: 5 },
  ],
  snapshots: [
    { id: 's-A-01', createdAt: '2026-06-19T08:00:00+08:00', cutoffAt: '2026-06-19', format: 'brief', itemIds: ['n-A-05', 'n-A-06', 'A-doc-lab-2026-06-15'], questionIds: ['q-A-01'], reviewStates: { 'n-A-05': 'confirmed', 'n-A-06': 'confirmed', 'A-doc-lab-2026-06-15': 'confirmed' }, relativePath: 'demo/exports/A-2026-06-19-visit.md', stale: false, ord: 1 },
    { id: 's-A-02', createdAt: '2026-10-09T07:30:00+08:00', cutoffAt: '2026-10-09', format: 'detail', itemIds: ['n-A-07', 'n-A-10', 'n-A-11', 'n-A-12', 'A-doc-lab-2026-09-28', 'A-doc-note-2026-10-09'], questionIds: ['q-A-02', 'q-A-03', 'q-A-04'], reviewStates: { 'n-A-07': 'confirmed', 'n-A-10': 'confirmed', 'n-A-11': 'confirmed', 'n-A-12': 'confirmed', 'A-doc-lab-2026-09-28': 'confirmed', 'A-doc-note-2026-10-09': 'confirmed' }, relativePath: 'demo/exports/A-2026-10-09-visit.md', stale: true, ord: 2 },
  ],
}

/* ---------- 档案 B：关节炎型病程，跨院资料，配偶协助 ---------- */
const B = {
  key: 'B',
  displayName: '演示档案 B · 关节炎型病程（合成）',
  sex: '男',
  birthYear: 1980,
  tag: 'DEMO-B · 合成 · 关节炎型 · 跨院资料',
  stageLabel: '医生记录：成人斯蒂尔病（2026-05）',
  anchorDate: '2026-05-20',
  anchorLabel: '首次风湿免疫科门诊',
  dataScope: '2026-04-27 至 2026-10-27 · 全部合成',
  sections: sections(),
  narratives: [
    { id: 'n-B-01', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-05-10', recordedAt: '2026-05-10T07:50:00+08:00', text: '早上双手僵，握拳要一个多小时才松。', impact: '洗漱变慢', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 1 },
    { id: 'n-B-02', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-05-18', recordedAt: '2026-05-18T18:20:00+08:00', text: '膝盖和脚踝肿，走路疼。', impact: '走路疼', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 2 },
    { id: 'n-B-03', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-06-05', recordedAt: '2026-06-05T12:30:00+08:00', text: '吃药后胃里不舒服，饭后好一点。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 3 },
    { id: 'n-B-04', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-07-02', recordedAt: '2026-07-02T08:10:00+08:00', text: '晨僵比上个月短，半小时左右。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 4 },
    { id: 'n-B-05', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-08-01', recordedAt: '2026-08-01T21:00:00+08:00', text: '出差三天，甲氨蝶呤那天没带药。', impact: '出差', isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 5 },
    { id: 'n-B-06', experiencedBy: 'family', contentKind: 'family_observation', speaker: 'spouse', recordedBy: 'spouse', relationship: '配偶', occurredAt: '2026-08-20', recordedAt: '2026-08-20T19:40:00+08:00', text: '走路比之前慢，上下楼要扶一下。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 6 },
    { id: 'n-B-07', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-09-15', recordedAt: '2026-09-15T07:30:00+08:00', text: '手腕又肿，晨僵回到一小时。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 7 },
    { id: 'n-B-08', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-10-05', recordedAt: '2026-10-05T22:10:00+08:00', text: '工作要长时间打字，手指僵的时候效率低。', impact: '工作效率下降', isPrivate: true, familyVisible: false, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 8 },
    { id: 'n-B-09', experiencedBy: 'patient', contentKind: 'self', speaker: 'patient', recordedBy: 'patient', relationship: null, occurredAt: '2026-10-25', recordedAt: '2026-10-25T20:00:00+08:00', text: '最近一次化验单在包里，还没整理。', impact: null, isPrivate: false, familyVisible: true, exportAllowed: false, aiAllowed: false, reviewState: 'confirmed', revision: 1, supersedesId: null, ord: 9 },
  ],
  documents: [
    { id: 'B-doc-lab-2026-05-19', title: '外院血常规 + 炎症指标（合成）', docType: '化验', org: '演示市第一医院·风湿科', collectedAt: '2026-05-19', reportedAt: '2026-05-19', timePrecision: 'day', relativePath: 'demo/docs/B/2026-05-19-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成外院报告；RF 未印单位。', ord: 1 },
    { id: 'B-doc-us-2026-05-21', title: '关节超声（合成）', docType: '影像', org: '演示市第一医院·超声科', collectedAt: '2026-05-21', reportedAt: '2026-05-21', timePrecision: 'day', relativePath: 'demo/docs/B/2026-05-21-us.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成超声报告原文，无真实影像。', ord: 2 },
    { id: 'B-doc-lab-2026-06-16', title: '外院血常规 + 炎症指标（合成）', docType: '化验', org: '演示市第一医院·风湿科', collectedAt: '2026-06-16', reportedAt: '2026-06-16', timePrecision: 'day', relativePath: 'demo/docs/B/2026-06-16-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 3 },
    { id: 'B-doc-lab-2026-07-14', title: '外院生化 + RF（合成）', docType: '化验', org: '演示市第一医院·风湿科', collectedAt: '2026-07-14', reportedAt: '2026-07-14', timePrecision: 'day', relativePath: 'demo/docs/B/2026-07-14-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告；ALT 未印上限。', ord: 4 },
    { id: 'B-doc-lab-2026-08-11', title: '外院血常规 + 炎症指标（合成）', docType: '化验', org: '演示市第一医院·风湿科', collectedAt: '2026-08-11', reportedAt: '2026-08-11', timePrecision: 'day', relativePath: 'demo/docs/B/2026-08-11-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 5 },
    { id: 'B-doc-lab-2026-09-08', title: '本院血常规 + 炎症指标（合成）', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-09-08', reportedAt: '2026-09-08', timePrecision: 'day', relativePath: 'demo/docs/B/2026-09-08-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告；同页另有 2 项待核对候选、1 项拒收。', ord: 6 },
    { id: 'B-doc-lab-2026-10-06', title: '本院血常规 + 炎症指标（合成）', docType: '化验', org: '演示医院·风湿免疫科', collectedAt: '2026-10-06', reportedAt: '2026-10-06', timePrecision: 'day', relativePath: 'demo/docs/B/2026-10-06-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'confirmed', note: '合成报告。', ord: 7 },
    { id: 'B-doc-lab-2026-10-26', title: '外院化验（合成，未解析）', docType: '化验', org: '演示市第一医院·风湿科', collectedAt: '2026-10-26', reportedAt: '2026-10-26', timePrecision: 'day', relativePath: 'demo/docs/B/2026-10-26-lab.pdf', mime: 'application/pdf', hashKind: 'demo-id', reviewState: 'unverified', note: '合成报告；仅登记原件，未解析，无确认指标。', ord: 8 },
  ],
  candidates: [
    { id: 'c-B-01', documentId: 'B-doc-lab-2026-09-08', fieldName: 'C 反应蛋白', rawText: '12.4', valueText: '12.4', valueNum: 12.4, unit: 'mg/L', refLow: 0, refHigh: 8, collectedAt: '2026-09-08', decision: 'pending', note: '待逐项核对；未入事实。', ord: 1 },
    { id: 'c-B-02', documentId: 'B-doc-lab-2026-09-08', fieldName: '红细胞沉降率', rawText: '32', valueText: '32', valueNum: 32, unit: 'mm/h', refLow: 0, refHigh: 20, collectedAt: '2026-09-08', decision: 'pending', note: '待逐项核对；未入事实。', ord: 2 },
    { id: 'c-B-03', documentId: 'B-doc-lab-2026-09-08', fieldName: '丙氨酸氨基转移酶', rawText: '29 24', valueText: null, valueNum: null, unit: 'U/L', refLow: null, refHigh: null, collectedAt: '2026-09-08', decision: 'rejected', note: '原文两列错位，整行拒收；拒收不产生记录。', ord: 3 },
  ],
  metrics: [
    { id: 'crp', name: 'C 反应蛋白', unit: 'mg/L', kind: 'numeric', category: '炎症指标', decimals: 1, orgContext: '演示市第一医院', methodContext: '免疫比浊法（合成）', note: '参考范围来自合成报告，不是通用标准。', ord: 1 },
    { id: 'esr', name: '红细胞沉降率', unit: 'mm/h', kind: 'numeric', category: '炎症指标', decimals: 0, orgContext: '演示市第一医院', methodContext: '魏氏法（合成）', note: '参考范围来自合成报告。', ord: 2 },
    { id: 'alt', name: '丙氨酸氨基转移酶', unit: 'U/L', kind: 'numeric', category: '肝功能', decimals: 0, orgContext: '演示市第一医院', methodContext: '速率法（合成）', note: '部分报告未印参考上限，保持为空。', ord: 3 },
    { id: 'creatinine', name: '肌酐', unit: 'µmol/L', kind: 'numeric', category: '肾功能', decimals: 0, orgContext: '演示市第一医院', methodContext: '酶法（合成）', note: '参考范围来自合成报告。', ord: 4 },
    { id: 'wbc', name: '白细胞计数', unit: '×10⁹/L', kind: 'numeric', category: '血常规', decimals: 1, orgContext: '演示市第一医院', methodContext: '流式法（合成）', note: '参考范围来自合成报告。', ord: 5 },
    { id: 'hgb', name: '血红蛋白', unit: 'g/L', kind: 'numeric', category: '血常规', decimals: 0, orgContext: '演示市第一医院', methodContext: '比色法（合成）', note: '参考范围来自合成报告。', ord: 6 },
    { id: 'rf', name: '类风湿因子', unit: 'IU/mL', kind: 'numeric', category: '免疫学', decimals: 0, orgContext: '演示市第一医院', methodContext: '免疫比浊法（合成）', note: '首份报告未印单位，数值不参与跨单位比较。', ord: 7 },
    { id: 'joint_swelling', name: '关节肿胀（自述分类）', unit: null, kind: 'qual', category: '自述分类', decimals: null, orgContext: null, methodContext: null, note: '患者自述分类，不是医学分级，不进入数值序列。', ord: 8 },
  ],
  observations: [],
  medications: [
    { id: 'm-B-01', drugName: '泼尼松', doseText: '15 mg 口服 每日一次', route: '口服', eventKind: 'planned', startedOn: '2026-05-20', endedOn: null, note: '首次门诊医嘱；原文照抄。', doctorQuote: '泼尼松 15 mg 起始。', patientUnderstanding: '先吃 15 mg。', sourceDocumentId: null, revision: 1, ord: 1 },
    { id: 'm-B-02', drugName: '泼尼松', doseText: '10 mg 口服 每日一次', route: '口服', eventKind: 'planned', startedOn: '2026-06-17', endedOn: null, note: '复诊调整。', doctorQuote: '激素减到 10 mg。', patientUnderstanding: '减到 10 mg。', sourceDocumentId: null, revision: 1, ord: 2 },
    { id: 'm-B-03', drugName: '甲氨蝶呤', doseText: '7.5 mg 口服 每周一次', route: '口服', eventKind: 'planned', startedOn: '2026-05-20', endedOn: null, note: '首次医嘱；实际服用未逐次记录。', doctorQuote: '甲氨蝶呤 7.5 mg 每周一次。', patientUnderstanding: '每周一次。', sourceDocumentId: null, revision: 1, ord: 3 },
    { id: 'm-B-04', drugName: '甲氨蝶呤', doseText: '10 mg 口服 每周一次', route: '口服', eventKind: 'planned', startedOn: '2026-08-12', endedOn: null, note: '复诊调整。', doctorQuote: '甲氨蝶呤加到 10 mg 每周。', patientUnderstanding: '加到 10 mg。', sourceDocumentId: null, revision: 1, ord: 4 },
    { id: 'm-B-05', drugName: '叶酸', doseText: '5 mg 口服 每周一次（非甲氨蝶呤日）', route: '口服', eventKind: 'planned', startedOn: '2026-05-20', endedOn: null, note: '与甲氨蝶呤同次医嘱。', doctorQuote: '叶酸 5 mg，错开一天。', patientUnderstanding: '错开一天吃。', sourceDocumentId: null, revision: 1, ord: 5 },
  ],
  nutrition: [
    { id: 'nut-B-01', occurredAt: '2026-05-25', text: '早上吃药后胃不舒服，吃了点苏打饼干。', intake: '苏打饼干', weightKg: null, note: null, isPrivate: false, ord: 1 },
    { id: 'nut-B-02', occurredAt: '2026-06-20', text: '出差在外，三餐不规律。', intake: '不规律', weightKg: null, note: null, isPrivate: false, ord: 2 },
    { id: 'nut-B-03', occurredAt: '2026-08-01', text: '这周应酬多，酒没喝。', intake: '正常', weightKg: null, note: '患者自述', isPrivate: false, ord: 3 },
    { id: 'nut-B-04', occurredAt: '2026-09-15', text: '关节疼时不想做饭，叫了两次外卖。', intake: '外卖', weightKg: null, note: null, isPrivate: false, ord: 4 },
    { id: 'nut-B-05', occurredAt: '2026-10-10', text: '体重比上次门诊轻了一点。', intake: '正常', weightKg: 70.2, note: '家用秤自测', isPrivate: false, ord: 5 },
  ],
  mind: [
    { id: 'mind-B-01', occurredAt: '2026-07-02', text: '担心长期吃药影响肝功能。', mood: '担心', sleep: '一般', isPrivate: true, note: '默认私密', ord: 1 },
    { id: 'mind-B-02', occurredAt: '2026-08-20', text: '出差多，怕在外地发作没人帮忙。', mood: '焦虑', sleep: '入睡难', isPrivate: true, note: null, ord: 2 },
    { id: 'mind-B-03', occurredAt: '2026-10-05', text: '和配偶说了工作上的担心，感觉好一些。', mood: '平稳', sleep: '尚可', isPrivate: false, note: null, ord: 3 },
  ],
  profileDoc: {
    definition: '成人斯蒂尔病是一种罕见、病因不明的自身炎症性疾病。',
    diagnosisText: '医生记录：成人斯蒂尔病（2026-05，首次风湿免疫科门诊）。',
    keyReports: ['B-doc-lab-2026-05-19', 'B-doc-us-2026-05-21'],
    careTeam: ['演示市第一医院 · 风湿科', '演示医院 · 风湿免疫科'],
  },
  replies: [
    { id: 'r-B-01', occurredAt: '2026-05-20', speaker: '医生', dept: '风湿免疫科', quote: '按关节炎型处理，甲氨蝶呤每周一次，泼尼松 15 mg，叶酸同服。', patientUnderstanding: '每周一次甲氨蝶呤。', relatedQuestionId: null, ord: 1 },
    { id: 'r-B-02', occurredAt: '2026-07-15', speaker: '医生', dept: '风湿免疫科', quote: '关节比上次好，激素减到 10 mg；甲氨蝶呤漏一次不要补双倍。', patientUnderstanding: '漏了不补双倍。', relatedQuestionId: 'q-B-01', ord: 2 },
    { id: 'r-B-03', occurredAt: '2026-09-09', speaker: '医生', dept: '风湿免疫科', quote: '外院和本院指标趋势不一致，以同一实验室连续结果为准，下次带齐报告。', patientUnderstanding: '带齐报告，同一实验室比较。', relatedQuestionId: 'q-B-03', ord: 3 },
  ],
  questions: [
    { id: 'q-B-01', text: '甲氨蝶呤漏一次怎么办？', topic: '用药', isPrivate: false, sortOrder: 1, status: 'answered', answerReplyId: 'r-B-02', createdAt: '2026-07-12', ord: 1 },
    { id: 'q-B-02', text: '关节肿反复，是不是要加生物制剂？', topic: '用药', isPrivate: false, sortOrder: 2, status: 'unasked', answerReplyId: null, createdAt: '2026-09-15', ord: 2 },
    { id: 'q-B-03', text: '外院和本院化验不一致，以哪个为准？', topic: '化验', isPrivate: false, sortOrder: 3, status: 'answered', answerReplyId: 'r-B-03', createdAt: '2026-09-08', ord: 3 },
    { id: 'q-B-04', text: '能不能正常出差？', topic: '工作', isPrivate: true, sortOrder: 4, status: 'unasked', answerReplyId: null, createdAt: '2026-10-05', ord: 4 },
  ],
  snapshots: [
    { id: 's-B-01', createdAt: '2026-09-09T08:10:00+08:00', cutoffAt: '2026-09-09', format: 'brief', itemIds: ['n-B-07', 'B-doc-lab-2026-09-08', 'm-B-04'], questionIds: ['q-B-01', 'q-B-02', 'q-B-03'], reviewStates: { 'n-B-07': 'confirmed', 'B-doc-lab-2026-09-08': 'confirmed', 'm-B-04': 'planned' }, relativePath: 'demo/exports/B-2026-09-09-visit.md', stale: false, ord: 1 },
    { id: 's-B-02', createdAt: '2026-10-27T09:00:00+08:00', cutoffAt: '2026-10-27', format: 'detail', itemIds: ['n-B-09', 'B-doc-lab-2026-10-26', 'm-B-04', 'm-B-05'], questionIds: ['q-B-02', 'q-B-04'], reviewStates: { 'n-B-09': 'confirmed', 'B-doc-lab-2026-10-26': 'unverified', 'm-B-04': 'planned', 'm-B-05': 'planned' }, relativePath: 'demo/exports/B-2026-10-27-visit.md', stale: false, ord: 2 },
  ],
}

/* ---------- 化验序列（A：9 点 / 每 3 周；B：6 点 / 每 4 周） ---------- */
const A_LAB_DATES = ['2026-05-04', '2026-05-25', '2026-06-15', '2026-07-06', '2026-07-27', '2026-08-17', '2026-09-07', '2026-09-28', '2026-10-19']
const A_SERIES = {
  crp: { unit: 'mg/L', values: [86, 42, 18, 9, 34, 12, 6, 8, 5], refLow: 0, refHigh: 8 },
  esr: { unit: 'mm/h', values: [78, 55, 38, 25, 62, 30, 18, 22, 16], refLow: 0, refHigh: 20 },
  ferritin: { unit: 'ng/mL', values: [1850, 920, 480, 260, 760, 310, 190, 210, 170], refLow: 15, refHigh: 150 },
  wbc: { unit: '×10⁹/L', values: [14.2, 11.8, 9.6, 8.1, 12.4, 9.2, 7.4, 7.8, 6.9], refLow: 3.5, refHigh: 9.5 },
  neutrophil_pct: { unit: '%', values: [86, 80, 74, 68, 82, 72, 64, 66, 61], refLow: 40, refHigh: 75 },
  alt: { unit: 'U/L', values: [78, 52, 34, 28, 46, 30, 22, 25, 21], refLow: 7, refHigh: 40 },
  hgb: { unit: 'g/L', values: [108, 112, 118, 121, 116, 120, 124, 123, 126], refLow: 115, refHigh: 150 },
  plt: { unit: '×10⁹/L', values: [420, 360, 290, 260, 330, 280, 240, 250, 235], refLow: 125, refHigh: 350 },
}
const B_LAB_DATES = ['2026-05-19', '2026-06-16', '2026-07-14', '2026-08-11', '2026-09-08', '2026-10-06']
const B_SERIES = {
  crp: { unit: 'mg/L', values: [28, 19, 11, 14, 8, 16], refLow: 0, refHigh: 8 },
  esr: { unit: 'mm/h', values: [46, 38, 28, 32, 22, 35], refLow: 0, refHigh: 20 },
  alt: { unit: 'U/L', values: [32, 28, 24, 26, 21, 29], refLow: 7, refHigh: 40 },
  creatinine: { unit: 'µmol/L', values: [78, 80, 76, 79, 77, 81], refLow: 57, refHigh: 97 },
  wbc: { unit: '×10⁹/L', values: [8.9, 8.2, 7.6, 8.0, 6.9, 7.8], refLow: 3.5, refHigh: 9.5 },
  hgb: { unit: 'g/L', values: [142, 140, 143, 141, 144, 140], refLow: 130, refHigh: 175 },
  rf: { unit: 'IU/mL', values: [18, 16, 15, 17, 14, 19], refLow: 0, refHigh: 14 },
}

function buildObservations(profileKey, dates, series, metricIds) {
  const out = []
  let ord = 1
  for (const metricId of metricIds) {
    const s = series[metricId]
    if (!s) continue
    if (s.values.length !== dates.length) throw new Error(`${profileKey}/${metricId}: 序列长度与日期数不一致`)
    dates.forEach((date, i) => {
      const id = `o-${profileKey}-${metricId}-${date}`
      const value = s.values[i]
      const missingUnit = profileKey === 'B' && metricId === 'rf' && i === 0
      const missingHigh = profileKey === 'B' && metricId === 'alt' && i === 2
      out.push({
        id,
        metricId,
        documentId: `${profileKey}-doc-lab-${date}`,
        rawText: String(value),
        valueNum: value,
        unit: missingUnit ? null : (s.unit || null),
        refLow: s.refLow,
        refHigh: missingHigh ? null : s.refHigh,
        collectedAt: date,
        reportedAt: date,
        timePrecision: 'day',
        reviewState: 'confirmed',
        revision: 1,
        ord: ord++,
      })
    })
  }
  return out
}


A.observations = buildObservations('A', A_LAB_DATES, A_SERIES, Object.keys(A_SERIES))
B.observations = buildObservations('B', B_LAB_DATES, B_SERIES, Object.keys(B_SERIES))

// 不等式原文：保留原文，数值为空
A.observations.push({
  id: 'o-A-il6-2026-10-19', metricId: 'il6', documentId: 'A-doc-lab-2026-10-19',
  rawText: '<0.5', valueNum: null, unit: 'pg/mL', refLow: 0, refHigh: 7,
  collectedAt: '2026-10-19', reportedAt: '2026-10-19', timePrecision: 'day',
  reviewState: 'confirmed', revision: 1, ord: A.observations.length + 1,
})

// 分类指标：value/unit/ref 为空，不进入数值序列
const qualA = [
  ['2026-05-06', '躯干局部'], ['2026-07-08', '躯干+四肢'], ['2026-09-30', '躯干局部'], ['2026-10-19', '无'],
]
const qualB = [
  ['2026-05-18', '多关节'], ['2026-07-02', '单关节'], ['2026-09-15', '多关节'], ['2026-10-06', '单关节'],
]
qualA.forEach(([date, text], i) => {
  A.observations.push({
    id: `o-A-rash-${date}`, metricId: 'rash_extent', documentId: null,
    rawText: text, valueNum: null, unit: null, refLow: null, refHigh: null,
    collectedAt: date, reportedAt: null, timePrecision: 'day',
    reviewState: 'confirmed', revision: 1, ord: A.observations.length + 1 + i * 0,
  })
})
// 重新编号，避免 ord 重复
A.observations.forEach((o, i) => { o.ord = i + 1 })
qualB.forEach(([date, text]) => {
  B.observations.push({
    id: `o-B-joint-${date}`, metricId: 'joint_swelling', documentId: null,
    rawText: text, valueNum: null, unit: null, refLow: null, refHigh: null,
    collectedAt: date, reportedAt: null, timePrecision: 'day',
    reviewState: 'confirmed', revision: 1, ord: B.observations.length + 1,
  })
})
B.observations.forEach((o, i) => { o.ord = i + 1 })

for (const profile of [A, B]) {
  profile.documents.forEach((doc, i) => { doc.sha256 = demoHash(`demo-document:${doc.id}`); doc.ord = i + 1 })
  profile.snapshots.forEach((snap, i) => {
    snap.sha256 = demoHash(`demo-snapshot:${snap.id}:${snap.itemIds.join(',')}`)
    snap.ord = i + 1
  })
}

export function buildDemoProfiles() {
  return {
    meta: {
      synthetic: true,
      generatedAt: GENERATED_AT,
      window: { ...WINDOW },
      note: '合成演示数据，不含真实患者信息；不能用于诊断、治疗或科研统计。',
      profiles: ['A', 'B'],
    },
    profiles: { A, B },
  }
}

/* ---------- SQLite ---------- */
const SCHEMA = `
CREATE TABLE section_titles (profile_key TEXT NOT NULL, key TEXT NOT NULL, title TEXT NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, key));
CREATE TABLE subjects (profile_key TEXT PRIMARY KEY, display_name TEXT NOT NULL, sex TEXT NOT NULL, birth_year INTEGER NOT NULL, tag TEXT NOT NULL, stage_label TEXT NOT NULL, anchor_date TEXT NOT NULL, anchor_label TEXT NOT NULL, data_scope TEXT NOT NULL);
CREATE TABLE narratives (id TEXT NOT NULL, profile_key TEXT NOT NULL, experienced_by TEXT NOT NULL, content_kind TEXT NOT NULL, speaker TEXT NOT NULL, recorded_by TEXT NOT NULL, relationship TEXT, occurred_at TEXT NOT NULL, recorded_at TEXT NOT NULL, text TEXT NOT NULL, impact TEXT, is_private INTEGER NOT NULL, family_visible INTEGER NOT NULL, export_allowed INTEGER NOT NULL, ai_allowed INTEGER NOT NULL, review_state TEXT NOT NULL, revision INTEGER NOT NULL, supersedes_id TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE documents (id TEXT NOT NULL, profile_key TEXT NOT NULL, title TEXT NOT NULL, doc_type TEXT NOT NULL, org TEXT NOT NULL, collected_at TEXT NOT NULL, reported_at TEXT, time_precision TEXT NOT NULL, relative_path TEXT NOT NULL, mime TEXT NOT NULL, sha256 TEXT NOT NULL, hash_kind TEXT NOT NULL, review_state TEXT NOT NULL, note TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE candidates (id TEXT NOT NULL, profile_key TEXT NOT NULL, document_id TEXT NOT NULL, field_name TEXT NOT NULL, raw_text TEXT NOT NULL, value_text TEXT, value_num REAL, unit TEXT, ref_low REAL, ref_high REAL, collected_at TEXT NOT NULL, decision TEXT NOT NULL, note TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE metric_definitions (metric_id TEXT NOT NULL, profile_key TEXT NOT NULL, name TEXT NOT NULL, unit TEXT, kind TEXT NOT NULL, category TEXT NOT NULL, decimals INTEGER, org_context TEXT, method_context TEXT, note TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, metric_id));
CREATE TABLE observations (profile_key TEXT NOT NULL, id TEXT NOT NULL, metric_id TEXT NOT NULL, document_id TEXT, raw_text TEXT NOT NULL, value_num REAL, unit TEXT, ref_low REAL, ref_high REAL, collected_at TEXT NOT NULL, reported_at TEXT, time_precision TEXT NOT NULL, review_state TEXT NOT NULL, revision INTEGER NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE medication_events (id TEXT NOT NULL, profile_key TEXT NOT NULL, drug_name TEXT NOT NULL, dose_text TEXT NOT NULL, route TEXT NOT NULL, event_kind TEXT NOT NULL, started_on TEXT NOT NULL, ended_on TEXT, note TEXT, doctor_quote TEXT, patient_understanding TEXT, source_document_id TEXT, revision INTEGER NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE clinical_replies (id TEXT NOT NULL, profile_key TEXT NOT NULL, occurred_at TEXT NOT NULL, speaker TEXT NOT NULL, dept TEXT NOT NULL, quote TEXT NOT NULL, patient_understanding TEXT, related_question_id TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE questions (id TEXT NOT NULL, profile_key TEXT NOT NULL, text TEXT NOT NULL, topic TEXT NOT NULL, is_private INTEGER NOT NULL, sort_order INTEGER NOT NULL, status TEXT NOT NULL, answer_reply_id TEXT, created_at TEXT NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE nutrition_logs (id TEXT NOT NULL, profile_key TEXT NOT NULL, occurred_at TEXT NOT NULL, text TEXT NOT NULL, intake TEXT, weight_kg REAL, note TEXT, is_private INTEGER NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE mind_logs (id TEXT NOT NULL, profile_key TEXT NOT NULL, occurred_at TEXT NOT NULL, text TEXT NOT NULL, mood TEXT, sleep TEXT, is_private INTEGER NOT NULL, note TEXT, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
CREATE TABLE profile_docs (profile_key TEXT PRIMARY KEY, definition TEXT NOT NULL, diagnosis_text TEXT NOT NULL, key_reports_json TEXT NOT NULL, care_team_json TEXT NOT NULL);
CREATE TABLE visit_snapshots (id TEXT NOT NULL, profile_key TEXT NOT NULL, created_at TEXT NOT NULL, cutoff_at TEXT NOT NULL, format TEXT NOT NULL, item_ids_json TEXT NOT NULL, question_ids_json TEXT NOT NULL, review_states_json TEXT NOT NULL, relative_path TEXT NOT NULL, sha256 TEXT NOT NULL, stale INTEGER NOT NULL, ord INTEGER NOT NULL, PRIMARY KEY (profile_key, id));
`

function insertMany(db, table, columns, rows) {
  if (!rows.length) return
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  const stmt = db.prepare(sql)
  for (const row of rows) stmt.run(...columns.map((column) => row[column] ?? null))
}

export function buildDemoDatabase(location = ':memory:') {
  const data = buildDemoProfiles()
  const db = new DatabaseSync(location)
  db.exec(SCHEMA)
  for (const profile of Object.values(data.profiles)) {
    insertMany(db, 'subjects', ['profile_key', 'display_name', 'sex', 'birth_year', 'tag', 'stage_label', 'anchor_date', 'anchor_label', 'data_scope'], [{
      profile_key: profile.key, display_name: profile.displayName, sex: profile.sex, birth_year: profile.birthYear,
      tag: profile.tag, stage_label: profile.stageLabel, anchor_date: profile.anchorDate,
      anchor_label: profile.anchorLabel, data_scope: profile.dataScope,
    }])
    insertMany(db, 'section_titles', ['profile_key', 'key', 'title', 'ord'], profile.sections.map((s) => ({ profile_key: profile.key, ...s })))
    insertMany(db, 'narratives', ['id', 'profile_key', 'experienced_by', 'content_kind', 'speaker', 'recorded_by', 'relationship', 'occurred_at', 'recorded_at', 'text', 'impact', 'is_private', 'family_visible', 'export_allowed', 'ai_allowed', 'review_state', 'revision', 'supersedes_id', 'ord'], profile.narratives.map((n) => ({
      id: n.id, profile_key: profile.key, experienced_by: n.experiencedBy, content_kind: n.contentKind,
      speaker: n.speaker, recorded_by: n.recordedBy, relationship: n.relationship, occurred_at: n.occurredAt,
      recorded_at: n.recordedAt, text: n.text, impact: n.impact, is_private: n.isPrivate ? 1 : 0,
      family_visible: n.familyVisible ? 1 : 0, export_allowed: n.exportAllowed ? 1 : 0,
      ai_allowed: n.aiAllowed ? 1 : 0, review_state: n.reviewState, revision: n.revision,
      supersedes_id: n.supersedesId, ord: n.ord,
    })))
    insertMany(db, 'documents', ['id', 'profile_key', 'title', 'doc_type', 'org', 'collected_at', 'reported_at', 'time_precision', 'relative_path', 'mime', 'sha256', 'hash_kind', 'review_state', 'note', 'ord'], profile.documents.map((d) => ({
      id: d.id, profile_key: profile.key, title: d.title, doc_type: d.docType, org: d.org,
      collected_at: d.collectedAt, reported_at: d.reportedAt, time_precision: d.timePrecision,
      relative_path: d.relativePath, mime: d.mime, sha256: d.sha256, hash_kind: d.hashKind,
      review_state: d.reviewState, note: d.note, ord: d.ord,
    })))
    insertMany(db, 'candidates', ['id', 'profile_key', 'document_id', 'field_name', 'raw_text', 'value_text', 'value_num', 'unit', 'ref_low', 'ref_high', 'collected_at', 'decision', 'note', 'ord'], profile.candidates.map((c) => ({
      id: c.id, profile_key: profile.key, document_id: c.documentId, field_name: c.fieldName,
      raw_text: c.rawText, value_text: c.valueText, value_num: c.valueNum, unit: c.unit,
      ref_low: c.refLow, ref_high: c.refHigh, collected_at: c.collectedAt, decision: c.decision,
      note: c.note, ord: c.ord,
    })))
    insertMany(db, 'metric_definitions', ['metric_id', 'profile_key', 'name', 'unit', 'kind', 'category', 'decimals', 'org_context', 'method_context', 'note', 'ord'], profile.metrics.map((m) => ({
      metric_id: m.id, profile_key: profile.key, name: m.name, unit: m.unit, kind: m.kind,
      category: m.category, decimals: m.decimals, org_context: m.orgContext,
      method_context: m.methodContext, note: m.note, ord: m.ord,
    })))
    insertMany(db, 'observations', ['profile_key', 'id', 'metric_id', 'document_id', 'raw_text', 'value_num', 'unit', 'ref_low', 'ref_high', 'collected_at', 'reported_at', 'time_precision', 'review_state', 'revision', 'ord'], profile.observations.map((o) => ({
      profile_key: profile.key, id: o.id, metric_id: o.metricId, document_id: o.documentId,
      raw_text: o.rawText, value_num: o.valueNum, unit: o.unit, ref_low: o.refLow,
      ref_high: o.refHigh, collected_at: o.collectedAt, reported_at: o.reportedAt,
      time_precision: o.timePrecision, review_state: o.reviewState, revision: o.revision, ord: o.ord,
    })))
    insertMany(db, 'medication_events', ['id', 'profile_key', 'drug_name', 'dose_text', 'route', 'event_kind', 'started_on', 'ended_on', 'note', 'doctor_quote', 'patient_understanding', 'source_document_id', 'revision', 'ord'], profile.medications.map((m) => ({
      id: m.id, profile_key: profile.key, drug_name: m.drugName, dose_text: m.doseText,
      route: m.route, event_kind: m.eventKind, started_on: m.startedOn, ended_on: m.endedOn,
      note: m.note, doctor_quote: m.doctorQuote, patient_understanding: m.patientUnderstanding,
      source_document_id: m.sourceDocumentId, revision: m.revision, ord: m.ord,
    })))
    insertMany(db, 'clinical_replies', ['id', 'profile_key', 'occurred_at', 'speaker', 'dept', 'quote', 'patient_understanding', 'related_question_id', 'ord'], profile.replies.map((r) => ({
      id: r.id, profile_key: profile.key, occurred_at: r.occurredAt, speaker: r.speaker,
      dept: r.dept, quote: r.quote, patient_understanding: r.patientUnderstanding,
      related_question_id: r.relatedQuestionId, ord: r.ord,
    })))
    insertMany(db, 'questions', ['id', 'profile_key', 'text', 'topic', 'is_private', 'sort_order', 'status', 'answer_reply_id', 'created_at', 'ord'], profile.questions.map((q) => ({
      id: q.id, profile_key: profile.key, text: q.text, topic: q.topic,
      is_private: q.isPrivate ? 1 : 0, sort_order: q.sortOrder, status: q.status,
      answer_reply_id: q.answerReplyId, created_at: q.createdAt, ord: q.ord,
    })))
    insertMany(db, 'nutrition_logs', ['id', 'profile_key', 'occurred_at', 'text', 'intake', 'weight_kg', 'note', 'is_private', 'ord'], profile.nutrition.map((n) => ({
      id: n.id, profile_key: profile.key, occurred_at: n.occurredAt, text: n.text,
      intake: n.intake, weight_kg: n.weightKg, note: n.note, is_private: n.isPrivate ? 1 : 0, ord: n.ord,
    })))
    insertMany(db, 'mind_logs', ['id', 'profile_key', 'occurred_at', 'text', 'mood', 'sleep', 'is_private', 'note', 'ord'], profile.mind.map((m) => ({
      id: m.id, profile_key: profile.key, occurred_at: m.occurredAt, text: m.text,
      mood: m.mood, sleep: m.sleep, is_private: m.isPrivate ? 1 : 0, note: m.note, ord: m.ord,
    })))
    insertMany(db, 'profile_docs', ['profile_key', 'definition', 'diagnosis_text', 'key_reports_json', 'care_team_json'], [{
      profile_key: profile.key, definition: profile.profileDoc.definition,
      diagnosis_text: profile.profileDoc.diagnosisText,
      key_reports_json: JSON.stringify(profile.profileDoc.keyReports),
      care_team_json: JSON.stringify(profile.profileDoc.careTeam),
    }])
    insertMany(db, 'visit_snapshots', ['id', 'profile_key', 'created_at', 'cutoff_at', 'format', 'item_ids_json', 'question_ids_json', 'review_states_json', 'relative_path', 'sha256', 'stale', 'ord'], profile.snapshots.map((s) => ({
      id: s.id, profile_key: profile.key, created_at: s.createdAt, cutoff_at: s.cutoffAt,
      format: s.format, item_ids_json: JSON.stringify(s.itemIds), question_ids_json: JSON.stringify(s.questionIds),
      review_states_json: JSON.stringify(s.reviewStates), relative_path: s.relativePath,
      sha256: s.sha256, stale: s.stale ? 1 : 0, ord: s.ord,
    })))
  }
  return db
}

export function readDemoFromDatabase(db) {
  const data = buildDemoProfiles()
  const profiles = {}
  for (const key of ['A', 'B']) {
    const subject = db.prepare('SELECT * FROM subjects WHERE profile_key = ?').get(key)
    const sections = db.prepare('SELECT key, title, ord FROM section_titles WHERE profile_key = ? ORDER BY rowid').all(key)
    const narratives = db.prepare('SELECT * FROM narratives WHERE profile_key = ? ORDER BY rowid').all(key)
    const documents = db.prepare('SELECT * FROM documents WHERE profile_key = ? ORDER BY rowid').all(key)
    const candidates = db.prepare('SELECT * FROM candidates WHERE profile_key = ? ORDER BY rowid').all(key)
    const metrics = db.prepare('SELECT * FROM metric_definitions WHERE profile_key = ? ORDER BY rowid').all(key)
    const observations = db.prepare('SELECT * FROM observations WHERE profile_key = ? ORDER BY rowid').all(key)
    const medications = db.prepare('SELECT * FROM medication_events WHERE profile_key = ? ORDER BY rowid').all(key)
    const replies = db.prepare('SELECT * FROM clinical_replies WHERE profile_key = ? ORDER BY rowid').all(key)
    const questions = db.prepare('SELECT * FROM questions WHERE profile_key = ? ORDER BY rowid').all(key)
    const nutrition = db.prepare('SELECT * FROM nutrition_logs WHERE profile_key = ? ORDER BY rowid').all(key)
    const mind = db.prepare('SELECT * FROM mind_logs WHERE profile_key = ? ORDER BY rowid').all(key)
    const profileDoc = db.prepare('SELECT * FROM profile_docs WHERE profile_key = ?').get(key)
    const snapshots = db.prepare('SELECT * FROM visit_snapshots WHERE profile_key = ? ORDER BY rowid').all(key)
    profiles[key] = {
      key,
      displayName: subject.display_name,
      sex: subject.sex,
      birthYear: subject.birth_year,
      tag: subject.tag,
      stageLabel: subject.stage_label,
      anchorDate: subject.anchor_date,
      anchorLabel: subject.anchor_label,
      dataScope: subject.data_scope,
      sections,
      narratives: narratives.map((n) => ({
        id: n.id, experiencedBy: n.experienced_by, contentKind: n.content_kind, speaker: n.speaker,
        recordedBy: n.recorded_by, relationship: n.relationship, occurredAt: n.occurred_at,
        recordedAt: n.recorded_at, text: n.text, impact: n.impact, isPrivate: Boolean(n.is_private),
        familyVisible: Boolean(n.family_visible), exportAllowed: Boolean(n.export_allowed),
        aiAllowed: Boolean(n.ai_allowed), reviewState: n.review_state, revision: n.revision,
        supersedesId: n.supersedes_id, ord: n.ord,
      })),
      documents: documents.map((d) => ({
        id: d.id, title: d.title, docType: d.doc_type, org: d.org, collectedAt: d.collected_at,
        reportedAt: d.reported_at, timePrecision: d.time_precision, relativePath: d.relative_path,
        mime: d.mime, sha256: d.sha256, hashKind: d.hash_kind, reviewState: d.review_state,
        note: d.note, ord: d.ord,
      })),
      candidates: candidates.map((c) => ({
        id: c.id, documentId: c.document_id, fieldName: c.field_name, rawText: c.raw_text,
        valueText: c.value_text, valueNum: c.value_num, unit: c.unit, refLow: c.ref_low,
        refHigh: c.ref_high, collectedAt: c.collected_at, decision: c.decision, note: c.note, ord: c.ord,
      })),
      metrics: metrics.map((m) => ({
        id: m.metric_id, name: m.name, unit: m.unit, kind: m.kind, category: m.category,
        decimals: m.decimals, orgContext: m.org_context, methodContext: m.method_context,
        note: m.note, ord: m.ord,
      })),
      observations: observations.map((o) => ({
        id: o.id, metricId: o.metric_id, documentId: o.document_id, rawText: o.raw_text,
        valueNum: o.value_num, unit: o.unit, refLow: o.ref_low, refHigh: o.ref_high,
        collectedAt: o.collected_at, reportedAt: o.reported_at, timePrecision: o.time_precision,
        reviewState: o.review_state, revision: o.revision, ord: o.ord,
      })),
      medications: medications.map((m) => ({
        id: m.id, drugName: m.drug_name, doseText: m.dose_text, route: m.route,
        eventKind: m.event_kind, startedOn: m.started_on, endedOn: m.ended_on, note: m.note,
        doctorQuote: m.doctor_quote, patientUnderstanding: m.patient_understanding,
        sourceDocumentId: m.source_document_id, revision: m.revision, ord: m.ord,
      })),
      replies: replies.map((r) => ({
        id: r.id, occurredAt: r.occurred_at, speaker: r.speaker, dept: r.dept, quote: r.quote,
        patientUnderstanding: r.patient_understanding, relatedQuestionId: r.related_question_id, ord: r.ord,
      })),
      questions: questions.map((q) => ({
        id: q.id, text: q.text, topic: q.topic, isPrivate: Boolean(q.is_private),
        sortOrder: q.sort_order, status: q.status, answerReplyId: q.answer_reply_id,
        createdAt: q.created_at, ord: q.ord,
      })),
      nutrition: nutrition.map((n) => ({
        id: n.id, occurredAt: n.occurred_at, text: n.text, intake: n.intake,
        weightKg: n.weight_kg, note: n.note, isPrivate: Boolean(n.is_private), ord: n.ord,
      })),
      mind: mind.map((m) => ({
        id: m.id, occurredAt: m.occurred_at, text: m.text, mood: m.mood,
        sleep: m.sleep, isPrivate: Boolean(m.is_private), note: m.note, ord: m.ord,
      })),
      profileDoc: {
        definition: profileDoc.definition, diagnosisText: profileDoc.diagnosis_text,
        keyReports: JSON.parse(profileDoc.key_reports_json), careTeam: JSON.parse(profileDoc.care_team_json),
      },
      snapshots: snapshots.map((s) => ({
        id: s.id, createdAt: s.created_at, cutoffAt: s.cutoff_at, format: s.format,
        itemIds: JSON.parse(s.item_ids_json), questionIds: JSON.parse(s.question_ids_json),
        reviewStates: JSON.parse(s.review_states_json), relativePath: s.relative_path,
        sha256: s.sha256, stale: Boolean(s.stale), ord: s.ord,
      })),
    }
  }
  return { meta: data.meta, profiles }
}

/* ---------- 输出 ---------- */
export function writeDemoFiles({ writeSqlite = true } = {}) {
  const data = buildDemoProfiles()
  const dbDir = join(ROOT, 'demo')
  const protoDir = join(ROOT, 'prototypes', 'v0.2')
  mkdirSync(dbDir, { recursive: true })
  mkdirSync(protoDir, { recursive: true })
  if (writeSqlite) {
    const dbPath = join(dbDir, 'demo-data.sqlite')
    for (const suffix of ['', '-wal', '-shm']) {
      const target = dbPath + suffix
      if (existsSync(target)) rmSync(target)
    }
    const db = buildDemoDatabase(dbPath)
    db.close()
  }
  const js = `/* 合成演示数据；由 demo/build-demo-data.mjs 生成，勿手改。 */\nwindow.DEMO_DATA = ${JSON.stringify(data, null, 2)};\n`
  writeFileSync(join(protoDir, 'demo-data.js'), js)
  return { data, jsPath: join(protoDir, 'demo-data.js'), sqlitePath: join(dbDir, 'demo-data.sqlite') }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { data } = writeDemoFiles()
  const count = (key, field) => Object.values(data.profiles).reduce((sum, p) => sum + p[field].length, 0)
  console.log(JSON.stringify({
    generatedAt: data.meta.generatedAt,
    window: data.meta.window,
    profiles: Object.values(data.profiles).map((p) => ({
      key: p.key,
      narratives: p.narratives.length,
      documents: p.documents.length,
      candidates: p.candidates.length,
      observations: p.observations.length,
      medications: p.medications.length,
      questions: p.questions.length,
      snapshots: p.snapshots.length,
    })),
    totalObservations: count('A', 'observations') + count('B', 'observations'),
    outputs: ['demo/demo-data.sqlite', 'prototypes/v0.2/demo-data.js'],
  }, null, 2))
}
