# 小 X 宝 · 成人斯蒂尔病工作台（暂定名）

服务成人斯蒂尔病患者及家属的本机信息整理与就诊准备工作台，分开保存本人/代记症状、报告原文、用药事件和医生答复，不输出诊断、风险或处置判断。

这是接入骨架，尚未实现真实业务。初始化后先将 [项目设计提示词](docs/DESIGN-PROMPT.md) 交给当前Agent；它应展示实际路径并以已有用户/场景/流程素材对齐设计者、研究与取舍原则。癌种项目另有 [完整专用提示词](prompts/NEW-CANCER-WORKBENCH.md)。需求见 [BRIEF](docs/BRIEF.md)，规格见 [SPEC](docs/SPEC.md)，任务见 [TASKS](docs/TASKS.md)；先读 [AGENTS](AGENTS.md)。CLI输出交接与首问，实际对话由Agent接续。

## 疾病概要

状态：M1 公共资料草案，未经独立临床审核。完整来源与局限见 [疾病概要清单](docs/DISEASE-PRIMER.md)。

### 定义

成人斯蒂尔病是一种罕见、病因不明的自身炎症性疾病。国家卫健委 2025 年指南列举发热、皮疹、关节症状、咽痛等表现，并指出诊断需排除感染、肿瘤及其他风湿性疾病。公共描述不能用来给个人自测或归类，本台只保存原始资料与医生原话。

### 医学资料规范和指南情况

- 国家卫健委《86个罕见病病种诊疗指南（2025年版）》：官方 PDF 已取得，517页，AOSD 为正文17–21/PDF21–25。随包保留在 `assets/guidebooks/`，原型/开发版将提供“本地阅读”和[官方PDF](https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf)双入口；浮窗实际链接待M2验证。
- [EULAR/PReS Still’s disease 2024 推荐全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11672000/)：合并 sJIA/AOSD，非中国监管证明。
- [荷兰 AOSD 专家共识全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11147545/)：补充共识，不称正式指南。
- 当前中国 AOSD/Still’s 药品适应症：40组 NMPA 查询后仍未取得现行官方说明书逐项核实，统一标“未核实”；不输出已获批/未获批全表。

### 目前治疗全景概要

NHC 2025 在 AOSD 章节列举 NSAIDs、糖皮质激素、传统 DMARDs 和 IL-1/IL-6/TNF/JAK 抑制剂等类别；EULAR/PReS 讨论 IL-1/IL-6 与减少长期激素暴露，荷兰共识作为补充。它们证据、适用范围和监管语境不同，不能转成个人用药、剂量、停药或换药建议。本台只保存处方/医嘱、实际事件和患者问题。

以上是文献与指南里列出的手段，按文件列举的类别并列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。

### 发展趋势

- 2025-07-10：国家卫健委发布 2025 年罕见病指南通知，含成人斯蒂尔病章节。
- 2024-09-24：EULAR/PReS Still’s disease 正式推荐在线发表。
- 2024-02：NMPA《2023年度药品审评报告》含阿那白滞素历史 FMF/CAPS 审评记录，不能证明当前 AOSD 适应症。
- 2026-10-27：ClinicalTrials.gov 宽条件检索返回26条登记，含完成/终止/撤回/UNKNOWN等状态；不等于正在招募或M4采集完成。

工具不能判断急症；紧急或迅速加重的不适应立即按当地急救/医疗机构渠道处理，不等待记录、导出或AI回复。

## 当前阶段与领取

M1 调研与独立评审修订中，G1/G2/G3 未签，认领见 [Issue #51](https://github.com/xyb-openharness-dsh-plugins/.github/issues/51)。按新版流程 G1 后才建仓；预定 repository 不代表远端已创建。患者/家属访谈为 0，未开展临床审核。

## 开发顺序

先共创SPEC和候选数据关系，再交付HTML交互工作台；由用户确认对应版本/模块后，复核SCHEMA/API并实现生产功能。确认记录见docs/PROTOTYPE-REVIEW.md；模型不依赖前端Tab/流程。模板骨架不是业务已确认。

## 当前能力

- 一个 DSH 工作台注册、认证的健康接口、版本展示与标准/大字切换。
- 已明确选择布局：business-first。business-first 使用 customFrame；模板不创建会话或复制聊天。需要 AI 协助时按官方合同接入原生 conversation 和会话管理。
- 无业务数据库、无演示患者、无真实密钥；所有业务页按确认 spec 逐项实现。

## 开发与本地验收

需要 Node.js 22+、Git、包管理器和可用 DSH Desktop；采用 SQLite 时另核验 node:sqlite 版本条件。宿主 peers 的范围仅是模板基线，请与目标 Desktop 实际依赖核对。

```bash
npm install
npm run check
npm run pack:check
npm pack
```

`npm run check` 只保证"能装"（语法 + 装包合同），第一天就该是绿的。`npm run audit` 管"还是不是家族里的一员"：版本三处一致、`lib/layout.js` 面板参数单一来源、检查链完整、文档与密钥卫生，**只看代码与文件，不看文档自述**。新项目刚生成时 audit 必然有 fail，那是待办清单；交付/发布前必须清零，存在 fail 不得发布（`npm run release:check` 一次跑完两者）。

跑的时间点：**每次改完**跑 `check`；**G2 原型确认后、写业务代码前**先跑一次 `audit`（这时缺的多是 `lib/layout.js`、`VERSION` 这类结构，越早补越便宜）；**交付/装机前**必须跑 `release:check`；**发布或投稿前**把 `npm run audit --json` 的 `xx/xx 通过 · N 失败 · M 待人工` 抄进 `docs/RELEASE.md` 的「家族一致性」一行。`✗` 是结构缺口（补齐，或在 `docs/DEV-REQUIREMENTS-<日期>.md` 写明偏离理由并由用户确认），`!` 是需人工判断的项（逐条给「已人工确认 / 确实没有」）。

`npm install` 可能按 npm 策略解析 peer；勿为消警告重复打包宿主 runtime。客户端本身是单文件；引入 TS/组件库后需添加构建步骤并保留单文件导出。

本地安装入口以当前 Desktop/CLI 帮助为准。安装后按 [docs/06-VALIDATION-AND-RELEASE.md](docs/06-VALIDATION-AND-RELEASE.md) 与官方自测完成真实 UI 验收，并填写 [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)。静态检查不代表已加载。

Logo 来源与使用限制见 assets/README.md。许可证、作者、仓库/发布策略由本项目维护者确认后填写；模板默认为 private/UNLICENSED。

感谢小x宝社区、DataElement 社区，以及 sam / hhx / 繁华的 ❤️ 贡献。

初始化来源记录见 `.dsh-wb-starter.json`。更新社区脚手架不会覆盖本项目；需要升级时先用相同确认配置在临时目录生成，再审阅差异。CLI 用法见 [docs/CLI-GIT.md](docs/CLI-GIT.md)。

## HTML先行与数据演进

业务开发前先交付HTML交互工作台原型、实际预览并由用户确认版本/hash和范围。数据设计先区分领域事实、流程状态和页面读模型，走查前端/流程变化、兼容与迁移；原型对象不直接作为表。见[规范](docs/14-HTML-AND-DATA-CONTRACT.md)。
