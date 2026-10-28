# 开发计划与阶段证据（唯一进度来源）

更新：2026-10-27。状态只分：✅ 实测完成、🔧 骨架/草案、⏳ 未实现、⛔ 闸口待签。文档自述不能替代证据。

| 阶段 | 范围 | 出口与证据 | 状态 |
| --- | --- | --- | --- |
| M0 | 领取、starter init、原创九件核心文档、宿主前置、staticPass | Issue #51 + `npm run check` 退出码0/staticPass:true + `npm test` 7/7 | ✅ 实测完成（仅骨架） |
| M1 | 医学十主题、用户研究证据分层、样板与基准对比、SPEC/交互路径 | 三路已合流；三轮独立评审修订完成（患者评审BLOCK→READY，HVT B1/G2/W3/U2→待最终针对性复核）；检查+测试10/10；**G1 签认** | 🔧 文件待最终复核，G1未签 |
| M2 | 唯一演示源、HTML 四件套、整页/折叠/窄宽/原值表/AI、走查与截图 | v0.4：72组走查0错误/0溢出；12页；一图秀/指标卡/试验三页/写入闭环截图 | ✅ 文件完成（G2 待用户确认） |
| M3 | 0001 迁移与 freeze-contract | `schema/migrations/0001_initial.sql` + freeze sha256 + 禁判读列扫描 + 27项存储测试 | ✅ 已建（用户 2026-10-27 指示启用 SQLite 唯一存储） |
| M4 | 四通道采集与四件套临床快照 | `scripts/fetch-aosd-trials-2026.mjs` → manifest/jsonl/sqlite/README；2026-10-28 快照 2 条（chictr SUCCESS，ictrp FAILED/ctv NO_RESULTS/chinadrugtrials DENIED），三载体一致 | ✅ 已采（在线源有失败，如实记录） |
| M5 | 七步移植、宿主链路、MinerU、apiBase、五套测试、parity | public/ 12页同源移植；client iframe → /api/aosd/ui/；静态路由+资产白名单；`npm run check` 绿、`npm test` 28/28 | 🔧 开发版已移植（MinerU 未接、Native Agent 未接） |
| M6 | 升版打包、真实 tgz 装机、重启后新会话、真机走查 | v0.5.0 tgz 已装入 Desktop web profile 且 bundles 登记；**界面加载需用户完全退出重开 Desktop**；V3 业务走查未做 | 🔧 已装，待重启验收 |
| M7 | tag、Release、tgz/sha256、CHANGELOG | v0.5.0 tag + [Release](https://github.com/xyb-openharness-dsh-plugins/aosd-workbench/releases/tag/v0.5.0)（tgz + .sha256） | ✅ 已发布 |
| M8 | BACKLOG 只改状态列 | [PR #52](https://github.com/xyb-openharness-dsh-plugins/.github/pull/52)：仅第4行状态列 ⬜→🔵（v0.5.0/日期/Issue #51） | ✅ 已提 PR（待合） |
| M9 | 项目/脚手架经验回流 | [starter PR #3](https://github.com/xyb-openharness-dsh-plugins/xyb-workbench-starter/pull/3)：单行 ROUTES 修复 + 39号 toggletip + L51/L52；starter check 绿、66/66 | ✅ 已提 PR（待合） |

## 当前交接

- 服务主体已确认：患者及家属；当前 0 访谈，未确认任何患者场景优先级。
- 认领 Issue #51 已打 `claimed`；T1/波次/建仓按新版维护者 triage，未提前建仓。
- starter 本地版本 `1.10.0-rc.2`，含既有 dirty 修改；本项目由该实际版本生成，未修改 starter。
- 残留检查器自身规则/测试样本误报已修，精确排除检查器文件、负例动态构造；`npm test` 10/10，待 M9 回流 starter。
- 已探测到 DSH Desktop 与目标 Harness；本包未安装，未重启、未创建会话。
- 用户于 2026-10-27 要求官方指南保留到 assets：517页PDF已纳入 `assets/guidebooks/`，hash不变；浮窗本地链接和打包/装机测试待 M2/M6。
- M1 医学十主题/EULAR-PReS全文/NMPA 40组检索、患者E01–E14、家族对比均已合流；SPEC/SCENARIOS/INTERACTION/FEATURE/SCHEMA/UI/SETTINGS/AGENT/ACCEPTANCE/DIFF/HVT/DESIGN-REVIEW 已多轮修订。
- 独立评审暴露的P0（三类代记、AI急症与个体判断、图形误读、复诊未核对导出）与HVT三项阻断（事实库落点、研究占位、选材旧口径）均已写进字段/交互/验收；最终针对性复核进行中。
- G1 已于2026-10-27由用户签认（“G1通过，继续”）。组织私有仓已建，`main` 指向已验证基线。
- M2 原型 `prototypes/v0.2` 与两套6个月合成数据完成；`npm run check`通过、`npm test`17/17；48组无头走查0错误/0溢出。
- 下一步：**等待用户 G2 确认版本/范围**；未签不做M5生产移植。独立视觉评审未做，须如实保留。
