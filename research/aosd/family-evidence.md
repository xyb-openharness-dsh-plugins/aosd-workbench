# AOSD family comparison · 证据与复算记录

日期：2026-10-27。目的：为 `docs/FAMILY-COMPARISON.md` 保留可回溯证据、真实一级页、契约差异和重名率复算方法。本文是研究证据，不是已确认 SPEC、生产 SCHEMA/API、原型验收或患者研究结论。

## 1. 范围、只读纪律与快照

工作目录：`/Users/qinxiaoqiang/Downloads/aosd-workbench/.worktrees/family`；研究开始时 `git status --short --branch` 为 `## research/family`，目标两个文件均不存在。授权写入范围只有：

- `/Users/qinxiaoqiang/Downloads/aosd-workbench/.worktrees/family/docs/FAMILY-COMPARISON.md`
- `/Users/qinxiaoqiang/Downloads/aosd-workbench/.worktrees/family/research/aosd/family-evidence.md`

只读检查的两个仓没有编辑、格式化、安装依赖、运行生成器或写入数据库。cervical 为 Git 仓，研究时 `git status --short` 无输出，HEAD `5c84db73923d43ad37e0d762b233e139e0b8a0fa`。breast 的 `git status --short` 显示既有修改，包括 `prototypes/v0.4/app.js`、`public/app.js`、`lib/client.js`、`src/client.js` 等；未还原、未暂存、未提交。其 HEAD `dd9794b87d5c61c331f799b9b645a2185495bc5b`，因此本文以**工作树实际源码**而非 HEAD 内容为准。 breast 仍保留未提交改动的声明不能解释为本文造成。

| 导航实证文件 | 研究时 SHA-256 | 研究时只读操作 |
| --- | --- | --- |
| `/Users/qinxiaoqiang/Downloads/cervical-workbench/prototypes/v0.2/app.js` | `a6eb997cb2fb283ee9010fdb3e56fb7f6bfd97a4910ea67f0da366da1ffafcbc` | Read、rg、Node `fs.readFileSync` 抽取数组 |
| `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/prototypes/v0.4/app.js` | `bdc15c747a02a4ba45905fa3028e4fee0ba4e6bb910125be908a7fa943ef0058` | Read、rg、Node `fs.readFileSync` 抽取数组 |

采集命令为 `shasum -a 256 <两个 app.js>`；分支和状态由 `git -C <仓> status --short[ --branch]` 与 `rev-parse HEAD` 读取。本文不将 hash 当作原型签认：它只标识本次重名率使用的输入。

**实际完成与未完成：** 完成源码静态核对、基准 SPEC/USER-RESEARCH/SCHEMA/API/MinerU 合同阅读、候选命名与脚本重算；未执行浏览器交互、截图、生产接口测试、云端解析、DSH Desktop 装机、患者/家属访谈或临床审核。AOSD 当前真实访谈 0，页面名及功能优先级都是待验证候选。

## 2. AOSD 自身证据索引

以下相对路径均以 `/Users/qinxiaoqiang/Downloads/aosd-workbench/.worktrees/family/` 为根；引用行号采用 `path:行-行`。

