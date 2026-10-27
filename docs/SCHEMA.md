# 数据主体—关系—表（G3 前候选）

状态：M1 候选数据关系；**未冻结、未建表、未写迁移**。G2 后复核，G3 签认才可生成 `schema/0001_initial.sql` 与 freeze-contract。本文不替代 SQL。

## 1. 稳定实体与边界

| 实体 | 稳定 ID / 主体 | 核心字段与约束 | 来源/确认/生命周期 |
| --- | --- | --- | --- |
| subject | subject_id | 患者主体、病名记录状态、创建时间；无诊断计算 | 用户建档；更正留史 |
| source_actor | actor_id / subject可选 | 本人/家属/机构/医生/AI、与患者关系、显示名 | 自述或文档；AI不具医学审核身份 |
| document | document_id / subject | hash、MIME、机构、报告日、相对位置、来源类型 | 原件；公共指南与患者文件分根 |
| narrative | narrative_id / subject+actor | `experienced_by`、`content_kind`（本人自述/家属转述本人/家属观察或感受）、`speaker`、`recorded_by`、关系与授权范围、发生与录入时间、原话、私密、确认、revision | 三类来源分开；本人/家属补充与更正各自追加 |
| medication_event | event_id / subject | 药名/剂量原文、计划或实际、事件类型、日期、来源、revision | 医嘱/本人/代记分列；不推疗效 |
| clinical_reply | reply_id / subject | 医生原话、说话者、日期、患者理解、来源、revision | 原话与理解不合并 |
| candidate | candidate_id / document或任务 | 抽取类型、原值、结构化候选、逐项状态、模型/版本、失败 | AI/MinerU；拒收零副作用 |
| metric_definition | metric_id | 名称、方法/机构/单位上下文、分类/数值类型 | 指标目录，不能替报告补单位 |
| observation | observation_id / subject+metric+document | 报告原项目名、原文值、可空数值、原文单位、参考范围原文/上下限、`collected_at`与`reported_at`及各自 `time_precision`、机构、方法、原件定位、revision | 确认记录派生；缺值/日期/单位均为null，采样日不冒充报告日 |
| question | question_id / subject | 问题、主题、私密、答复关联、`sort_order`、已问/未问状态、revision | 用户问题，不是医学结论；诊后答复关联原问题 |
| authorization | authorization_id / subject | `grantor_id`、`grantee_id`、内容/出口范围、`granted_at`、`revoked_at`、revision；授权人必须为患者本人或经核实的合法授权主体 | 本人显式授权，AI不得生成/推断/确认；撤销追加留史 |
| visit_snapshot | snapshot_id / subject | 所选对象ID+所选revision/原件hash、每项review_state、问题`sort_order`、`export_format`（简/详）、数据截止、生成时间、导出相对路径与hash、过时状态 | 可显式包含未核对材料但持续标注；源更正不改旧快照内容 |
| public_resource | resource_id | 公共版本、URL/本地路径、地区、证据性质、核验日期、局限 | 与患者事实分离；未核实如实 |

## 2. 约束与读模型

