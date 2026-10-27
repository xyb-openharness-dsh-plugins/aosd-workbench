# 开发计划与阶段证据（唯一进度来源）

更新：2026-10-27。状态只分：✅ 实测完成、🔧 骨架/草案、⏳ 未实现、⛔ 闸口待签。文档自述不能替代证据。

| 阶段 | 范围 | 出口与证据 | 状态 |
| --- | --- | --- | --- |
| M0 | 领取、starter init、原创九件核心文档、宿主前置、staticPass | Issue #51 + `npm run check` 退出码0/staticPass:true + `npm test` 7/7 | ✅ 实测完成（仅骨架） |
| M1 | 医学十主题、用户研究证据分层、样板与基准对比、SPEC/交互路径 | 三路已合流；三轮独立评审修订完成（患者评审BLOCK→READY，HVT B1/G2/W3/U2→待最终针对性复核）；检查+测试10/10；**G1 签认** | 🔧 文件待最终复核，G1未签 |
| M2 | 唯一演示源、HTML 四件套、整页/折叠/窄宽/图表/AI、独立评审与截图 | **G2 签版本/hash/范围**；X1–X4、P0=0 | ⏳ 未开始 |
| M3 | 0001 迁移与 freeze-contract | **G3 签认**、sha256、判读列断言 | ⏳ 未开始 |
| M4 | 四通道采集与四件套临床快照 | manifest=jsonl=sqlite；FAILED/未配置分开 | ⏳ 未开始 |
| M5 | 七步移植、宿主链路、MinerU、apiBase、五套测试、parity | V1 check/test/audit/HVT；不写装机通过 | ⏳ 未开始 |
| M6 | 升版打包、真实 tgz 装机、重启后新会话、真机走查 | V2 配置/加载证据；V3 用户实机确认 | ⏳ 未开始 |
| M7 | tag、Release、tgz/sha256、CHANGELOG | 实际 GitHub 链接与资产校验 | ⏳ 未开始 |
| M8 | BACKLOG 只改状态列 | 先 pull main，经 PR 回填版本/日期/依据 | ⏳ 未开始 |
| M9 | 项目/脚手架经验回流 | 可断言优先，starter check/test；至少一项下轮直接受益 | ⏳ 未开始 |

## 当前交接

- 服务主体已确认：患者及家属；当前 0 访谈，未确认任何患者场景优先级。
- 认领 Issue #51 已打 `claimed`；T1/波次/建仓按新版维护者 triage，未提前建仓。
- starter 本地版本 `1.10.0-rc.2`，含既有 dirty 修改；本项目由该实际版本生成，未修改 starter。
- 残留检查器自身规则/测试样本误报已修，精确排除检查器文件、负例动态构造；`npm test` 10/10，待 M9 回流 starter。
- 已探测到 DSH Desktop 与目标 Harness；本包未安装，未重启、未创建会话。
- 用户于 2026-10-27 要求官方指南保留到 assets：517页PDF已纳入 `assets/guidebooks/`，hash不变；浮窗本地链接和打包/装机测试待 M2/M6。
- M1 医学十主题/EULAR-PReS全文/NMPA 40组检索、患者E01–E14、家族对比均已合流；SPEC/SCENARIOS/INTERACTION/FEATURE/SCHEMA/UI/SETTINGS/AGENT/ACCEPTANCE/DIFF/HVT/DESIGN-REVIEW 已多轮修订。
- 独立评审暴露的P0（三类代记、AI急症与个体判断、图形误读、复诊未核对导出）与HVT三项阻断（事实库落点、研究占位、选材旧口径）均已写进字段/交互/验收；最终针对性复核进行中。
- 下一步：最终复核若确认B0/G0/W0/U2，提交G1范围与两项偏离给用户签认；**未签不开HTML、不建生产表、不建组织仓**。