| 证据 | 路径与行号 | 本研究如何使用 / 不能如何推断 |
| --- | --- | --- |
| 分支规则 | `AGENTS.md:22-27`（先读需求/状态、保留修改），`31-33`（患者家属优先与数据合同），`63-77`（模型、MinerU、统一事实），`106-110`（HTML 先行和演进模型） | 决定只读基准、研究先行、不直接建页面或表；不能据此声称页面已确认。 |
| 差异任务起点 | `docs/DIFF-MATRIX.md:1-24` | M0 草案明示 0 访谈、待重名率实测；S1–S6 是设计假设，不能改写成患者引语。 |
| 服务主体与最小闭环 | `docs/BRIEF.md:1-24` | 患者及家属是明确主体；手录/解析→核对→同日回看→导出是候选闭环。未实现、未验证。 |
| 用户研究缺口 | `docs/USER-RESEARCH.md:1-30` | 只有主体已确认，场景优先级、代记权限和页面优先级均未确认；不得伪造一手引语。 |
| 同日与代记任务 | `docs/PATIENT-FLOW.md:1-24` | 导出、代记、报告三条候选任务链；同日多轨是否进一期、家庭查看/编辑边界待 G1。 |
| 来源、隐私与 R2 | `docs/DEV-REQUIREMENTS-2026-10-27.md:19-60,64-83` | R2 非肿瘤长期记录；本人/代记/报告/医生答复不合并；私密三个出口；无肿瘤分期/治疗线；手录可达；当前未建库、未做原型。 |
| 设计者取舍 | `docs/DESIGNER-BRIEF.md:3-18`；`docs/DESIGN-SESSION.md:1-20` | 代记来源边界影响数据/导出/AI，但仍待确认；SPEC 仍为草案。 |
| SPEC 与生产数据状态 | `docs/SPEC.md:1-29,61-77`；`docs/SCHEMA.md:1-14,36-56`；`docs/API-CONTRACT.md:1-12` | SPEC 是未签模板；SCHEMA/API 只有候选骨架，不能当作已经落地的代记字段或路由。本次不修改它们。 |
| 指标边界 | `docs/METRIC-GRADING.md:1-16` | 转录保留原文/单位/机构/参考范围，缺值为 null，改变可比上下文拆组；当前未启用 CTCAE，不算活动度/复发/疗效。 |
| 图表复用边界 | `docs/16-ONE-CHART-SPEC.md:15-38,44-101,118-145` | 复用全期归一化、单点/空窗、同源事实、可回源与可访问性；R3 的治疗条是癌症场景规范，不是 AOSD 必须产生的治疗线。 |
| MinerU 总合同 | `docs/18-MINERU-PARSING.md:26-41,66-89,91-123,137-166` | HTTP v4、pipeline 默认、文件优先于 env、Token 设置接口、原子写和脱敏；按 AOSD 当前文档，不照抄旧仓相反默认。 |
| MinerU 抽取/失败 | `docs/18-MINERU-PARSING.md:270-294,319-346,385-399` | 只抄不判断、LaTeX 外壳、未知单位留空、数量不一致整行放弃；失败无候选、保留原件、逐项核对。 |
| 数据与宿主共享合同 | `docs/04-DATA.md:1-13,29-37,52-74`；`docs/14-HTML-AND-DATA-CONTRACT.md:5-28` | 实体不跟 Tab；事实/来源/主体/权限/读模型分离；页面改动不清库；API 需 revision、确认状态、幂等与错误语义。 |
| AI 与隐私 | `docs/34-AGENT-DRAFT-SEND.md:10-30` | 原生面板、source/origin 校验、用户选择上下文、AI 结果仅候选；private 默认过滤；不能由 AI 冒充患者发言。 |
| 设置全局边界 | `docs/SETTINGS-DESIGN.md:5-33` | 目录、云授权、凭据、参考数据与保存恢复是全局设置，不为凑一级页而改名塞入业务导航。 |

## 3. 基准一级页的源码实证

### 3.1 cervical：实际 12，不是 SPEC 的 11

**权威导航证据：** `/Users/qinxiaoqiang/Downloads/cervical-workbench/prototypes/v0.2/app.js:54-59` 的 `PAGES`；`1251-1261` 用 `PAGES.map` 渲染 `#nav`。`60-72` 另列二级 `SUBPAGES`。

按数组顺序逐字取出：

| # | key | 一级显示名 |
| --- | --- | --- |
| 1 | `dashboard` | 看板 |
| 2 | `records` | 病情整理 |
| 3 | `stage` | 我的分期 |
| 4 | `treatment` | 治疗历程 |
| 5 | `fertility` | 性与生育 |
| 6 | `late` | 放疗与长期影响 |
| 7 | `labs` | 检查与指标 |
| 8 | `timeline` | 病情一图秀 |
| 9 | `nutrition` | 营养支持 |
| 10 | `mind` | 心理支持 |
| 11 | `review` | 复诊准备 |
| 12 | `trials` | 临床研究 |