- 所有记录按 `subject_id` 隔离，来源含 `actor_id/document_id`；记录者与患者不是同一概念。
- 更正字段 `revision`、`supersedes_id`、`recorded_at` 追加；不允许硬删覆盖旧史。
- `candidate` 接受产生确认事实，`reviewed_by` 仅表示用户转录核对，不表示医学审核。
- 禁止 `diagnosis`、`risk_level`、`eligible`、`suitability` 判读列；派生提醒不写回事实。
- 可选值显式 null，尤其数值/单位/参考范围；`<0.5`保留原文且 `value_num=null`。
- `using` 保留字改用 `in_use`；复合主键裸查询 `ORDER BY rowid`；手写倒序只按 ord；分节标题 `section_titles`；分类指标不进入数值曲线。
- 读模型：dashboard、day-view、metrics、visit-prep 读取同一领域源，已确认记录、本人草稿、原件索引和未核对材料各有 ID/review_state，不合并成“已确认”。选材可逐项显式选择上述允许项，保存所选 revision/原件 hash 并持续标注；私密及未授权代记过滤不变，AI许可不扩大。快照含数据截止，不存整页任意 state。
- `is_private`、`family_visible`、`export_allowed`、`ai_allowed` 四个默认值独立；敏感记录默认私密，家属/导出/AI默认排除。撤销只影响之后，不承诺召回已导出或已发送内容。
- 未授权代记不得写入共享档案，**默认不持久化未授权草稿**；如未来允许受限草稿，必须另行明确授权主体、保存位置、删除和退出，不得默认进看板、导出或 AI。AI 不得生成、推断或确认授权。
- 快照保存所选 revision/原件 hash，而不是仅对象ID；更正只让旧快照标过时，不改变其当时内容。手工允许导出未核对材料不自动扩展为AI发送许可。

## 3. 持久化与规模

拟用 SQLite（Node 22 `node:sqlite`，实际 Desktop ABI 待 M5/M6 核验）。适合本机单患者/少量家属、按日期与来源查询、事务与修订链；不用 JSON 文件承载核心关系。外部记忆/云同步不启用，本地无网络仍可手录回看。性能目标待有代表数据后实测，不虚报。

| 数据类别 | 权威位置 | 读写/失效 |
| --- | --- | --- |
| 已确认事实与手工/草稿记录 | 宿主注入 `config.root=dshHomePath('aosd')` 的应用专属本机数据库 | 唯一事实库；稳定ID/revision/review_state；未选外部目录仍可初始化、刷新恢复和跨页读取；更正使旧快照标过时 |
| 文件与导出 | 用户明确选择的外部目录相对路径；原件不随包；未选外部目录时仍可用config.root中的记录与元数据 | hash/来源/权限；切换只改后续原件映射/导出位置，不自动移动或删除旧件；卸载不删除 |
| 公共参考 | `assets/guidebooks/` 和只读公共数据包 | 与患者目录分离；版本/hash可核 |
| 偏好 | 展示设置（面板/字号/非敏感授权状态） | 不作为医学事实；可恢复默认 |
| 候选/缓存 | 候选有审核状态；可重建索引与原件分开 | 拒收/失败不伪造事实；旧代次失效 |

## 4. 前端/流程变化矩阵（G3 前必填）

| 变化 | 不变事实 | 投影/API/迁移 | 验收 |
| --- | --- | --- | --- |
| 改一级导航/页面拆合 | subject/source/document/narrative等 | 只改读模型与导航，不清库 | 同ID跨页一致 |
| 新指标 | 定义与观察的关系 | 新定义目录行；语义变化才迁移 | 缺单位不补、旧记录可读 |
| 新增家属或补充 | 原始叙述 | 新 actor/narrative/revision，不覆盖 | 原话和授权可追 |
| 更正/撤回候选 | 原件与历史版本 | 追加更正/状态，旧快照标过时 | 拒收零副作用 |
| 未确诊→医生记录病名 | 原始报告/当时名称 | 新增病名记录状态，不改历史 | 不回头把旧症状归病 |
| 页面新增 AI | 已确认事实/私密边界 | 只组装授权上下文，不自动回写 | AI离线仍能手录 |
| 旧库/客户端升级 | 用户原件与记录 | 备份、递增迁移、读模型版本、回滚不删库 | fixture/迁移实测 |

## 5. G3 前未决

- 代记授权的最低字段与默认私密范围，需患者与家属分别核对。
- 报告指标的最低字段/空值与跨机构可比规则，需真实合成样例及医学核对。
- 病名记录状态、临床答复与患者理解的链接方式，避免暗示医生已确认所有资料。
- SQLite 实际 Desktop ABI、备份/迁移、目录初始化和包内 schema 分发，M5/M6 实测。
- 当前无 SQL、无 freeze-contract、无生产数据库，不宣称 G3 已完成。
