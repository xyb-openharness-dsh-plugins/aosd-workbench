# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.5.1 — 2026-11-11

- 补：面板此前只有业务 iframe，**完全没有原生 AI 对话入口**——`Panel()` 连 props 都不接，宿主给的 conversation 节点无处安放。现按家族 A 形态补齐：自建顶栏（品牌 + 版本 chip + 状态 + 「AI 对话」+ 重新加载）、业务区 iframe、1px 可拖分隔线、右侧原生会话常挂载、窄屏覆盖式抽屉、宽度本地记忆。
- 新：`lib/layout.js` 作为面板参数唯一来源，由 `scripts/build-version.mjs` 注入客户端 `layout:begin/end` 块（含 customFrame 与 businessWidth，客户端不再手写第二份默认值）；同时生成 `lib/version.js`。
- 新：会话契约按 9 条落地——`ownsSession(currentSession())` 判会话、无会话点按钮走 `newSession(defaultWorkspace?.()?.workspaceId)`、取消不留空会话、失败在工作台内报原因、订阅 `subscribe` 重渲染、草稿只填入不发送。
- 校验：`check-agent-pane-contract.mjs` 与 `build-version --check` 并入 `npm run check`；单测纳入检查链。
- 已知缺口（不在本次范围）：本仓没有文案红线检查器（`check-wording.mjs`），audit 的 `check/文案红线` 仍为 fail；要引入需先按本癌种口径清理页面文案。

## 0.5.0 — 2026-10-28

- M5 开发版：原型移植 public/（12 页逐字符同源），Desktop 客户端改 iframe 加载 /api/aosd/ui/；服务端注入 __VERSION_DISPLAY__；新增公共指南白名单路由 /api/aosd/assets/guidebooks/。品牌定稿小炎宝 FlamePal。

## 0.4.0 — 2026-10-28

- v0.4：临床研究三页（35号粗筛）、一图秀指标选择（分类折叠 ≤4）、toggletip 浮窗说明、SQLite 唯一存储（0001 冻结 + store + 写入接口 + 27 项测试）、手工/AI 写入演示闭环。

## 0.3.0 — 2026-10-27

- 首个可装机版本：v0.3 原型（11 页）、两套 6 个月合成档案、一图秀与指标卡、上传四步、36 号临床资料、小炎宝 FlamePal 品牌。

## 0.1.0 — 2026-10-27

- 由社区脚手架 dsh-wb-cli@1.10.0-rc.2 (6282be9+dirty) 初始化，仅有注册骨架与健康接口，无业务功能。
- 完成认领 Issue #51；服务主体确认为患者及家属，当前 0 访谈、0 临床审核。
- 新增本病种原创 M0 九件核心文档与设计者记录；病程/MinerU/品牌按可回退默认值登记。
- 补充 patch `config.root`，预定私有仓 URL 仅供包配置；按新版规则 G1 后才建仓。
- 修复残留检查器把自身规则和历史样本算作业务残留的问题，新增精确路径边界及回归；尚未宣称基线通过。
- M1 完成三路调研合流：医学十主题/EULAR-PReS全文/NMPA 40组检索、患者公开证据 E01–E14（0访谈）、家族对比与一级重名率 25%/12.5%。
- 三轮独立评审修订：三类代记与授权、AI 个体判断/急症退出、一期原报告值表替代曲线、未核对材料可导出、快照 revision、诊后答复、config.root 唯一事实库、研究不占位。
- 官方指南 PDF 按用户要求随包保留，真实 npm pack 清单与 SHA-256 已验；浮窗、HTTP、装机未验。
- 当前 `npm run check` 通过、`npm test` 10/10；不表示原型、业务、医学审核或患者需求已验证。
