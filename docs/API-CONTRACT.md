# API 合同 v0.1（候选，未实现业务接口）

现有唯一接口：`GET /api/aosd/health`（骨架）。以下仅为 G1 评审用合同草案，不得当成已可用 API。

## 通用约束

- `apiBase` 不含 `/api`；调用写 `${apiBase}/api/aosd/...`。独立 HTTP 与宿主 webServer 共用 handler，鉴权由宿主 connection 执行，loopback 不豁免。
- `subjectId`、`occurredAt` 带时区/精度、`recordedAt`、来源 `actorId/documentId`、`revision`、`reviewState`、`requestId` 是公共语义。
- 成功空集合为 `[]`，未知为 `null`；不混用空字符串/0 冒充缺值。
- 错误统一 `{ "error": { "code", "message", "retryable", "details?" } }`；400 输入、404 未知、409 未选目录或修订冲突、413 文件过大、502 外部服务、503 未配置。向页面返回结构化错误，禁止裸 throw、堆栈/密钥/患者本机路径外泄。
- 写命令显式列、事务、revision 和幂等键；更正新增版本；旧快照只标过时。候选接受不是医学审核。

| 方法/路径 | 意图 | 输入与成功 | 错误/边界 | 状态 |
| --- | --- | --- | --- | --- |
| GET `/api/aosd/health` | 版本与骨架能力 | `{ok,version,apiVersion,capabilities}` | 宿主鉴权/405/503 | 🔧 已有，未真机 |
| GET `/api/aosd/bootstrap` | 看板/设置/当前subject读模型 | 当前版本、最近记录、待核对与能力状态 | 未选目录仍给空态而非假就绪 | ⏳ |
| GET `/api/aosd/day?date=YYYY-MM-DD` | 同日四轨 | 自述/文档/用药/医嘱，来源和发生/录入日期 | 无记录为空；不生成因果摘要 | ⏳ |
| GET `/api/aosd/metrics?metricId=…` | 可比指标与来源 | 序列、单位/方法/机构上下文、空值/单点 | 缺上下文拆组，不计算活动度 | ⏳ |
| GET `/api/aosd/visit-prep` | 选材/问题/快照 | 已确认或显式选择的未核对材料/原件ID、各自review_state、问题、私密排除 | 未核对持续标注；不自动含私密/候选值 | ⏳ |
| POST `/api/aosd/narratives` | 本人或授权代记 | 原话/来源/关系/发生日/授权/私密 | 未授权、来源缺失400/409 | ⏳ |
| POST `/api/aosd/narratives/:id/corrections` | 补充/更正 | 新版本、revision、原版本ID | 不覆盖旧版 | ⏳ |
| POST `/api/aosd/documents` | 原件索引 | hash/MIME/机构/报告日/相对路径 | 公共资产与患者文件分根 | ⏳ |
| POST `/api/aosd/candidates/:id/decision` | 候选逐项接受/拒收 | 审核后的字段或拒收状态 | 拒收零副作用；失败不造候选 | ⏳ |
| POST `/api/aosd/medication-events` | 实际/计划用药事件 | 药名/剂量原文/事件类型/来源 | 无调药或疗效计算 | ⏳ |
| POST `/api/aosd/clinical-replies` | 医嘱/医生原话与患者理解 | 分栏原话、说话者、日期、理解 | AI不可生成医生答复 | ⏳ |
| POST `/api/aosd/questions` | 保存待问事项 | 正文/主题/私密/来源 | 不自动作答为事实 | ⏳ |
| POST `/api/aosd/visit-snapshots` | 生成可回看快照 | 已选ID/截止/导出hash | 私密过滤；更正标过时 | ⏳ |
| GET `/assets/guidebooks/nhc-86-rare-diseases-2025.pdf` | 公共官方指南本地阅读 | PDF、content-type、page锚由阅读器处理 | 常量白名单，拒绝`..`/患者路径 | ⏳ 文件已就位路由未做 |

## Agent 消息

业务页仅发送 `{type:'aosd:agent-draft', prompt, send:true}`，父窗口校验 `event.source===自身iframe.contentWindow` 与 `event.origin===location.origin`，prompt≤8000。只含用户选择的内容及明确授权；private 默认排除，未确认候选只报数量不带值，不带本机路径。AI只做逐字提取、来源整理与待问清单排版，禁止新增个体病名、正常/异常、复发/并发症、紧急度、调药或疗效判断。按 34 号 plain/draft 守卫、会话归属和降级；独立 file:// 显示演示/复制，不冒充发送。固定提示：工具不能判断急症，紧急或迅速加重不适应立即走当地急救/医疗机构渠道，不等待记录、导出或AI。

## 外部服务

MinerU HTTP v4 仅用户显式选择文件并授权后调用；状态/失败不静默本地凑候选。临床试验 M4 未做，接口不得返回静态“已查到”或0条假结果。公共指南本地路由与官方 URL 分开，文件存在不代表 HTTP/UI 已验证。
