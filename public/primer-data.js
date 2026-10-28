/* 本地指南地址：原型 file:// 用相对路径；Desktop 走 /api/aosd/assets 白名单路由。 */
function localGuideUrl(rel) {
  if (typeof location !== 'undefined' && location.pathname.includes('/api/aosd/ui')) return '/api/aosd/assets/' + rel
  return '../../' + rel
}

window.DISEASE_PRIMER = {
  brand: '小炎宝',
  name: '成人斯蒂尔病',
  en: "Adult-onset Still's disease（AOSD）",
  updated: '2026-10-27',
  sections: [
    {
      id: 'definition',
      title: '定义',
      intro: '成人斯蒂尔病是一种罕见、病因不明的自身炎症性疾病。国家卫健委 2025 年指南列举发热、皮疹、关节症状、咽痛等表现，并指出诊断需排除感染、肿瘤及其他风湿性疾病。公共描述不能用来给个人自测或归类。',
      points: [
        'EULAR/PReS 2024 正式推荐把 sJIA 与 AOSD 放在同一 Still’s disease 谱系讨论，同时保留成人与儿童、不同医疗环境的证据边界。',
        '本台只保存患者提供的原始资料、本人或家属的叙述以及医生原话，不根据症状或单项指标生成疾病名。',
      ],
      sources: [
        { org: '国家卫生健康委', doc: '86个罕见病病种诊疗指南（2025年版）', version: '2025年版', original: true, kind: 'pdf', url: 'https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf', page: '正文17–19 / PDF21–23', local: localGuideUrl('assets/guidebooks/nhc-86-rare-diseases-2025.pdf#page=21'), note: '本地阅读：随包 assets/guidebooks（原型相对路径）' },
        { org: 'EULAR/PReS', doc: 'Still’s disease diagnosis and management recommendations', version: '2024（在线2024-09-24）', original: true, kind: 'fulltext', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11672000/', note: '非中国监管证明；合并sJIA/AOSD' },
      ],
    },
    {
      id: 'evidence',
      title: '医学资料规范和指南情况',
      intro: '本台只把公共资料作为背景，不用它推断个人情况。原件未取得的条目不写成“已核实”。',
      table: {
        head: ['机构', '文件', '版本 / 年份', '原件', '本台用途'],
        rows: [
          ['国家卫生健康委', '86个罕见病病种诊疗指南（2025年版）', '2025年版（2025-07-10发布）', { text: '已取得：官方PDF，517页', kind: 'pdf', url: 'https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf' }, '中文公共背景与页码出处'],
          ['EULAR/PReS', 'Still’s disease recommendations', '2024', { text: '已取得：PMC全文', kind: 'fulltext', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11672000/' }, '国际公共背景；非中国监管证明'],
          ['荷兰专家共识', 'Management of adult-onset Still’s disease', '2023在线/2024期刊', { text: '已取得：PMC全文', kind: 'fulltext', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11147545/' }, '补充共识，不称正式指南'],
          ['NMPA', '当前中国AOSD/Still’s药品适应症', '未核实', { text: '未取得现行官方说明书', nolink: true, note: '40组检索仅部分公告/历史审评；不输出已获批/未获批全表' }, '不生成用药建议'],
        ],
      },
      sources: [
        { org: '国家卫生健康委', doc: '2025年罕见病指南通知', version: '国卫办医政函〔2025〕252号', original: false, secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '据官方通知与原件' },
      ],
    },
    {
      id: 'landscape',
      title: '目前治疗全景概要',
      intro: '以下只是文献与指南中列举的类别，不排序、不比较优劣，也不代表任何一项适合某位患者。',
      groups: [
        { label: '指南列举的类别', points: ['非甾体抗炎药（NSAIDs）', '糖皮质激素', '传统改善病情抗风湿药（DMARDs）', 'IL-1、IL-6、TNF、JAK 抑制剂等靶向治疗'] },
        { label: '本台记录什么', points: ['只保存处方/医嘱原文、实际用药事件、变更与患者问题', '不计算剂量、不生成用药、停药、换药或疗效判断', '药品在中国当前AOSD适应症未逐项核实'] },
      ],
      sources: [
        { org: '国家卫生健康委', doc: '2025年版罕见病指南', version: '2025', original: true, kind: 'pdf', url: 'https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf', page: '正文20–21' },
        { org: 'EULAR/PReS', doc: 'Still’s disease recommendations', version: '2024', original: true, kind: 'fulltext', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11672000/' },
      ],
    },
    {
      id: 'trend',
      title: '发展趋势',
      intro: '只列已发生的资料事实，不预测疗效、上市或个人结局。',
      points: [
        '2025-07-10：国家卫健委发布《86个罕见病病种诊疗指南（2025年版）》通知，其中含成人斯蒂尔病章节。',
        '2024-09-24：EULAR/PReS Still’s disease 正式推荐在线发表，覆盖 sJIA/AOSD。',
        '2024-02：NMPA《2023年度药品审评报告》含阿那白滞素历史 FMF/CAPS 审评记录；不能证明当前 AOSD 适应症。',
        '2026-10-27：ClinicalTrials.gov 宽条件检索返回 26 条登记，含完成/终止/撤回/UNKNOWN；不等于正在招募或 M4 采集完成。',
      ],
      sources: [
        { org: '国家卫生健康委', doc: '2025年通知', version: '2025-07-10', original: false, secondaryUrl: 'https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml', note: '原件已取得，见上表' },
        { org: 'NMPA', doc: '2023年度药品审评报告', version: '2024-02', original: true, kind: 'pdf', url: 'https://www.nmpa.gov.cn/directory/web/nmpa/images/1707039824076019627.pdf' },
      ],
    },
  ],
}