`app.js:51-53` 的注释说“12 个 = SPEC §4 的 11 个 + 资料库”，但同文件 `55` 的实际 label 为 `病情整理`，`61` 的 `资料库` 是 records 的第一个二级页。重名率采用实际 label `病情整理`，不采用注释或二级标题。SPEC 对照在 `/Users/qinxiaoqiang/Downloads/cervical-workbench/docs/SPEC.md:51-67`，确实只有 11 个，且其 `29-45` 的范围表没有 records 一级行。这是文档/原型差异，不可把 SPEC 数量当作实测数量。

### 3.2 breast：实际 8，二级不并入一级

**权威导航证据：** `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/prototypes/v0.4/app.js:33-37` 的 `PAGES`；`1097-1106` 用 `PAGES.map` 渲染 `#nav`，并以 8 个 view 函数映射渲染。`38-44` 另列二级 `SUBPAGES`。

| # | key | 一级显示名 |
| --- | --- | --- |
| 1 | `dashboard` | 看板 |
| 2 | `records` | 病情整理 |
| 3 | `timeline` | 病情一图秀 |
| 4 | `clinical` | 临床 |
| 5 | `nutrition` | 营养支持 |
| 6 | `mind` | 心理支持 |
| 7 | `care` | 全程与康复 |
| 8 | `review` | 收藏与回顾 |

SPEC `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/docs/SPEC.md:54-86` 同样列 8 个。`就诊准备` 是 `全程与康复` 二级，`治疗历程/试验线索` 是 `临床` 二级，`资料库` 是 `病情整理` 二级；均不另外计数。

### 3.3 两个 SPEC / USER-RESEARCH 的需求边界

- cervical `/Users/qinxiaoqiang/Downloads/cervical-workbench/docs/SPEC.md:9-49` 将分期、治疗路径、放疗长期影响、肿瘤随访和生育作为核心；`82-99` 的验收和风险进一步体现这些癌种语义。它们不能进入 AOSD 候选模型。
- cervical `/Users/qinxiaoqiang/Downloads/cervical-workbench/docs/USER-RESEARCH.md:1-29` 明示无真实访谈、患者研究未系统检索，场景表都是设计假设。
- breast `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/docs/SPEC.md:40-86` 记录 8 个模块已确认；这只确认 breast，不是 AOSD 的签认。`98-124` 的“不判断病情”边界可作为通用产品/工程参考。
- breast `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/docs/USER-RESEARCH.md:26-51` 的 E01 是 23 名乳腺癌家庭照护者研究，N4 由此提出主体/操作者分开；`3,14-24` 明确尚未真实访谈/临床审核（指该项目患者验证）并不以桌面研究替代。不能将 E01 的样本数计入 AOSD 访谈，也不能把 N4 变成 AOSD 已验证需求。

## 4. 共享工程合同：证据与差异

### 4.1 SCHEMA / 数据流

| 结论 | 证据路径与行号 | 对 AOSD 的可复用范围 |
| --- | --- | --- |
| 原件、候选、记录、指标四层分离 | `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/docs/SCHEMA-SPEC.md:41-58,138-195,497-501`；`/Users/qinxiaoqiang/Downloads/cervical-workbench/schema/0001_initial.sql:1-10` | 共享事实链和回源关系，不复制 cancer-specific 表或字典。 |
| 发生与录入时间分离 | breast `docs/SCHEMA-SPEC.md:163-180` | `occurred_on` 与 `recorded_at` 是多轨和后补录所需的通用时间语义。AOSD 的时区/精度待 SCHEMA 设计。 |
| 追加更正，旧快照标过时 | breast `docs/SCHEMA-SPEC.md:163-195,523-529`；`docs/DATA-FLOW-SPEC.md:133-157` | 版本链和 stale 是通用工程合同；不把预约完成当实际治疗。 |
| breast 已有照护者来源 | breast `docs/SCHEMA-SPEC.md:170-179,350-392`；`docs/USER-RESEARCH.md:39-45` | `caregiver_reported`、`speaker_role`、`subject_role` 已经存在，因此 AOSD 不能宣称“首次支持家属”。候选增量是完整代记身份/关系/原话/确认链及同日与三个出口的一致表达。 |
| 私密过滤三出口 | breast `docs/DATA-FLOW-SPEC.md:149-180`；cervical `dsh/readmodels.js:35-36,96-140`；cervical `dsh/routes.js:89-110` | 读模型、导出、AI 上下文默认排除；AOSD 采用显式当次授权而非永久共享假设。 |
| 页面与事实解耦 | AOSD `docs/14-HTML-AND-DATA-CONTRACT.md:14-28`；breast `docs/SCHEMA-SPEC.md:527-529,548-569` | 8 个候选页不是 8 张事实表；改名/拆合不应迁移病历。 |
| 肿瘤内容不得继承 | cervical `docs/SPEC.md:9-49`；cervical `schema/0001_initial.sql:12-32`；breast `docs/DATA-FLOW-SPEC.md:84-129`；breast `dsh/server.js:299-324` | FIGO、放疗路径、肿瘤指标、2cm 提醒和 CTCAE 文件出口均属于各自医学语境，不是共享工程必需品。 |

