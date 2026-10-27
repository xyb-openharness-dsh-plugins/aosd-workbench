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
    ['documents', '报告与核对', 'doc'],
    ['metrics', '指标回看', 'table'],
    ['medications', '用药与医嘱', 'pill'],
    ['visit', '复诊准备', 'clipboard'],
    ['resources', '疾病与资源', 'book'],
  ]
  /* 全量探针据此逐页渲染；加页必须同时更新探针，避免“探针没扫到却全绿”。 */
  const ROUTES = ['dashboard', 'voices', 'day', 'documents', 'metrics', 'medications', 'visit', 'resources']
  const ICONS = {
    home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/>',
    voice: '<path d="M4 5h16v10H9l-5 4z"/>',
    day: '<path d="M4 6h16v14H4zM8 3v4m8-4v4M4 10h16"/>',
    doc: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
    table: '<path d="M4 5h16v14H4zM4 10h16M10 5v14"/>',
    pill: '<path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7Zm0 5h10"/>',
    clipboard: '<path d="M8 4h8v3H8zM6 6h12v14H6zM9 12h6M9 16h4"/>',
    book: '<path d="M5 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h4z"/>',
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
    const groups = [
      ['self', '本人自述'],
      ['family_relay', '家属转述本人'],
      ['family_observation', '家属观察/感受'],
    ]
    return `${profileSwitcher()}
    ${pageHead('本人与代记', '谁的经历、谁说的、谁录入的分开显示；未授权内容不进入共享档案。', agentButton('voices'))}
    <div class="banner soft">本页只示范合成档案。私密记录默认不进导出、不发送给 AI；代记需要患者本人授权，AI 不能代替确认。</div>
    <div class="grid">
      ${groups.map(([kind, label]) => {
        const list = p.narratives.filter((n) => n.contentKind === kind)
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
    const pending = p.candidates.filter((c) => c.decision === 'pending')
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

  /* ---------------- 用药与医嘱 ---------------- */
  function viewMedications() {
    const p = P()
    const planned = p.medications.filter((m) => m.eventKind === 'planned')
    const actual = p.medications.filter((m) => m.eventKind === 'actual')
    return `${profileSwitcher()}
    ${pageHead('用药与医嘱', '计划、实际事件、医生原话和患者自己的理解分开记录；不生成治疗线、剂量调整或疗效判断。', agentButton('medications'))}
    <div class="grid">
      <section class="card"><h2>医嘱与计划（${planned.length}）</h2>
        ${planned.map((m) => `<details class="fold"><summary>${esc(m.drugName)} · ${esc(m.doseText)} · ${esc(m.startedOn)} 起</summary>
          <div class="fold-body"><div class="fold-grid">
            <div><h4>医生原话</h4><p class="quote">${m.doctorQuote ? '“' + esc(m.doctorQuote) + '”' : '未记录原文'}</p></div>
            <div><h4>患者理解</h4><p>${m.patientUnderstanding ? esc(m.patientUnderstanding) : '未记录'}</p></div>
            <div><h4>来源</h4><p class="meta-line">${esc(m.sourceDocumentId || '手录')}</p></div>
            <div><h4>说明</h4><p class="meta-line">${esc(m.note)}</p></div>
          </div></div></details>`).join('')}
      </section>
      <section class="card"><h2>实际用药事件（${actual.length}）</h2>
        <div class="list">${actual.map((m) => `<div class="item"><div class="when">${esc(m.startedOn)}</div><div class="what"><p>${esc(m.drugName)} · ${esc(m.doseText)}</p></div></div>`).join('') || EMPTY}</div>
        <h3 style="margin-top:14px">医生答复原文</h3>
        <div class="list">${p.replies.map((r) => `<div class="item"><div class="when">${esc(r.occurredAt)}</div><div class="what"><p class="quote">“${esc(r.quote)}”</p><p class="meta-line">${esc(r.dept)} · ${esc(r.speaker)}${r.patientUnderstanding ? ' · 患者理解：' + esc(r.patientUnderstanding) : ''}</p></div></div>`).join('')}</div>
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
        <ul class="small"><li>定义：罕见、病因不明的自身炎症性疾病，诊断需排除其他疾病。</li><li>指南：NHC 2025 官方 PDF 已随包；EULAR/PReS 2024 为国际推荐。</li><li>治疗：只列文献类别，不排序、不推荐。</li><li>趋势：只写已发生的版本/检索事实。</li></ul>
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
    medications: viewMedications,
    visit: viewVisit,
    resources: viewResources,
  }
  const TITLES = { dashboard: '看板', voices: '本人与代记', day: '同日经过', documents: '报告与核对', metrics: '指标回看', medications: '用药与医嘱', visit: '复诊准备', resources: '疾病与资源' }

  function renderNav() {
    document.getElementById('nav').innerHTML = PAGES.map(([key, label, ic]) =>
      `<button type="button" data-view="${key}" aria-current="${state.view === key ? 'page' : 'false'}">${icon(ic)}<span class="txt">${label}</span></button>`).join('')
  }

  function render() {
    renderNav()
    document.getElementById('main').innerHTML = (VIEWS[state.view] || viewDashboard)()
    document.getElementById('topbar-note').textContent = '记录有来源，判断交给医生。'
    document.getElementById('agent-state').textContent = state.agentOpen ? '演示 · 未连接宿主' : '演示 · 未连接宿主'
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

  function bind() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-view],[data-profile],[data-action],[data-doc],[data-discuss],[data-primer-open]')
      if (!target) return
      if (target.matches('[data-primer-open]')) return
      if (target.dataset.view) { event.preventDefault(); go(target.dataset.view); return }
      if (target.dataset.profile) { event.preventDefault(); setProfile(target.dataset.profile); return }
      if (target.dataset.doc) { event.preventDefault(); openDocument(target.dataset.doc); return }
      if (target.dataset.discuss) { event.preventDefault(); openAgent(); return }
      if (target.dataset.action === 'go') { event.preventDefault(); go(target.dataset.view || 'dashboard'); return }
      if (target.dataset.action === 'quick-record') { event.preventDefault(); go('voices'); return }
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
      document.getElementById('agent-state').textContent = value
        ? '演示：已收集草稿，未连接模型'
        : '演示：草稿为空，没有发送'
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
    document.getElementById('foot-version').textContent = 'v0.2.0-prototype'
    document.getElementById('foot-date').textContent = D.meta.generatedAt.slice(0, 10)
    syncTopbarHeight()
    window.addEventListener('resize', syncTopbarHeight)
  }

  boot()
})()
