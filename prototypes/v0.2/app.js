/* 成人斯蒂尔病工作台原型 v0.2 —— 合成演示数据，无后端。 */
(function () {
  'use strict'
  const D = window.DEMO_DATA
  const PROFILES = D.profiles
  const state = {
    profile: 'A',
    view: 'dashboard',
    sub: null,
    agentOpen: false,
    large: false,
    dayDate: null,
    trialTab: 'profile',
    /* 演示内存写入：仅本页会话有效，生产写入走 /api/* + config.root SQLite（dsh/store.js）。 */
    demoCandidates: [],
    demoNarratives: [],
  }
  let pv = null

  const P = () => PROFILES[state.profile]
  const esc = (value) => String(value == null ? '' : value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;')

  const PAGES = [
    ['dashboard', '看板', 'home'],
    ['voices', '本人与代记', 'voice'],
    ['day', '同日经过', 'day'],
    ['documents', '资料上传与核对', 'doc'],
    ['metrics', '检查与指标', 'table'],
    ['timeline', '病情一图秀', 'chart'],
    ['treatment', '治疗记录', 'pill'],
    ['trials', '临床研究', 'flask'],
    ['nutrition', '营养支持', 'leaf'],
    ['mind', '心理支持', 'heart'],
    ['visit', '复诊准备', 'clipboard'],
    ['resources', '疾病与资源', 'book'],
  ]
  /* 全量探针据此逐页渲染；加页必须同时更新探针，避免“探针没扫到却全绿”。 */
  const ROUTES = ['dashboard', 'voices', 'day', 'documents', 'metrics', 'timeline', 'treatment', 'trials', 'nutrition', 'mind', 'visit', 'resources']
  const ICONS = {
    home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/>',
    voice: '<path d="M4 5h16v10H9l-5 4z"/>',
    day: '<path d="M4 6h16v14H4zM8 3v4m8-4v4M4 10h16"/>',
    doc: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
    table: '<path d="M4 5h16v14H4zM4 10h16M10 5v14"/>',
    pill: '<path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7Zm0 5h10"/>',
    clipboard: '<path d="M8 4h8v3H8zM6 6h12v14H6zM9 12h6M9 16h4"/>',
    book: '<path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h4z"/>',
    leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Zm0 0 7-7"/>',
    heart: '<path d="M20 6c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 8 14 8 14s13-9 8-14Z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16l3-5 3 3 4-7"/>',
  }
  const icon = (key) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key] || ICONS.home}</svg>`

  const KIND_LABEL = { self: '本人自述', family_relay: '家属转述本人', family_observation: '家属观察/感受' }
  const KIND_CLASS = { self: 'kind-self', family_relay: 'kind-relay', family_observation: 'kind-obs' }
  const RELATION = { patient: '患者本人', mother: '母亲', spouse: '配偶', family: '家属' }
  const person = (key) => RELATION[key] || (key ? String(key) : '未记录')
  const REVIEW_LABEL = { confirmed: '已核对', unverified: '未核对', draft: '草稿', pending: '待核对' }
  const EMPTY = '<div class="empty">这个时间窗里没有记录。可以换日期或先手录一条。</div>'

  /* 同一更正链只展示最新版本，避免患者重复选入原件与更正稿。 */
  function latestNarratives(profile) {
    const superseded = new Set(profile.narratives.map((n) => n.supersedesId).filter(Boolean))
    return profile.narratives.filter((n) => !superseded.has(n.id))
  }

  function kindPill(n) {
    return `<span class="pill ${KIND_CLASS[n.contentKind] || ''}">${esc(KIND_LABEL[n.contentKind] || n.contentKind)}</span>`
  }
  function privPill(n) {
    return n.isPrivate ? '<span class="pill priv">私密 · 不进入导出</span>' : ''
  }
  function reviewPill(value) {
    if (!value) return ''
    const bad = value !== 'confirmed'
    return `<span class="pill ${bad ? 'warn' : ''}">${esc(REVIEW_LABEL[value] || value)}</span>`
  }
  function narrativeLine(n, opts = {}) {
    const who = person(n.recordedBy)
    return `<div class="item" data-narrative="${esc(n.id)}">
      <div class="when">${esc(n.occurredAt)}${n.revision > 1 ? '<br><span class="pill">更正版</span>' : ''}</div>
      <div class="what">
        <div class="row">${kindPill(n)} ${privPill(n)} <span class="meta-line">记录：${esc(who)}${n.relationship ? '（' + esc(n.relationship) + '）' : ''} · 录入 ${esc(n.recordedAt.slice(0, 10))}</span></div>
        <p>${esc(n.text)}</p>
        ${n.impact ? `<p class="meta-line">对生活的影响：${esc(n.impact)}</p>` : ''}
        ${opts.detail ? `<p class="meta-line">经历主体：${esc(person(n.experiencedBy))} · 说话者：${esc(person(n.speaker))}${n.supersedesId ? ' · 更正自 ' + esc(n.supersedesId) : ''}</p>` : ''}
      </div>
    </div>`
  }

  /* toggletip/richtooltip：长说明收进浮窗，减少正文文字堆积（沉淀为脚手架模式 docs/39-TOGGLETIP.md）。 */
  let openTipEl = null
  function tip(title, body, source) {
    const id = 'tip-' + Math.abs((title + body).split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0))
    return `<span class="tip-wrap"><button type="button" class="tip-btn" aria-expanded="false" aria-controls="${id}" data-tip-toggle="${id}" aria-label="${esc(title)}说明">ⓘ</button>
      <span class="tip-panel" id="${id}" role="dialog" aria-label="${esc(title)}" hidden>
        <b>${esc(title)}</b>
        <span>${esc(body)}</span>
        ${source ? `<i>${esc(source)}</i>` : ''}
      </span></span>`
  }
  function bindTips(root) {
    ;(root || document).querySelectorAll('[data-tip-toggle]').forEach((btn) => {
      if (btn.dataset.tipBound) return
      btn.dataset.tipBound = '1'
      btn.addEventListener('click', (event) => {
        event.stopPropagation()
        const panel = document.getElementById(btn.dataset.tipToggle)
        if (openTipEl && openTipEl !== panel) { openTipEl.hidden = true; const b = openTipEl.parentElement.querySelector('.tip-btn'); if (b) b.setAttribute('aria-expanded', 'false') }
        const show = panel.hidden
        panel.hidden = !show
        btn.setAttribute('aria-expanded', String(show))
        openTipEl = show ? panel : null
      })
    })
  }
  document.addEventListener('click', (event) => {
    if (!openTipEl) return
    if (!event.target.closest('.tip-wrap')) { openTipEl.hidden = true; const b = openTipEl.parentElement.querySelector('.tip-btn'); if (b) b.setAttribute('aria-expanded', 'false'); openTipEl = null }
  })

  function pageHead(title, subtitle, actions = '') {
    return `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`
  }

  function profileSwitcher() {
    return `<div class="profile-switch" role="group" aria-label="演示档案">
      <span class="demo-badge">合成演示</span>
      ${Object.values(PROFILES).map((p) => `<button type="button" data-profile="${p.key}" aria-pressed="${state.profile === p.key}">${esc(p.displayName)}</button>`).join('')}
      <span class="meta-line">${esc(P().dataScope)}</span>
    </div>`
  }

  function agentButton(context) {
    return `<button type="button" class="ghost" data-discuss="${esc(context)}">和 AI 讨论本页</button>`
  }

  /* ---------------- 看板 ---------------- */
  function counts() {
    const p = P()
    const today = p.narratives.filter((n) => !n.isPrivate).length
    const pending = p.candidates.filter((c) => c.decision === 'pending').length
    const openQuestions = p.questions.filter((q) => q.status !== 'answered').length
    return { today, pending, openQuestions }
  }

  function viewDashboard() {
    const p = P()
    const { today, pending, openQuestions } = counts()
    const recent = p.narratives.filter((n) => !n.isPrivate).slice(-4).reverse()
    const nextSnapshot = p.snapshots[p.snapshots.length - 1]
    return `${profileSwitcher()}
    ${pageHead('看板', '先看今天能做的一件事。所有记录都标来源，不生成病情判断。', agentButton('dashboard'))}
    <section class="card" style="margin-bottom:14px">
      <div class="row"><h2 style="margin:0">记录起点 · ${esc(p.anchorLabel)}</h2><span class="pill">${esc(p.anchorDate)}</span></div>
      <p class="sub">${esc(p.stageLabel)}。这是医生登记的原文，不是本台推断。</p>
      <div class="btn-row">
        <button type="button" class="primary" data-action="quick-record">记一段感受</button>
        <button type="button" class="ghost" data-action="go" data-view="documents">核对一份报告</button>
        <button type="button" class="ghost" data-action="go" data-view="visit">准备这次复诊</button>
        <button type="button" class="ghost" data-primer-open>疾病概要：这是什么病？</button>
      </div>
    </section>
    <div class="kpi">
      <div class="card"><b>${today}</b><span>条可见记录（不含私密）</span></div>
      <div class="card"><b>${pending}</b><span>条待核对候选</span></div>
      <div class="card"><b>${openQuestions}</b><span>个待问事项</span></div>
      <div class="card"><b>${esc(nextSnapshot ? nextSnapshot.cutoffAt : '—')}</b><span>最近一次就诊材料截止</span></div>
    </div>
    <div class="grid" style="margin-top:14px">
      <section class="card">
        <h2>今天 · 最近记录</h2>
        <div class="list">${recent.map((n) => narrativeLine(n)).join('') || EMPTY}</div>
        <div class="btn-row"><button type="button" class="ghost" data-action="go" data-view="day">看某一天的经过</button></div>
      </section>
      <section class="card">
        <h2>今天 · 待问事项</h2>
        <div class="list">${p.questions.filter((q) => !q.isPrivate).slice(0, 4).map((q) => `<div class="item"><div class="when">${q.status === 'answered' ? '已答' : '未问'}</div><div class="what"><p>${esc(q.text)}</p><p class="meta-line">${esc(q.topic)}${q.status === 'answered' ? ' · 已有医生答复可回看' : ''}</p></div></div>`).join('') || EMPTY}</div>
        <div class="btn-row"><button type="button" class="ghost" data-action="go" data-view="visit">整理复诊材料</button></div>
      </section>
    </div>`
  }

  /* ---------------- 本人与代记 ---------------- */
  function viewVoices() {
    const p = P()
    const demoByKind = {}
    for (const n of state.demoNarratives) (demoByKind[n.contentKind] = demoByKind[n.contentKind] || []).push(n)
    const groups = [
      ['self', '本人自述'],
      ['family_relay', '家属转述本人'],
      ['family_observation', '家属观察/感受'],
    ]
    return `${profileSwitcher()}
    ${pageHead('本人与代记', '谁的经历、谁说的、谁录入的分开显示；未授权内容不进入共享档案。', agentButton('voices') + ' <button type="button" class="primary" data-action="manual-record">手工记一段</button>')}
    <div class="banner soft">本页只示范合成档案。私密记录默认不进导出、不发送给 AI；代记需要患者本人授权，AI 不能代替确认。</div>
    <div class="grid">
      ${groups.map(([kind, label]) => {
        const list = [...p.narratives.filter((n) => n.contentKind === kind), ...(demoByKind[kind] || [])]
        return `<section class="card"><h2>${esc(label)}</h2>
          <div class="list">${list.map((n) => narrativeLine(n, { detail: true })).join('') || EMPTY}</div>
        </section>`
      }).join('')}
    </div>`
  }

  /* ---------------- 同日经过 ---------------- */
  function dayDates() {
    const p = P()
    const dates = new Set()
    p.narratives.forEach((n) => dates.add(n.occurredAt))
    p.documents.forEach((d) => dates.add(d.collectedAt))
    p.medications.filter((m) => m.eventKind === 'actual').forEach((m) => dates.add(m.startedOn))
    p.replies.forEach((r) => dates.add(r.occurredAt))
    return [...dates].sort().reverse()
  }

  function viewDay() {
    const p = P()
    const dates = dayDates()
    const date = state.dayDate && dates.includes(state.dayDate) ? state.dayDate : dates[0]
    state.dayDate = date
    const narr = p.narratives.filter((n) => n.occurredAt === date && !n.isPrivate)
    const docs = p.documents.filter((d) => d.collectedAt === date)
    const meds = p.medications.filter((m) => m.eventKind === 'actual' && m.startedOn === date)
    const replies = p.replies.filter((r) => r.occurredAt === date)
    const lane = (title, rows) => `<div class="lane"><h4>${esc(title)}</h4>${rows.join('') || '<p class="meta-line">这一天没有记录</p>'}</div>`
    return `${profileSwitcher()}
    ${pageHead('同日经过', '同一天发生的事按来源分轨；并列只表示同一天，不表示因果。', agentButton('day'))}
    <div class="toolbar">
      <label for="day-select">选择日期</label>
      <select id="day-select">${dates.map((d) => `<option value="${d}" ${d === date ? 'selected' : ''}>${d}</option>`).join('')}</select>
      <span class="meta-line">共 ${dates.length} 个有记录的日期</span>
    </div>
    <div class="day-track">
      ${lane('本人 / 家属叙述', narr.map((n) => `<div class="n">${kindPill(n)}<p style="margin:4px 0 0">${esc(n.text)}</p><p class="meta-line">${esc(person(n.recordedBy))}</p></div>`))}
      ${lane('报告与原件', docs.map((d) => `<div class="n"><a href="#" class="linkish" data-doc="${esc(d.id)}">${esc(d.title)}</a><p class="meta-line">${esc(d.org)} · ${esc(d.reviewState === 'confirmed' ? '已登记' : '仅原件')}</p></div>`))}
      ${lane('实际用药事件', meds.map((m) => `<div class="n">${esc(m.drugName)}<p class="meta-line">${esc(m.doseText)}</p></div>`))}
      ${lane('医生答复', replies.map((r) => `<div class="n">${esc(r.dept)}<p style="margin:4px 0 0">“${esc(r.quote)}”</p></div>`))}
    </div>
    <p class="meta-line" style="margin-top:12px">风险提示：同一天出现发热、关节痛、皮疹或用药，并不说明它们互为因果；请把原始记录带给医生判断。</p>`
  }

  /* ---------------- 报告与核对 ---------------- */
  function viewDocuments() {
    const p = P()
    const allCandidates = [...p.candidates, ...state.demoCandidates.map((c) => ({ ...c, demo: true }))]
    const pending = allCandidates.filter((c) => c.decision === 'pending')
    const rejected = p.candidates.filter((c) => c.decision === 'rejected')
    return `${profileSwitcher()}
    ${pageHead('报告与核对', '原件、候选、确认结果分开。候选必须逐项核对才进入记录；拒收不产生任何记录。', agentButton('documents'))}
    <div class="grid">
      <section class="card">
        <h2>原件索引</h2>
        <div class="list">${p.documents.map((d) => `<div class="item"><div class="when">${esc(d.collectedAt)}</div><div class="what"><a href="#" class="linkish" data-doc="${esc(d.id)}">${esc(d.title)}</a><p class="meta-line">${esc(d.org)} · ${esc(d.docType)} ${reviewPill(d.reviewState)}</p></div></div>`).join('')}</div>
      </section>
      <section class="card">
        <h2>待核对候选（${pending.length}）</h2>
        ${pending.length ? pending.map((c) => `<div class="check"><input type="checkbox" aria-label="选择 ${esc(c.fieldName)}"><div><strong>${esc(c.fieldName)}</strong> <span class="meta-line">原文 ${esc(c.rawText)} ${esc(c.unit || '（单位未印）')} ${esc(c.collectedAt)}</span><p class="meta-line">${esc(c.note)}</p></div></div>`).join('') : '<div class="empty">这个档案没有待核对候选。原件都已在报告页登记。</div>'}
        ${pending.length ? '<div class="btn-row"><button type="button" class="ghost" disabled>逐项确认（原型未接写入）</button></div>' : ''}
        <h3 style="margin-top:14px">拒收记录（${rejected.length}）</h3>
        ${rejected.length ? rejected.map((c) => `<p class="meta-line">${esc(c.fieldName)}：${esc(c.note)}</p>`).join('') : '<p class="meta-line">没有拒收记录。</p>'}
      </section>
    </div>
    <div class="banner warm" style="margin-top:14px">云解析只在用户显式选择文件并同意外发后发生；失败时保留原件、不产生候选。原型没有接入云端，候选均为合成示例。</div>`
  }

  /* ---------------- 指标回看（原报告值表） ---------------- */
  function metricTable() {
    const p = P()
    const numeric = p.metrics.filter((m) => m.kind === 'numeric' && p.observations.some((o) => o.metricId === m.id))
    return numeric.map((m) => {
      const rows = p.observations.filter((o) => o.metricId === m.id).sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
      return `<details class="fold"><summary>${esc(m.name)} · ${rows.length} 次记录 · 最近 ${esc(rows[rows.length - 1].rawText)} ${esc(m.unit || '')}</summary>
        <div class="fold-body"><div class="table-wrap"><table class="data"><thead><tr><th>采样日</th><th>报告日</th><th>原文值</th><th>单位</th><th>参考范围</th><th>来源</th></tr></thead><tbody>
        ${rows.map((o) => `<tr><td>${esc(o.collectedAt)}</td><td>${esc(o.reportedAt || '未印')}</td><td class="num">${esc(o.rawText)}${o.valueNum == null && o.rawText !== '' ? '<br><span class="unit-note">数值为空，按原文保留</span>' : ''}</td><td>${esc(o.unit || '未印')}</td><td>${o.refLow == null && o.refHigh == null ? '未印' : esc(`${o.refLow ?? '?'}–${o.refHigh ?? '?'}`)}</td><td>${o.documentId ? `<a href="#" class="linkish" data-doc="${esc(o.documentId)}">${esc((p.documents.find((d) => d.id === o.documentId) || {}).title || '报告')}</a>` : '手录'}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="unit-note">${esc(m.note || '')} 不同机构/方法的数值不在这里合并成一条趋势；表格只用于回看原文。</p></div></details>`
    }).join('')
  }

  function viewMetrics() {
    const p = P()
    const qual = p.metrics.filter((m) => m.kind === 'qual')
    return `${profileSwitcher()}
    ${pageHead('指标回看', '按原报告值、单位和日期回看。一期不做多指标叠加、平滑曲线或“好/坏”判断。', agentButton('metrics'))}
    <div class="banner soft">同一指标在不同机构/方法下也可能不可直接比较；“拆组”只表示记录分开展示，不代表临床可比。</div>
    <div class="grid">
      <section class="card"><h2>原报告值表</h2>${metricTable()}</section>
      <section class="card"><h2>自述分类（不进入数值序列）</h2>
        ${qual.map((m) => `<h3>${esc(m.name)}</h3><div class="list">${p.observations.filter((o) => o.metricId === m.id).map((o) => `<div class="item"><div class="when">${esc(o.collectedAt)}</div><div class="what"><p>${esc(o.rawText)}</p></div></div>`).join('') || EMPTY}</div><p class="meta-line">${esc(m.note)}</p>`).join('')}
      </section>
    </div>`
  }

  /* ---------------- 资料上传与核对（四步闭环） ---------------- */
  function viewDocuments() {
    const p = P()
    const allCandidates = [...p.candidates, ...state.demoCandidates.map((c) => ({ ...c, demo: true }))]
    const pending = allCandidates.filter((c) => c.decision === 'pending')
    const rejected = p.candidates.filter((c) => c.decision === 'rejected')
    const unverified = p.documents.filter((d) => d.reviewState === 'unverified')
    const steps = [
      ['1', '上传', '选择 PDF/照片或手工补录；文件只留在本机'],
      ['2', '解析', '逐页识别成候选，失败保留原件、不产生候选'],
      ['3', '确认', '逐项核对名称/数值/单位/日期，可改可拒收'],
      ['4', '导入', '确认后的原值进入检查与指标；候选本身不入事实'],
    ]
    return `${profileSwitcher()}
    ${pageHead('资料上传与核对', '一份报告从上传到进入记录要走四步；任何一步失败都不伪造结果。', agentButton('documents'))}
    <div class="steps">${steps.map(([n, t, d]) => `<div class="step"><b>${n}</b><strong>${esc(t)}</strong><span>${esc(d)}</span></div>`).join('')}</div>
    <div class="grid">
      <section class="card">
        <h2>资料库</h2>
        <div class="btn-row" style="margin:0 0 10px">
          <button type="button" class="primary" data-action="upload">上传一份报告（演示）</button>
          <button type="button" class="ghost" data-action="manual">手工补一项</button>
          <button type="button" class="ghost" data-action="manual">手工记一段</button>
        </div>
        <div class="list">${p.documents.map((d) => `<div class="item"><div class="when">${esc(d.collectedAt)}</div><div class="what"><a href="#" class="linkish" data-doc="${esc(d.id)}">${esc(d.title)}</a>
          <p class="meta-line">${esc(d.org)} · ${esc(d.docType)} ${reviewPill(d.reviewState)}${d.reviewState === 'unverified' ? ' · 只有原件' : ''}</p></div></div>`).join('')}</div>
      </section>
      <section class="card">
        <h2>待确认候选（${pending.length}）</h2>
        ${pending.length ? pending.map((c) => `<div class="check"><input type="checkbox" data-cand="${esc(c.id)}"><div><strong>${esc(c.fieldName)}</strong>${c.demo ? ' <span class="pill">演示内存</span>' : ''} <span class="meta-line">原文 ${esc(c.rawText)} ${esc(c.unit || '（单位未印）')} · ${esc(c.collectedAt)}</span><p class="meta-line">${esc(c.note)}</p></div></div>`).join('') : '<div class="empty">这个档案没有待确认候选。原件都已在资料库登记。</div>'}
        ${pending.length ? '<div class="btn-row"><button type="button" class="primary" data-action="confirm-candidates">确认所选（演示内存）</button><button type="button" class="ghost" data-action="reject-candidates">拒收所选</button></div>' : ''}
        ${rejected.length ? `<h3 style="margin-top:14px">已拒收（${rejected.length}）</h3>${rejected.map((c) => `<p class="meta-line">${esc(c.fieldName)}：${esc(c.note)}</p>`).join('')}` : ''}
        ${unverified.length ? `<h3 style="margin-top:14px">只有原件、未解析（${unverified.length}）</h3>${unverified.map((d) => `<p class="meta-line">${esc(d.title)} · ${esc(d.collectedAt)} · 不产生指标值</p>`).join('')}` : ''}
      </section>
    </div>
    <div class="banner warm" style="margin-top:14px">云解析只在用户显式选择文件并同意外发后发生；失败保留原件、不产生候选。原型没有接入云端，候选均为合成示例。</div>`
  }

  /* ---------------- 检查与指标（原值表 + 动态卡） ---------------- */
  function metricSeries(p, metricId) {
    return p.observations
      .filter((o) => o.metricId === metricId && o.valueNum != null)
      .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
  }

  function miniSparkline(values, w = 150, h = 42) {
    if (values.length < 2) return '<span class="meta-line">单次记录，暂不连线</span>'
    const lo = Math.min(...values), hi = Math.max(...values)
    const span = hi - lo || Math.max(Math.abs(hi) * 0.08, 1)
    const pts = values.map((v, i) => [i / (values.length - 1) * (w - 8) + 4, h - 6 - ((v - lo) / span) * (h - 14)])
    const d = monotonePath(pts)
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="最近 ${values.length} 次记录的趋势，按自身范围缩放"><path d="${d}"/></svg>`
  }

  function monotonePath(pts) {
    if (pts.length < 2) return ''
    const n = pts.length
    const dx = [], dy = [], m = []
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / (dx[i] || 1) }
    const tang = []
    tang[0] = m[0]
    for (let i = 1; i < n - 1; i++) tang[i] = (m[i - 1] * m[i] <= 0) ? 0 : (m[i - 1] + m[i]) / 2
    tang[n - 1] = m[n - 2]
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { tang[i] = 0; tang[i + 1] = 0; continue }
      const a = tang[i] / m[i], b = tang[i + 1] / m[i]
      const s = Math.hypot(a, b)
      if (s > 3) { tang[i] = 3 * m[i] * a / s; tang[i + 1] = 3 * m[i] * b / s }
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3
      d += ` C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + tang[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - tang[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`
    }
    return d
  }

  function metricCards() {
    const p = P()
    const numeric = p.metrics.filter((m) => m.kind === 'numeric')
    return numeric.map((m) => {
      const series = metricSeries(p, m.id)
      if (!series.length) return ''
      const latest = series[series.length - 1]
      const prev = series[series.length - 2]
      const delta = prev ? latest.valueNum - prev.valueNum : null
      return `<button type="button" class="mcard" data-metric="${esc(m.id)}" aria-pressed="false">
        <span class="mcard-inner">
          <span class="mface front">
            <span class="mname">${esc(m.name)}</span>
            <span class="mval">${esc(latest.rawText)} <em>${esc(m.unit || '')}</em></span>
            <span class="mmeta">${esc(latest.collectedAt)} · ${series.length} 次${delta == null ? '' : ' · 较上次 ' + (delta > 0 ? '+' : '−') + Math.abs(delta).toFixed(m.decimals || 0)}</span>
            <span class="mturn">翻面看趋势</span>
          </span>
          <span class="mface back" aria-hidden="true">
            ${miniSparkline(series.map((o) => o.valueNum))}
            <span class="mmeta">${esc(series[0].collectedAt)} → ${esc(latest.collectedAt)}</span>
            <span class="mmeta">按该指标自身范围缩放，不代表与其他指标可比，也不是正常范围。</span>
          </span>
        </span>
      </button>`
    }).join('')
  }

  function viewMetrics() {
    const p = P()
    const qual = p.metrics.filter((m) => m.kind === 'qual')
    return `${profileSwitcher()}
    ${pageHead('检查与指标', '每张报告的原值、单位和日期都能回源；卡片翻面只显示该指标自身变化，不做病情判断。', agentButton('metrics'))}
    <section class="card" style="margin-bottom:14px"><h2>指标动态卡</h2><p class="sub">点击卡片翻面；每条线按自身全期范围缩放。</p>
      <div class="mcards">${metricCards()}</div>
    </section>
    <div class="grid">
      <section class="card"><h2>原报告值表</h2>${metricTable()}</section>
      <section class="card"><h2>自述分类（不进入数值序列）</h2>
        ${qual.map((m) => `<h3>${esc(m.name)}</h3><div class="list">${p.observations.filter((o) => o.metricId === m.id).map((o) => `<div class="item"><div class="when">${esc(o.collectedAt)}</div><div class="what"><p>${esc(o.rawText)}</p></div></div>`).join('') || EMPTY}</div><p class="meta-line">${esc(m.note)}</p>`).join('')}
      </section>
    </div>`
  }

  /* ---------------- 病情一图秀 ---------------- */
  function viewTimeline() {
    const p = P()
    const groups = {}
    p.metrics.filter((m) => m.kind === 'numeric' && p.observations.some((o) => o.metricId === m.id && o.valueNum != null)).forEach((m) => {
      ;(groups[m.category] = groups[m.category] || []).push(m)
    })
    const defaultSel = ['crp', 'esr', 'ferritin', 'hgb'].filter((id) => p.metrics.some((m) => m.id === id))
    return `${profileSwitcher()}
    ${pageHead('病情一图秀', '勾选指标看同一时间轴；每条线按自身范围缩放。', agentButton('timeline'))}
    <div class="oc-layout">
      <aside class="oc-side">
        <div class="oc-hint">最多同时显示 4 条线${tip('为什么是 4 条', '超过 4 条时颜色与走向难以分辨。16 号规范要求 ≤4 条并保持列表可滚动。', 'starter docs/16-ONE-CHART-SPEC.md R7')}</div>
        ${Object.entries(groups).map(([cat, metrics], gi) => `<details class="oc-group" ${gi === 0 ? 'open' : ''}><summary>${esc(cat)} <span class="pill">${metrics.length}</span></summary>
          ${metrics.map((m) => `<label class="oc-item"><input type="checkbox" data-oc-metric="${esc(m.id)}" ${defaultSel.includes(m.id) ? 'checked' : ''}> <span class="dot" style="background:${['#1f6b52', '#8a4b22', '#28566f', '#8a3350', '#7a5a12'][Object.keys(groups).flat().length % 5]}"></span>${esc(m.name)}<em>${esc(m.unit || '')}</em></label>`).join('')}
        </details>`).join('')}
        <p class="meta-line">勾选即时更新；每条线按该指标全部记录的 min–max 缩放${tip('为什么不同线不能比较', '不同指标的量纲与参考含义不同，同一张图上“高低”只代表各自记录内的相对位置，不代表谁更严重。', '16号 §0.1 可比性合同')}。</p>
      </aside>
      <section class="oc-main">
        <div class="chart-wrap"><svg class="chart" id="timeline-chart" viewBox="0 0 1080 520" role="img" aria-label="多指标时间轴，每条线按自身范围缩放"></svg></div>
        <div class="legend" id="timeline-legend"></div>
      </section>
    </div>`
  }

  /* ---------------- 治疗记录 ---------------- */
  function viewTreatment() {
    const p = P()
    const doc = p.profileDoc
    const planned = p.medications.filter((m) => m.eventKind === 'planned')
    const actual = p.medications.filter((m) => m.eventKind === 'actual')
    return `${profileSwitcher()}
    ${pageHead('治疗记录', '计划与实际分开；医生原话与患者理解分栏。公共医学背景见「疾病与资源」。', agentButton('treatment'))}
    <div class="grid">
      <section class="card">
        <h2>医生记录与团队</h2>
        <p>${esc(doc.doctorRecordText)}</p>
        <h3 style="margin-top:12px">关键原件</h3>
        <div class="list">${doc.keyReports.map((id) => { const d = p.documents.find((x) => x.id === id); return d ? `<div class="item"><div class="what"><a href="#" class="linkish" data-doc="${esc(id)}">${esc(d.title)}</a><p class="meta-line">${esc(d.collectedAt)} · ${esc(d.org)}</p></div></div>` : '' }).join('')}</div>
        <h3 style="margin-top:12px">就诊团队</h3><p class="meta-line">${doc.careTeam.map(esc).join(' · ')}</p>
      </section>
      <section class="card">
        <h2>用药计划（${planned.length}）</h2>
        ${planned.map((m) => `<details class="fold"><summary>${esc(m.drugName)} · ${esc(m.doseText)} · ${esc(m.startedOn)} 起</summary>
          <div class="fold-body"><div class="fold-grid">
            <div><h4>医生原话</h4><p class="quote">${m.doctorQuote ? '“' + esc(m.doctorQuote) + '”' : '未记录原文'}</p></div>
            <div><h4>患者理解</h4><p>${m.patientUnderstanding ? esc(m.patientUnderstanding) : '未记录'}</p></div>
          </div></div></details>`).join('') || EMPTY}
        <h2 style="margin-top:14px">实际事件（${actual.length}）</h2>
        <div class="list">${actual.map((m) => `<div class="item"><div class="when">${esc(m.startedOn)}</div><div class="what"><p>${esc(m.drugName)} · ${esc(m.doseText)}</p></div></div>`).join('') || EMPTY}</div>
      </section>
    </div>
    <section class="card" style="margin-top:14px">
      <h2>医生答复原文</h2>
      <div class="list">${p.replies.map((r) => `<div class="item"><div class="when">${esc(r.occurredAt)}</div><div class="what"><p class="quote">“${esc(r.quote)}”</p><p class="meta-line">${esc(r.dept)} · ${esc(r.speaker)}${r.patientUnderstanding ? ' · 患者理解：' + esc(r.patientUnderstanding) : ''}</p></div></div>`).join('')}</div>
    </section>`
  }

  /* ---------------- 临床研究（35号：建档→检索→结果分析） ---------------- */
  function stateLabel(status) {
    const map = { recruiting: '招募中（登记状态，未核实）', active: '活跃（未核实）', completed: '已完成', unknown: '未知' }
    return map[status] || status
  }
  const STATE_CLASS = { match: '', conflict: 'bad', unknown: 'warn' }
  const STATE_TEXT = { match: '符合', conflict: '不满足', unknown: '待确认' }

  function viewTrials() {
    const p = P()
    const tab = state.trialTab || 'profile'
    const profile = p.trialProfile
    const trials = p.trials
    const tabs = [['profile', '基础建档'], ['search', '检索'], ['analysis', '结果分析']]
    let body = ''
    if (tab === 'profile') {
      body = `<div class="grid">
        <section class="card"><h2>疾病与病程</h2>
          <dl class="profile-dl"><dt>医生记录</dt><dd>${esc(profile.doctorRecord)}</dd><dt>病程</dt><dd>${esc(profile.diseaseDuration)}</dd><dt>共病</dt><dd>${profile.comorbidity.map(esc).join('、')}</dd></dl>
          <h3 style="margin-top:12px">治疗线（照抄原文）</h3>
          <div class="list">${profile.treatmentLines.map((l) => `<div class="item"><div class="what"><p>${esc(l)}</p></div></div>`).join('')}</div>
          <h3 style="margin-top:12px">关键发现（报告原文）</h3>
          <div class="list">${profile.keyFindings.map((l) => `<div class="item"><div class="what"><p>${esc(l)}</p></div></div>`).join('')}</div>
          <p class="meta-line">建档只用已确认记录；待核对候选不参与匹配。</p>
        </section>
        <section class="card"><h2>使用边界</h2>
          <ul class="tight">
            <li>粗筛符合度 = 符合项 ÷ 已对照项；待确认按 0 计，只会偏低。</li>
            <li>这不是入组资格，也不代表效果；判定归医生与研究中心。</li>
            <li>登记状态未核实；“招募中”不等于可入组。</li>
          </ul>
          ${tip('待确认为什么算 0', '未知条件不能按“符合”或“不符合”填写，否则符合度会虚高。35 号规定待确认一律按 0 计。', 'starter docs/35-TRIAL-MATCHING.md')}
        </section>
      </div>`
    } else if (tab === 'search') {
      body = `<div class="banner warm">本原型未接入 unified-trial-mcp；下面 ${trials.length} 条均为 <b>合成演示</b>（DEMO- 前缀）。真实版本按四通道检索并记录每源终态。</div>
      <div class="toolbar"><label for="trial-q">关键词</label><input id="trial-q" placeholder="如：Still 病 / IL-1（演示）"><button type="button" class="primary" disabled>检索（原型未接入）</button></div>
      <div class="list">${trials.map((t) => trialCard(t)).join('')}</div>`
    } else {
      const saved = trials.filter((t) => t.saved)
      const ranked = [...trials].sort((a, b) => b.pct - a.pct)
      body = `<div class="grid">
        <section class="card"><h2>按粗筛符合度排序</h2>
          <div class="list">${ranked.map((t) => `<div class="item"><div class="when"><b class="pct">${t.pct}%</b></div><div class="what"><a href="#" class="linkish" data-trial="${esc(t.nctId)}">${esc(t.title)}</a><p class="meta-line">${esc(t.phase)} · ${esc(stateLabel(t.status))}${t.saved ? ' · 已收藏' : ''}</p><div class="bar"><i style="width:${Math.max(t.pct, 2)}%"></i></div></div></div>`).join('') || EMPTY}</div>
          <p class="meta-line">符合度只用于排序，不是入组资格。</p>
        </section>
        <section class="card"><h2>已收藏（${saved.length}）</h2>
          <div class="list">${saved.map((t) => `<div class="item"><div class="what"><a href="#" class="linkish" data-trial="${esc(t.nctId)}">${esc(t.title)}</a><p class="meta-line">${esc(t.nctId)} · ${t.pct}%</p></div></div>`).join('') || EMPTY}</div>
          <div class="btn-row"><button type="button" class="ghost" disabled>把收藏加进复诊问题（原型未接通）</button></div>
        </section>
      </div>`
    }
    return `${profileSwitcher()}
    ${pageHead('临床研究', '建档 → 检索 → 结果分析；输出的是带证据链的线索，不是入组资格。', agentButton('trials'))}
    <div class="tabs" role="tablist" aria-label="临床研究分区">${tabs.map(([id, label]) => `<button role="tab" aria-selected="${tab === id}" data-action="trial-tab" data-tab="${id}">${label}</button>`).join('')}</div>
    ${body}`
  }

  function trialCard(t) {
    const matched = t.criteria.filter((c) => c.state === 'match').length
    const unknown = t.criteria.filter((c) => c.state === 'unknown').length
    return `<div class="item trial" data-trial-card="${esc(t.nctId)}">
      <div class="what">
        <div class="row"><b class="pct">${t.pct}%</b> <a href="#" class="linkish" data-trial="${esc(t.nctId)}">${esc(t.title)}</a> ${t.saved ? '<span class="pill">已收藏</span>' : ''}</div>
        <p class="meta-line">${esc(t.nctId)} · ${esc(t.phase)} · ${esc(stateLabel(t.status))} · ${esc(t.sites)}</p>
        <p class="meta-line">符合 ${matched} · 待确认 ${unknown} · 其余不满足</p>
      </div>
    </div>`
  }

  function openTrial(nctId) {
    const t = P().trials.find((x) => x.nctId === nctId)
    if (!t) return
    pv.open({
      key: 'trial',
      title: t.title,
      crumb: '临床研究',
      render(body) {
        body.innerHTML = `<section class="card">
          <h2>登记信息（登记状态，未核实）</h2>
          <dl class="profile-dl"><dt>编号</dt><dd>${esc(t.nctId)}（合成演示）</dd><dt>期别</dt><dd>${esc(t.phase)}</dd><dt>状态</dt><dd>${esc(stateLabel(t.status))}</dd><dt>地点</dt><dd>${esc(t.sites)}</dd></dl>
          <p class="meta-line">“招募中”不等于可入组；登记 ≠ 有效 ≠ 安全。</p>
        </section>
        <section class="card" style="margin-top:12px">
          <h2>粗筛符合度 ${t.pct}%</h2>
          <p class="meta-line">这不是入组资格，也不代表效果。待确认按 0 计，因此只会偏低。</p>
          <div class="list">${t.criteria.map((c) => `<div class="item"><div class="when"><span class="pill ${STATE_CLASS[c.state] || ''}">${esc(STATE_TEXT[c.state] || c.state)}</span></div><div class="what"><p><b>${esc(c.kind)}</b>：${esc(c.text)}</p><p class="meta-line">记录里是：${esc(c.evidence)}</p></div></div>`).join('')}</div>
        </section>
        <div class="btn-row" style="margin-top:12px"><button type="button" class="ghost" disabled>收藏（原型未接写入）</button><button type="button" class="ghost" disabled>生成待问问题（原型未接通）</button></div>`
      },
    })
  }
  function primerCell(c) {
    const text = c && typeof c === 'object' ? (c.text || '') : c
    return '<td>' + esc(text) + '</td>'
  }

  function primerTable(t) {
    const head = t.head.map((h) => '<th>' + esc(h) + '</th>').join('')
    const rows = t.rows.map((row) => '<tr>' + row.map(primerCell).join('') + '</tr>').join('')
    return '<div class="table-wrap"><table class="data"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
  }

  function primerSource(src) {
    const bits = [src.org, src.doc, src.version].filter(Boolean).join(' · ')
    let link = ''
    if (src.nolink) link = '未取得官方说明书'
    else if (src.local) link = '<a href="' + esc(src.local) + '" target="_blank" rel="noopener">本地阅读 ↗</a>'
    else if (/^https:\/\//.test(src.url || '')) link = '<a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">打开 ↗</a>'
    return esc(bits) + (src.page ? ' · ' + esc(src.page) : '') + (link ? ' · ' + link : '')
  }

  function primerSectionHtml(sec) {
    if (!sec) return ''
    const sources = (sec.sources || []).map(primerSource).join('<br>')
    let body = '<p class="lead">' + esc(sec.intro || '') + '</p>'
    if (sec.points) body += '<ul class="tight">' + sec.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'
    if (sec.groups) body += sec.groups.map((g) => '<h4>' + esc(g.label) + '</h4><ul class="tight">' + g.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('')
    if (sec.table) body += primerTable(sec.table)
    body += '<p class="src">来源：' + (sources || '未标注') + '</p>'
    return '<div class="primer-block">' + body + '</div>'
  }

/* ---------------- 营养支持 ---------------- */
  function viewNutrition() {
    const p = P()
    const weights = p.nutrition.filter((n) => n.weightKg != null)
    return `${profileSwitcher()}
    ${pageHead('营养支持', '记录吃了什么、胃口和体重；不提供食谱、热量目标或补剂处方。', agentButton('nutrition'))}
    <div class="grid">
      <section class="card"><h2>进食与胃口</h2>
        <div class="list">${p.nutrition.map((n) => `<div class="item"><div class="when">${esc(n.occurredAt)}</div><div class="what"><p>${esc(n.text)}</p><p class="meta-line">进食：${esc(n.intake || '未记录')}${n.note ? ' · ' + esc(n.note) : ''}</p></div></div>`).join('') || EMPTY}</div>
        <div class="btn-row"><button type="button" class="ghost" disabled>记一次进食（原型未接通）</button></div>
      </section>
      <section class="card"><h2>体重记录（家用秤自测）</h2>
        ${weights.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>日期</th><th>体重</th><th>来源</th></tr></thead><tbody>${weights.map((n) => `<tr><td>${esc(n.occurredAt)}</td><td class="num">${esc(n.weightKg)} kg</td><td>${esc(n.note || '自测')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">还没有体重记录。</div>'}
        <p class="meta-line">体重变化不等于病情变化；如持续下降或进食困难，请与医生/营养师讨论。</p>
        <h2 style="margin-top:14px">医生/营养师书面意见</h2>
        <p class="meta-line">本档案尚未记录书面营养意见。公共资料只说明“记录原有饮食与医生意见”，不生成处方。</p>
      </section>
    </div>`
  }

  /* ---------------- 心理支持 ---------------- */
  function viewMind() {
    const p = P()
    const visible = p.mind.filter((m) => !m.isPrivate)
    const privateCount = p.mind.length - visible.length
    return `${profileSwitcher()}
    ${pageHead('心理支持', '情绪与生活影响可以自愿记录；默认私密，不做评分或诊断。', agentButton('mind'))}
    <div class="banner soft">本页 ${p.mind.length} 条记录中 ${privateCount} 条为私密，默认不进导出、不发送 AI；下方只显示非私密内容。</div>
    <div class="grid">
      <section class="card"><h2>我的记录（非私密）</h2>
        <div class="list">${visible.map((m) => `<div class="item"><div class="when">${esc(m.occurredAt)}</div><div class="what"><p>${esc(m.text)}</p><p class="meta-line">情绪：${esc(m.mood || '未记')} · 睡眠：${esc(m.sleep || '未记')}</p></div></div>`).join('') || EMPTY}</div>
        <div class="btn-row"><button type="button" class="ghost" disabled>记一条（私密，原型未接通）</button></div>
      </section>
      <section class="card"><h2>专业支持</h2>
        <p class="meta-line">本页不提供心理诊断或危机干预。若情绪持续影响生活，可向风湿免疫科团队说明，或寻求当地正规心理/精神卫生服务。</p>
        <p class="meta-line">工具不能判断急症；如有紧急或迅速加重的不适，请立即按当地急救/医疗机构渠道求助。</p>
      </section>
    </div>`
  }

  /* ---------------- 复诊准备 ---------------- */
  function viewVisit() {
    const p = P()
    const snapshots = [...p.snapshots].reverse()
    return `${profileSwitcher()}
    ${pageHead('复诊准备', '逐项选择要带的材料；未核对的原件也能带，但必须一直标出来。诊后可以把医生答复接回原问题。', agentButton('visit'))}
    <div class="grid">
      <section class="card">
        <h2>这次准备带什么</h2>
        <div class="banner warm">原型只展示选择效果，导出/写入未接通。真实数据不离开本机。</div>
        ${latestNarratives(p).filter((n) => !n.isPrivate).slice(-5).map((n) => `<label class="check"><input type="checkbox" checked><span>${esc(n.occurredAt)} · ${esc(n.text.slice(0, 26))}${n.text.length > 26 ? '…' : ''} ${kindPill(n)}${n.revision > 1 ? ' <span class="pill">含更正</span>' : ''}</span></label>`).join('')}
        ${p.documents.filter((d) => d.reviewState === 'unverified').map((d) => `<label class="check"><input type="checkbox" checked><span>${esc(d.title)} ${reviewPill('unverified')}<br><span class="meta-line">只登记了原件，没有确认指标</span></span></label>`).join('')}
      </section>
      <section class="card">
        <h2>待问事项</h2>
        <div class="list">${[...p.questions].sort((a, b) => a.sortOrder - b.sortOrder).map((q) => `<div class="item"><div class="when">${q.status === 'answered' ? '已答' : '未问'}</div><div class="what"><p>${esc(q.text)}</p><p class="meta-line">${esc(q.topic)} ${q.isPrivate ? '<span class="pill priv">默认不导出 · 不发送 AI</span>' : ''}</p></div></div>`).join('')}</div>
        <div class="btn-row"><button type="button" class="ghost" disabled>导出（原型未接通）</button></div>
      </section>
    </div>
    <section class="card" style="margin-top:14px">
      <h2>历史就诊材料</h2>
      ${snapshots.map((s) => `<details class="fold"><summary>${esc(s.cutoffAt)} · ${s.format === 'brief' ? '简版' : '详版'} · ${s.itemIds.length} 项材料 · ${s.questionIds.length} 个问题 ${s.stale ? '<span class="pill warn">已过时</span>' : ''}</summary>
        <div class="fold-body"><div class="fold-grid">
          <div><h4>当时选择</h4><p class="meta-line">${s.itemIds.map(esc).join('<br>')}</p></div>
          <div><h4>核对状态</h4><p class="meta-line">${Object.entries(s.reviewStates).map(([k, v]) => `${esc(k)}：${esc(REVIEW_LABEL[v] || v)}`).join('<br>')}</p></div>
          <div><h4>问题</h4><p class="meta-line">${s.questionIds.map(esc).join('<br>')}</p></div>
          <div><h4>文件</h4><p class="meta-line">${esc(s.relativePath)}<br>hash ${esc(s.sha256.slice(0, 12))}…</p></div>
        </div>
        ${s.stale ? '<p class="meta-line">源记录有更正；旧材料内容不变，但请以最新记录为准。</p>' : ''}</div></details>`).join('')}
    </section>`
  }

  /* ---------------- 疾病与资源 ---------------- */
  function viewResources() {
    return `${profileSwitcher()}
    ${pageHead('疾病与资源', '公共资料按来源和版本展示；组织链接不代表推荐，研究登记不在一期展示。', agentButton('resources'))}
    <div class="grid">
      <section class="card">
        <h2>疾病概要</h2>
        <p class="sub">四段内容与 README 同源，属公共背景，不是对个人的判断。</p>
        <div class="btn-row"><button type="button" class="primary" data-primer-open>打开完整概要（含指南链接）</button></div>
        <div id="primer-inline">${((window.DISEASE_PRIMER || {}).sections || []).map(primerSectionHtml).join('')}</div>
        <p class="exit-line">以上是文献与指南里列出的类别，不代表任何一项适合你。选哪一个，这一句需要问你的医生。</p>
      </section>
      <section class="card">
        <h2>本地与官方指南</h2>
        <p class="sub">本地阅读用于离线核对；官方链接用于追到原始发布页。</p>
        <div class="btn-row">
          <a class="ghost" href="../../assets/guidebooks/nhc-86-rare-diseases-2025.pdf#page=21" target="_blank" rel="noopener">本地阅读（PDF 第21页起）</a>
          <a class="ghost" href="https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf" target="_blank" rel="noopener noreferrer">官方 PDF</a>
        </div>
        <p class="meta-line">本地文件 517 页，AOSD 正文 17–21 / PDF 21–25；原型路径与开发版路由分开验证。</p>
      </section>
    </div>
    <div class="banner soft" style="margin-top:14px">支持资源与患者组织只作公开线索，未核实可及性，不作推荐。临床研究入口属二期，一期不显示空白占位。</div>`
  }

  /* 手工记录演示：生产版 POST /api/aosd/narratives → config.root SQLite；原型仅内存。 */
  function openManualRecord() {
    pv.open({
      key: 'manual-record',
      title: '手工记一段（演示）',
      crumb: '本人与代记',
      render(body) {
        body.innerHTML = `<section class="card">
          <h2>记一段感受</h2>
          <p class="meta-line">生产版会写入 config.root 的 SQLite 唯一事实库；本原型只存本页内存，关闭即失。</p>
          <label class="oc-item" style="border:0"><input type="radio" name="mr-kind" value="self" checked> 本人自述</label>
          <label class="oc-item" style="border:0"><input type="radio" name="mr-kind" value="family_relay"> 家属转述本人</label>
          <label class="oc-item" style="border:0"><input type="radio" name="mr-kind" value="family_observation"> 家属观察/感受</label>
          <label class="sr-only" for="mr-date">日期</label>
          <input id="mr-date" type="date" style="width:100%;margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit" value="${new Date().toISOString().slice(0, 10)}">
          <label class="sr-only" for="mr-text">内容</label>
          <textarea id="mr-text" rows="4" placeholder="原话照抄，不推断病名或原因" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit"></textarea>
          <label class="oc-item" style="border:0"><input type="checkbox" id="mr-private" checked> 私密（默认不导出、不发送 AI）</label>
          <div class="btn-row"><button type="button" class="ghost" data-pv-close>取消</button><button type="button" class="primary" id="mr-save">保存到演示内存</button></div>
        </section>`
        body.querySelector('#mr-save').addEventListener('click', () => {
          const text = body.querySelector('#mr-text').value.trim()
          if (!text) { notify('内容不能为空。'); return }
          const kind = body.querySelector('input[name="mr-kind"]:checked').value
          state.demoNarratives.push({
            id: 'demo-n-' + Date.now().toString(36), contentKind: kind,
            experiencedBy: kind === 'family_observation' ? 'family' : 'patient',
            speaker: kind === 'self' ? 'patient' : (kind === 'family_relay' ? 'patient' : 'family'),
            recordedBy: kind === 'self' ? 'patient' : 'family',
            occurredAt: body.querySelector('#mr-date').value || new Date().toISOString().slice(0, 10),
            recordedAt: new Date().toISOString(),
            text, impact: null, isPrivate: body.querySelector('#mr-private').checked,
            revision: 1, supersedesId: null, reviewState: 'confirmed', demo: true,
          })
          notify('已保存到演示内存。生产版经 /api/aosd/narratives 写入 SQLite 唯一事实库。')
          pv.close()
          render()
        })
      },
    })
  }

  /* ---------------- 报告详情（整页） ---------------- */
  function openDocument(id) {
    const p = P()
    const doc = p.documents.find((d) => d.id === id)
    if (!doc) return
    const obs = p.observations.filter((o) => o.documentId === id)
    const cand = p.candidates.filter((c) => c.documentId === id)
    pv.open({
      key: 'document',
      title: doc.title,
      crumb: '报告与核对',
      render(body) {
        body.innerHTML = `<section class="card">
          <h2>原件信息</h2>
          <p class="meta-line">${esc(doc.org)} · ${esc(doc.docType)} · 采样 ${esc(doc.collectedAt)} · 报告 ${esc(doc.reportedAt || '未印')} ${reviewPill(doc.reviewState)}</p>
          <p class="quote">${esc(doc.note || '')}</p>
          <p class="meta-line">合成文件：${esc(doc.relativePath)}（演示不提供真实 PDF）</p>
        </section>
        <section class="card" style="margin-top:12px">
          <h2>已确认原值（${obs.length}）</h2>
          ${obs.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>项目</th><th>原文值</th><th>单位</th><th>参考范围</th></tr></thead><tbody>${obs.map((o) => `<tr><td>${esc(p.metrics.find((m) => m.id === o.metricId)?.name || o.metricId)}</td><td class="num">${esc(o.rawText)}</td><td>${esc(o.unit || '未印')}</td><td>${o.refLow == null && o.refHigh == null ? '未印' : esc(`${o.refLow ?? '?'}–${o.refHigh ?? '?'}`)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="meta-line">没有确认指标。这份原件只登记了索引，未被解析。</p>'}
        </section>
        ${cand.length ? `<section class="card" style="margin-top:12px"><h2>候选（${cand.length}）</h2>${cand.map((c) => `<p class="meta-line">${esc(c.fieldName)}：原文 ${esc(c.rawText)} · ${c.decision === 'rejected' ? '已拒收' : '待核对'}</p>`).join('')}</section>` : ''}
        <p class="meta-line" style="margin-top:12px">技术限制：原型用相对路径引用本地 PDF；开发版必须走白名单路由，用户资料目录不能混入公共资产目录。</p>`
      },
    })
  }

  /* ---------------- AI 演示面板 ---------------- */
  function agentDraftFor(view) {
    const p = P()
    if (view === 'metrics') {
      const rows = p.observations.filter((o) => o.metricId === 'crp').slice(-3)
      return `我的 CRP 记录（原报告值）：\n${rows.map((o) => `${o.collectedAt} ${o.rawText} ${o.unit || ''}`).join('\n')}\n请帮我整理成下次门诊要问的问题，不要判断病情。`
    }
    if (view === 'visit') {
      const qs = p.questions.filter((q) => !q.isPrivate).map((q) => '- ' + q.text)
      return `我准备复诊，想带这些问题：\n${qs.join('\n')}\n请帮我排一下提问顺序，并标出哪些需要带原件。不要给诊断或用药建议。`
    }
    if (view === 'documents') {
      return `我有一份报告还没核对完（${p.documents.filter((d) => d.reviewState === 'unverified').length} 份只登记原件）。请列出我下次门诊前需要补核对的项目，不要推测结果。`
    }
    if (view === 'day') {
      return `我想回顾 ${state.dayDate || '最近一天'} 的记录，按来源整理成给医生看的经过，不要推断因果。`
    }
    return `我在整理${p.displayName.replace('（合成）', '')}的记录，请帮我把已选内容整理成问题清单；不要诊断、不要建议用药。`
  }

  function openAgent() {
    state.agentOpen = true
    const dock = document.getElementById('agent-dock')
    dock.hidden = false
    dock.classList.add('open')
    document.getElementById('agent-toggle').setAttribute('aria-expanded', 'true')
    const draft = agentDraftFor(state.view)
    document.getElementById('agent-draft').textContent = draft
    document.getElementById('agent-input').value = draft
    document.getElementById('agent-state').textContent = '演示 · 未连接宿主'
  }

  function closeAgent() {
    state.agentOpen = false
    const dock = document.getElementById('agent-dock')
    dock.classList.remove('open')
    dock.hidden = true
    document.getElementById('agent-toggle').setAttribute('aria-expanded', 'false')
  }

  /* ---------------- 渲染与路由 ---------------- */
  const VIEWS = {
    dashboard: viewDashboard,
    voices: viewVoices,
    day: viewDay,
    documents: viewDocuments,
    metrics: viewMetrics,
    timeline: viewTimeline,
    treatment: viewTreatment,
    trials: viewTrials,
    nutrition: viewNutrition,
    mind: viewMind,
    visit: viewVisit,
    resources: viewResources,
  }
  const TITLES = { dashboard: '看板', voices: '本人与代记', day: '同日经过', documents: '资料上传与核对', metrics: '检查与指标', timeline: '病情一图秀', treatment: '治疗记录', trials: '临床研究', nutrition: '营养支持', mind: '心理支持', visit: '复诊准备', resources: '疾病与资源' }

  function renderNav() {
    document.getElementById('nav').innerHTML = PAGES.map(([key, label, ic]) =>
      `<button type="button" data-view="${key}" aria-current="${state.view === key ? 'page' : 'false'}">${icon(ic)}<span class="txt">${label}</span></button>`).join('')
  }

  function render() {
    renderNav()
    document.getElementById('main').innerHTML = (VIEWS[state.view] || viewDashboard)()
    document.getElementById('topbar-note').textContent = '记录有来源，判断交给医生。'
    document.getElementById('agent-state').textContent = state.agentOpen ? '演示 · 未连接宿主' : '演示 · 未连接宿主'
    bindTips(document.getElementById('main'))
    bindTimelineControls()
    bindMetricCards()
    if (state.view === 'timeline') {
      paintTimeline()
      requestAnimationFrame(() => paintTimeline())
    }
  }

  function paintTimeline() {
    const p = P()
    const svg = document.getElementById('timeline-chart')
    if (!svg) return
    const checked = [...document.querySelectorAll('[data-oc-metric]:checked')].map((c) => c.dataset.ocMetric).slice(0, 4)
    const series = checked
      .map((id) => ({ metric: p.metrics.find((m) => m.id === id), obs: metricSeries(p, id) }))
      .filter((s) => s.metric && s.obs.length)
    const colors = ['#1f6b52', '#8a4b22', '#28566f', '#8a3350']
    const narrow = (svg.parentElement?.clientWidth || window.innerWidth) < 640
    const dates = [...new Set(series.flatMap((s) => s.obs.map((o) => o.collectedAt)))].sort()
    const CH = 520, X0 = 62, X1 = 900, Y0 = 132, Y1 = 466
    if (!dates.length || !series.length) {
      svg.innerHTML = `<text x="500" y="${CH / 2}" text-anchor="middle" fill="#5f6f66">勾选左侧指标后这里会出现时间轴。</text>`
      const legend = document.getElementById('timeline-legend'); if (legend) legend.innerHTML = ''
      return
    }
    const t0 = new Date(dates[0] + 'T00:00:00').getTime()
    const t1 = new Date(dates[dates.length - 1] + 'T00:00:00').getTime()
    const x = (d) => X0 + (new Date(d + 'T00:00:00').getTime() - t0) / (t1 - t0 || 1) * (X1 - X0)
    let out = ''
    series.forEach((s, i) => {
      const vals = s.obs.map((o) => o.valueNum)
      const lo = Math.min(...vals), hi = Math.max(...vals)
      const span = hi - lo || Math.max(Math.abs(hi) * 0.08, 1)
      const y = (v) => Y1 - (v - lo) / span * (Y1 - Y0)
      const pts = s.obs.map((o) => [x(o.collectedAt), y(o.valueNum)])
      const d = pts.length > 1 ? monotonePath(pts) : ''
      if (d) out += `<path d="${d}" fill="none" stroke="${colors[i % 4]}" stroke-width="2.2" pathLength="1"/>`
      pts.forEach(([px, py], j) => {
        out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${colors[i % 4]}"><title>${esc(s.metric.name)} ${esc(s.obs[j].rawText)} ${esc(s.metric.unit || '')} ${esc(s.obs[j].collectedAt)}</title></circle>`
      })
      if (!narrow) {
        const last = pts[pts.length - 1]
        const labelY = 170 + i * 24
        out += `<line x1="${last[0].toFixed(1)}" y1="${last[1].toFixed(1)}" x2="${(X1 + 8).toFixed(1)}" y2="${labelY.toFixed(1)}" stroke="${colors[i % 4]}" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/>`
        out += `<text x="${(X1 + 12).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="start" font-size="12" fill="${colors[i % 4]}">${esc(s.metric.name)} ${esc(s.obs[s.obs.length - 1].rawText)} ${esc(s.metric.unit || '')}</text>`
      }
    })
    dates.forEach((d) => {
      const px = x(d)
      out += `<line x1="${px}" y1="${Y0}" x2="${px}" y2="${Y1}" stroke="#dfe6e1" stroke-dasharray="3 4"/>`
      if (dates.length <= 8 || d === dates[0] || d === dates[dates.length - 1]) {
        out += `<text x="${px}" y="${Y1 + 24}" text-anchor="middle" font-size="11" fill="#5f6f66">${d.slice(5)}</text>`
      }
    })
    out += `<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#dfe6e1"/>`
    svg.innerHTML = out
    const legend = document.getElementById('timeline-legend')
    if (legend) legend.innerHTML = series.map((s, i) => {
      const latest = s.obs[s.obs.length - 1]
      const suffix = narrow ? ` · 最近 ${esc(latest.rawText)} ${esc(s.metric.unit || '')}` : ''
      return `<span><i style="background:${colors[i % 4]}"></i>${esc(s.metric.name)}（${esc(s.metric.unit || '')}）${suffix}</span>`
    }).join('')
  }

  function bindTimelineControls() {
    const boxes = [...document.querySelectorAll('[data-oc-metric]')]
    boxes.forEach((box) => box.addEventListener('change', () => {
      const checked = boxes.filter((b) => b.checked)
      if (checked.length > 4) { box.checked = false; notify('最多同时显示 4 条线；先取消一条再选。') }
      paintTimeline()
    }))
    document.querySelectorAll('.oc-group > summary').forEach((sum) => sum.addEventListener('click', () => setTimeout(paintTimeline, 30)))
  }

  function bindMetricCards() {
    document.querySelectorAll('[data-metric]').forEach((card) => {
      card.addEventListener('click', () => {
        const on = card.getAttribute('aria-pressed') !== 'true'
        card.setAttribute('aria-pressed', String(on))
        const back = card.querySelector('.mface.back')
        if (back) back.setAttribute('aria-hidden', String(!on))
      })
    })
  }

  function go(view) {
    if (!VIEWS[view]) return
    state.view = view
    state.sub = null
    if (view === 'day' && !state.dayDate) state.dayDate = dayDates()[0]
    render()
    document.getElementById('main').scrollTop = 0
    try { history.replaceState(null, '', '#view=' + view) } catch (e) { /* file:// 可能禁止 */ }
    if (state.agentOpen) openAgent()
  }

  function setProfile(key) {
    if (!PROFILES[key]) return
    state.profile = key
    state.dayDate = null
    render()
    if (state.agentOpen) openAgent()
  }

  function notify(text) {
    let bar = document.getElementById('toast')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'toast'
      bar.className = 'toast'
      bar.setAttribute('role', 'status')
      bar.setAttribute('aria-live', 'polite')
      document.body.appendChild(bar)
    }
    bar.textContent = text
    bar.hidden = false
    clearTimeout(notify.timer)
    notify.timer = setTimeout(() => { bar.hidden = true }, 4200)
  }

  function bind() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-view],[data-profile],[data-action],[data-doc],[data-discuss],[data-primer-open],[data-trial]')
      if (!target) return
      if (target.matches('[data-primer-open]')) return
      if (target.dataset.view) { event.preventDefault(); go(target.dataset.view); return }
      if (target.dataset.profile) { event.preventDefault(); setProfile(target.dataset.profile); return }
      if (target.dataset.doc) { event.preventDefault(); openDocument(target.dataset.doc); return }
      if (target.dataset.trial) { event.preventDefault(); openTrial(target.dataset.trial); return }
      if (target.dataset.action === 'trial-tab') { event.preventDefault(); state.trialTab = target.dataset.tab; render(); return }
      if (target.dataset.discuss) { event.preventDefault(); openAgent(); return }
      if (target.dataset.action === 'go') { event.preventDefault(); go(target.dataset.view || 'dashboard'); return }
      if (target.dataset.action === 'quick-record') { event.preventDefault(); go('voices'); return }
      if (target.dataset.action === 'upload') {
        event.preventDefault()
        notify('演示：这里会打开文件选择；真实版本只在用户选文件后才发送云解析。本原型不读取任何文件。')
        return
      }
      if (target.dataset.action === 'manual') {
        event.preventDefault()
        notify('演示：手工补录入口。真实版本保存到 config.root 的唯一事实库，本原型不写盘。')
        return
      }
      if (target.dataset.action === 'confirm-candidates' || target.dataset.action === 'reject-candidates') {
        event.preventDefault()
        const ids = [...document.querySelectorAll('[data-cand]:checked')].map((c) => c.dataset.cand)
        if (!ids.length) { notify('先勾选要处理的候选。'); return }
        const decision = target.dataset.action === 'confirm-candidates' ? 'accepted' : 'rejected'
        for (const id of ids) {
          const c = state.demoCandidates.find((x) => x.id === id)
          if (c) c.decision = decision
          else notify(`内置演示候选 ${id} 的确认需生产版经 /api/aosd/candidates/:id/decision 写入 SQLite，本原型不改合成数据。`)
        }
        notify(decision === 'accepted' ? '已确认所选（演示内存）；生产版接受后原值进入检查与指标。' : '已拒收所选（零副作用）。')
        render()
        return
      }
      if (target.dataset.action === 'manual-record') {
        event.preventDefault()
        openManualRecord()
        return
      }
    })
    document.getElementById('main').addEventListener('change', (event) => {
      if (event.target.id === 'day-select') {
        state.dayDate = event.target.value
        render()
      }
    })
    document.getElementById('font-toggle').addEventListener('click', () => {
      state.large = !state.large
      document.body.dataset.font = state.large ? 'large' : 'standard'
      const btn = document.getElementById('font-toggle')
      btn.setAttribute('aria-pressed', String(state.large))
      btn.textContent = state.large ? '标准字' : '大字'
    })
    document.getElementById('agent-toggle').addEventListener('click', () => {
      if (state.agentOpen) closeAgent(); else openAgent()
    })
    document.getElementById('agent-close').addEventListener('click', closeAgent)
    document.getElementById('agent-clear').addEventListener('click', () => {
      document.getElementById('agent-input').value = ''
      document.getElementById('agent-draft').textContent = '还没有带入内容。'
    })
    document.getElementById('agent-send').addEventListener('click', () => {
      const value = document.getElementById('agent-input').value.trim()
      if (!value) {
        document.getElementById('agent-state').textContent = '演示：草稿为空，没有发送'
        return
      }
      /* 演示链路：AI 回复是候选 → 用户确认才入事实；这里生成一条待核对候选进入「资料上传与核对」。 */
      state.demoCandidates.push({
        id: 'demo-c-' + Date.now().toString(36),
        fieldName: '手工/对话整理',
        rawText: value.slice(0, 60),
        valueText: null, valueNum: null, unit: null, refLow: null, refHigh: null,
        collectedAt: new Date().toISOString().slice(0, 10),
        decision: 'pending',
        note: '来自 AI 演示草稿；逐项确认后才可入库（生产版走 /api/aosd/candidates/:id/decision）。',
      })
      document.getElementById('agent-state').textContent = '演示：已生成 1 条待核对候选（未连接模型）'
      notify('已生成待核对候选，请到「资料上传与核对」逐项确认；候选本身不进入记录。')
    })
    document.getElementById('settings-btn').addEventListener('click', () => {
      pv.open({
        key: 'settings',
        title: '设置（原型）',
        crumb: '设置',
        render(body) {
          body.innerHTML = `<section class="card"><h2>资料与隐私</h2>
            <p class="meta-line">事实库：config.root（本原型不写盘，仅说明落点）。外部资料目录：未选择。公共指南资产与患者文件分根。</p>
            <p class="meta-line">敏感记录默认私密；家属默认不可见；导出默认不含；AI 默认不发送。撤销不召回已导出/已发送内容。</p></section>
            <section class="card" style="margin-top:12px"><h2>云端解析</h2>
            <p class="meta-line">未配置 Token。任何云解析需逐文件确认外发范围；失败保留原件且不产生候选。</p></section>`
        },
      })
    })
    window.addEventListener('hashchange', () => {
      const m = /^#view=([a-z-]+)$/.exec(location.hash)
      if (m && VIEWS[m[1]] && m[1] !== state.view) {
        state.view = m[1]
        render()
      }
    })
  }

  function syncTopbarHeight() {
    const h = document.getElementById('topbar').getBoundingClientRect().height
    document.documentElement.style.setProperty('--topbar-h', Math.round(h) + 'px')
  }

  function boot() {
    pv = window.createPageView({ crumbRoot: '主页' })
    document.getElementById('topbar').insertAdjacentHTML('beforeend', '<button type="button" class="ghost" data-primer-open aria-label="疾病概要：定义、指南、治疗全景、趋势">?</button>')
    bind()
    const m = /^#view=([a-z-]+)$/.exec(location.hash)
    if (m && VIEWS[m[1]]) state.view = m[1]
    render()
    document.getElementById('foot-version').textContent = document.getElementById('ver-chip').textContent.trim()
    document.getElementById('foot-date').textContent = D.meta.generatedAt.slice(0, 10)
    syncTopbarHeight()
    window.addEventListener('resize', syncTopbarHeight)
  }

  boot()
})()