**现有 SCHEMA 文档也有模板/实现之分：** cervical `docs/SCHEMA.md:1-14` 仍是通用模板，其实际模型在 `schema/0001_initial.sql` 与 `schema/freeze-contract.md:13-57`；AOSD 不能只读模板就称已核对真实 cervical 数据模型。breast 的 `docs/SCHEMA-SPEC.md` 有实际 DDL 和约束，但其癌种字段不可作为 AOSD 需求来源。

### 4.2 API / 宿主合同

| 主题 | 证据路径与行号 | 结论 |
| --- | --- | --- |
| cervical 双链路共用路由 | `/Users/qinxiaoqiang/Downloads/cervical-workbench/dsh/routes.js:1-12,61-77,195-199` | 路由唯一来源、宿主鉴权另在入口执行，避免本地可开而 Desktop 404。 |
| cervical 宿主鉴权 | `/Users/qinxiaoqiang/Downloads/cervical-workbench/dsh/index.js:59-100` | `connection.requestRejection` 不可因本机访问而省略；这是可复用工程边界。 |
| cervical API 实际形态 | cervical `dsh/routes.js:66-100,129-193` | `/api/cervical/*`；含 bootstrap/profile/export/import/candidate/settings。错误多为 `{error,message}`，不能误写成与 breast 相同的嵌套错误。 |
| breast 基址和同源处理器 | `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/dsh/server.js:1-18,190-217` | 宿主基址与独立服务共用 handler；`apiBase` 不重复 `/api`，业务路径以 `/api/*` 判断。 |
| breast 结构化错误与工作区边界 | breast `dsh/server.js:69-125,373-415` | `{error:{code,message,detail}}`、坏 JSON 400、未知路由 404、未选工作区 409；是可复用错误合同，但 AOSD 最终路径待复核。 |
| breast 候选与读写 API | breast `dsh/server.js:444-515,517-639` | 文档、解析、候选决定、事实写入和导出是 API 语义，不按前端 Tab 复制数据。其 `arm/treatments` 等具体乳腺癌接口不移植。 |
| AOSD 尚是候选模板 | `docs/API-CONTRACT.md:1-12`；`docs/DEV-REQUIREMENTS-2026-10-27.md:51-60` | 本次只提出需要的读模型/命令与错误验收，不修改 API 文件，不声称代记路由已经存在。 |

### 4.3 MinerU：相同防线与不同默认值

