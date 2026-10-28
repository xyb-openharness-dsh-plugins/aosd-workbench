/* 本文件由源码模板生成，请勿手改；客户端单文件由 Desktop 直接加载（workbench-standard §3.5）。
 * 面板形态：customFrame —— 宿主把原生会话节点交给本插件排版；业务 UI 是 public/ 的独立前端，
 * 经 iframe 挂在 /api/aosd/ui/（与本地 dev-server 同一份，不两套构建）。
 * 版本：由构建注入，与 VERSION/package.json 同源。
 */
;(function () {
  if (typeof window === 'undefined' || typeof window.__ModuleLoader__?.load !== 'function') return

  window.__ModuleLoader__.load({
    id: '@xyb-community/aosd-workbench',
    factory: (require) => {
      const React = require('react')
      const h = React.createElement

      const UI_ENTRY = '/api/aosd/ui/'
      const VERSION = '0.5.3'
      const TITLE = '小炎宝 FlamePal · 成人斯蒂尔病工作台'
      const PANEL_TITLE = '小炎宝 FlamePal'
      const SUBTITLE = '本机数据 · 记录不是诊断'

      function Panel() {
        const [ready, setReady] = React.useState(false)
        const [failed, setFailed] = React.useState(false)
        const [attempt, setAttempt] = React.useState(0)
        /* iframe 是唯一 UI 入口：加载成功即可用，**不以 health 成功作为门槛**
           （health 曾因路由前缀冲突返回 404，把可用的 UI 挡在“连接失败”后面）。 */
        React.useEffect(() => {
          setReady(false); setFailed(false)
          const timer = setTimeout(() => setFailed(true), 6000)
          return () => clearTimeout(timer)
        }, [attempt])
        return h('main', { className: 'wb-aosd', style: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#f7f8f6' } },
          h('style', null, '.wb-aosd iframe{flex:1;width:100%;border:0;display:block}.wb-aosd .aosd-fallback{padding:24px;font:14px/1.6 -apple-system,"PingFang SC",sans-serif;color:#25302b;display:flex;flex-direction:column;gap:12px;align-items:flex-start;position:absolute;inset:0;justify-content:center;background:#f7f8f6}'),
          !ready && !failed && h('div', { className: 'aosd-fallback', role: 'status' }, '正在加载工作台…'),
          failed && !ready && h('div', { className: 'aosd-fallback', role: 'alert' },
            h('b', null, '工作台界面没有加载出来'),
            h('span', null, '请确认本包已装到 DSH Desktop 的 profile，并完全退出后重新打开 Desktop。'),
            h('button', { type: 'button', onClick: () => setAttempt((v) => v + 1) }, '重试')),
          h('iframe', {
            key: attempt,
            src: UI_ENTRY,
            title: PANEL_TITLE,
            style: { opacity: ready ? 1 : 0 },
            onLoad: () => { setReady(true); setFailed(false) },
          }))
      }

      function apply(ctx) {
        ctx.effect(() => ctx.desktopWorkbenches.register({
          title: TITLE,
          repository: 'https://github.com/xyb-openharness-dsh-plugins/aosd-workbench',
          description: '成人斯蒂尔病患者及家属的本机信息整理与就诊准备工作台：本人/家属/报告/医嘱分来源记录，原报告值回看与就诊材料导出；不输出诊断、风险或处置判断。',
          customFrame: true,
        }, Panel))
      }
      return { apply, inject: ['desktopWorkbenches'] }
    },
  })
})()