- 共享：用户显式选择文件与云端知情、HTTP v4、失败保留原件/零候选、候选逐项核对、表格对齐、缺值不猜、凭据脱敏与原子写。breast `/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/docs/MINERU.md:63-90`；AOSD `docs/18-MINERU-PARSING.md:26-41,270-294,319-346`。
- 不同模型默认：breast `docs/MINERU.md:112-131` 是 vlm → pipeline；AOSD `docs/18-MINERU-PARSING.md:9-20,66-70` 是 pipeline → 仅在明确拒参数时 vlm。cervical 实际 `dsh/mineru.js:18-23,222-229` 也显式默认 pipeline。本文不裁定哪个模型识别 AOSD 真实报告更好，因为未做该实测。
- 单位缺口：cervical `/Users/qinxiaoqiang/Downloads/cervical-workbench/dsh/import.js:132-143` 在 `unitCell` 为空时回退 `hit.unit`。AOSD 要求未知留空，不能复用这一行。`unitCell` 非空但无法识别时 cervical 会跳过，二者行为不可混写为“缺单位一律留空”。
- cervical 的 `LAB_DICT` 位于 `dsh/import.js:22-42`，包含 SCC-Ag、CEA、CA125 等肿瘤相关条目；不得作为 AOSD 指标目录。可复用的是表格/实体验解码、位置对齐与候选确认思路，不是词典或肿瘤语义。

## 5. 候选集合与差异验收索引

本次固定候选为 8 个，名称及 key 如下。key 只是研究建议，不是已冻结 API 或路由。

| # | key | 显示名 | 对应差异功能 / 主文档验收 |
| --- | --- | --- | --- |
| 1 | `dashboard` | 看板 | F01：低负担手录、同源最近记录，无自动判断 |
| 2 | `voices` | 本人与代记 | F02：记录者、关系、原话、补充/确认与权限边界 |
| 3 | `day-view` | 同日经过 | F03：同日多轨、发生/录入分开、并列不推因果 |
| 4 | `documents` | 报告与核对 | F04：原件/候选/缺项/失败、未知不猜、逐项确认 |
| 5 | `metrics` | 指标回看 | F05：可比组、单点/空窗、回源、无活动度或默认分级 |
| 6 | `medication-notes` | 用药与医嘱 | F06：用药变更和医嘱原文版本化，不生成治疗线/调药 |
| 7 | `visit-prep` | 复诊准备 | F07：选入、导出、回看、快照过时与私密过滤 |
| 8 | `disease-resources` | 疾病与资源 | F08：概要/指南/登记/叙述分层，无入组或处置判断 |

全局设置、疾病概要顶栏入口、右侧原生 Agent 不属于 8 个业务一级页。共享工程验收 F09 覆盖宿主鉴权、双形态 API、统一事实源、revision/幂等、AI 来源校验和私密三出口。详细步骤和判据见 `docs/FAMILY-COMPARISON.md` §5；这些均是拟议验收，尚未执行。

差异不是“基准没有家属字段”：如 §4 所示 breast 已有若干角色字段。真正待验证的是**患者与家属共同使用时，能否在不混写主体、不泄露私密内容、不覆盖原话的前提下完成同日记录与复诊材料**。同日多轨的价值同样需要 AOSD 患者/家属验证，而非由与癌症不同直接推出。

## 6. 重名率：算法、输入与实测输出

### 6.1 定义

- 候选集 `A`：§5 的 8 个显示名，`|A|=8`。
- 基准集 `B`：§3 从实际 `PAGES` 数组提取的所有一级 label；cervical `|B|=12`，breast `|B|=8`。
- 比较 `B.includes(a)`：精确、大小写敏感、Unicode 码点逐字相同。不做 trim、大小写、繁简、标点、同义词或语义归一；不把 key、二级标题、注释标题当显示名。
- 主指标：`R = |{a∈A : a∈B}| / |A| × 100%`。**分母固定为候选数 8**，分别对两个基准独立计算，不合并分母。
- 补充指标：`C = |A∩B| / |B| × 100%`，回答基准侧被逐字复用的比例，不用于本次 ≤70% 的通过判定。
- 页面改名后必须重新跑，不得沿用本结果。名称差异不构成医学或患者价值证据。

### 6.2 可复算脚本

以下是研究时实际运行的只读 Node 脚本语义（整理排版便于复算；不创建脚本文件）。运行环境为 Node `--input-type=module`；只读取两个 `app.js`。

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs'
const specs = [
  ['cervical', '/Users/qinxiaoqiang/Downloads/cervical-workbench/prototypes/v0.2/app.js'],
  ['breast', '/Users/qinxiaoqiang/Downloads/breast-cancer-workbench/prototypes/v0.4/app.js'],
]
const candidates = ['看板', '本人与代记', '同日经过', '报告与核对', '指标回看', '用药与医嘱', '复诊准备', '疾病与资源']
function readPages(file) {
  const source = fs.readFileSync(file, 'utf8')
  const block = source.match(/const PAGES = \[([\s\S]*?)\n\];/)?.[1]
  if (!block) throw new Error(`PAGES not found: ${file}`)
  return [...block.matchAll(/\['([^']+)', '([^']+)', '([^']+)'\]/g)]
    .map(m => ({ id: m[1], label: m[2] }))
}
for (const [name, file] of specs) {
  const pages = readPages(file)
  const labels = pages.map(p => p.label)
  const exact = candidates.filter(label => labels.includes(label))
  console.log(JSON.stringify({
    name,
    count: pages.length,
    pages,
    exact,
    candidateDenominator: `${exact.length}/${candidates.length}`,
    candidateRate: `${(exact.length / candidates.length * 100).toFixed(2)}%`,
    baselineDenominator: `${exact.length}/${labels.length}`,
    baselineCoverage: `${(exact.length / labels.length * 100).toFixed(2)}%`,
    pass: exact.length / candidates.length * 100 <= 70,
  }, null, 2))
}
NODE
```

正则限定本次已人工核对的简单三元数组格式；若将来 `PAGES` 改为其他写法，应先人工核对导航定义和渲染路径，不能用“匹配不到=0 个一级页”的静默空集结果。脚本主动在 `PAGES` 未找到时抛错。

### 6.3 研究时真实输出摘要

```text
候选 (8): 看板 | 本人与代记 | 同日经过 | 报告与核对 | 指标回看 | 用药与医嘱 | 复诊准备 | 疾病与资源
cervical: count=12; exact=[看板, 复诊准备]; candidateDenominator=2/8;
          candidateRate=25.00%; baselineDenominator=2/12;
          baselineCoverage=16.67%; pass=true
breast:   count=8;  exact=[看板];          candidateDenominator=1/8;
          candidateRate=12.50%; baselineDenominator=1/8;
          baselineCoverage=12.50%; pass=true
```

| 候选名 | cervical 一级逐字同名 | breast 一级逐字同名 |
| --- | --- | --- |
| 看板 | 是 | 是 |
| 本人与代记 | 否 | 否 |
| 同日经过 | 否 | 否 |
| 报告与核对 | 否 | 否 |
| 指标回看 | 否 | 否 |
| 用药与医嘱 | 否 | 否 |
| 复诊准备 | 是 | 否 |
| 疾病与资源 | 否 | 否 |

主判定：cervical **2/8=25.00% ≤70%**；breast **1/8=12.50% ≤70%**。补充基准侧：cervical **2/12=16.67%**；breast **1/8=12.50%**。若有人提出“分母应是基准数”，那是补充口径 C，不是隐藏替换主指标；两个口径都已公开。

## 7. 后续证据缺口与不得越界项

1. G1 前需以经同意的 AOSD 患者/家属研究核对页面语言、任务优先级、低负担字段、代记权限和共享设备边界；0 访谈时不能标患者价值验证通过。
2. 医学字段、报告指标和参考范围须另行取得适用原件并核对；不得从 cervical/breast 复制肿瘤分期、治疗线/周期、CTCAE、肿瘤终点、乳腺阈值、复发或疗效归因。
3. 本研究没有启用或验证 CTCAE、活动度、任何 AOSD 阈值或随访节奏；公共资源/登记不代表个人诊断、治疗选择或入组资格。
4. 候选通过后，先形成可交互 HTML 并实际预览、签认版本/hash/范围，再复核 SCHEMA/API；页面拆合不得决定事实表。需要覆盖同日跨来源、代记补充、拒收、修订、快照失效、私密三出口、缺字段及错误态。
5. 本次不做 Git commit、不改 SPEC、不改 cervical/breast，不将源码检查表述为真实业务、浏览器或 Desktop 验收。
