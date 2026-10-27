# AOSD 医学证据台账（M1）

**研究与访问日期：2026-10-27；检索截止亦为 2026-10-27。** 除 M19 指向既有同日证据稿外，各证据条目在条目内重复标明实际访问日与读取程度；网络内容均是该日快照，文献保留各自发表/检索时限。配套主文档：[docs/RESEARCH-MEDICAL.md](../../docs/RESEARCH-MEDICAL.md)。本文为公共证据记录，不是个体医疗建议，不是已确认 SPEC，也不是患者访谈。本文“可支持”仅指支持记录/公共背景的研究讨论，不证明功能有效或临床正确。

## 0. 口径、原件程度与限制

- **G（guideline/recommendation）**：官方指南或正式推荐；**C（consensus）**：专家共识；**P（patient evidence）**：患者报告/疾病负担研究；**R（registry）**：登记快照；**E（education）**：患者教育网页。类型不直接等于证据强度，具体局限逐条列出。
- 国内指南使用本地完整 PDF 与既有五页抽取文本；**没有上传 PDF，没有云端 MinerU，没有读取或处理真实病历**。
- 国际推荐与荷兰共识通过 Europe PMC 的 **fullTextXML** 阅读正文，不以搜索摘要冒充全文。PubMed 部分页面受 Cookie 提示时，改由 Europe PMC API 核对完整摘要/元数据。
- 剂量、诊断/分类标准、治疗目标和 MAS 细节在原文中用于临床语境。本研究只概括其存在、适用范围与局限，不将它们转成自测、评分、风险计算、复查提醒或治疗建议。
- E01–E14 的患者/家属公开证据已在 `research/aosd/user-evidence.md` 建账。本文件只复用与十主题有关的少数来源，并保留其“真实访谈 0”的限制；不把公开患者叙述当本项目的患者原话。
- 本轮是针对性证据补跑，不是覆盖所有数据库/所有语言的系统综述。未获取全文或未核到官方原件时，明确写摘要级、索引级或未核实。

## 1. 来源—主题索引

| ID | 类型 / 原件程度 | 支持的主题 | 主要局限 |
| --- | --- | --- | --- |
| M01 | G；完整官方 PDF + 本地五页文本 | T01–T04、T07–T08、治疗全景 | 2025 公共版本；非个体医嘱；流程图未结构化识别 |
| M02 | G；EULAR/PReS 全文 XML | T01–T04、T06–T09 | sJIA/AOSD 合并；非中国文件；若干 LoE 5；补充 SLR 未逐项复核 |
| M03 | C；荷兰共识全文 XML | T01–T03、T07–T08 | 检索截至 2020-01-31；专家意见/儿童外推；资助披露 |
| M04–M05 | P；同一 PRO-AOSD 队列全文 | T04、T06、T10 背景 | 德国横断面；样本/缺失限制；药企资助；非中国比例 |
| M06 | P；摘要 | T06 | 横断面关联不等于因果/个人诊断；未读全文 |
| M08 | E；搜索摘要级 | T05 | 非 AOSD 营养指南；本次正文 403；不形成剂量建议 |
| M09 | P；系统综述摘要 | T10 | 检索截至 2022-08；全文未取得；不能推中国费用 |
| M10–M18 | R；官方 API 单记录 | T09 | 登记状态不是疗效、批准、可及或入组资格 |
| M19 | 既有公开患者证据索引 | T04、T06、T10 | 间接患者任务线索；不是本项目访谈或临床审核 |

## M01 — 国家卫健委 2025 年罕见病诊疗指南

- **机构/题名：** 国家卫生健康委办公厅，《软骨发育不全等86个罕见病病种诊疗指南（2025年版）》，国卫办医政函〔2025〕252号。
- **日期：** 通知落款 2025-06-17；网页发布 2025-07-10；本次访问/本地复算 2026-10-27。
- **真实 URL：** [官方 PDF](https://www.gov.cn/zhengce/zhengceku/202507/P020250710595668350272.pdf)；[NHC 通知](https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml)。
- **原件程度：** 本地 `assets/guidebooks/nhc-86-rare-diseases-2025.pdf` 是完整官方 PDF，`research/aosd/nhc-aosd-2025-pages17-21.txt` 是 AOSD 正文抽取。**517 页；AOSD printed 17–21 / PDF 21–25；SHA-256 `d03fe69585320fea7938bf85bea9ec346a3d5d7671c7d8627fff8393679bbfef`。** 2026-10-27 重算一致；pypdf 实测 `len(pages)=517`，PDF 21 有“成人斯蒂尔病”，PDF 25 有“诊疗流程”。`assets/guidebooks/manifest.json` 同日记载相同事实。
- **T01 定义/诊断：** 正文17、18–19（PDF21、22–23）：罕见、病因不明的自身炎症性疾病；无单一诊断特异检查，需排除感染、肿瘤、其他风湿病；列出血液/尿液/肝肾功能/炎症/铁蛋白及感染、免疫、肿瘤排查。Yamaguchi 属于文献中的分类/诊断工具，产品不可据此自测或自动排除。
- **T02 病程：** 正文18（PDF22）：传统单发、多发、慢性型及较新系统型/关节炎型表型。这些是群体/临床描述，不支持根据一次用户输入自动定型。
- **T03 治疗：** 正文20–21（PDF24–25）：NSAIDs、激素、传统 DMARDs、IL-1/IL-6/TNF/JAK 抑制剂与严重并发症情境的治疗。原文同时说明证据和监测差异；例如 JAK 抑制剂主要为小样本/病例报道，不能写成普遍适用或推荐。
- **T04 症状/功能：** 正文17–18（PDF21–22）：发热、关节、皮疹、肌痛、咽痛、肝脾淋巴结及多器官表现；可支持原始症状字典的公共背景，不支持由症状推断诊断/活动。
- **T05 营养：** AOSD 五页没有给出专属膳食方案；不得据“未写”宣称没有营养问题或所有患者无需营养支持。
- **T07 复查：** 正文18–20（PDF22–24）列举血、尿、便常规、肝肾功能、血脂、ESR/CRP、凝血、铁蛋白等及鉴别检查；原文没有给产品一个通用随访频率。保存报告原文和上下文，不启用阈值判断。
- **T08 安全：** 正文18、20–21（PDF22、24–25）：MAS 与其他严重并发症、器官受累、感染/结核、注射反应、肝酶/血脂/血细胞与激素不良反应等。MAS 必须由医生结合动态综合表现判断，产品不做 MAS 评分或预警分级。
- **T09/T10：** AOSD 五页列参考文献但不提供当前试验登记状态或中国费用/医保数据。
- **局限：** 2025 版不保证覆盖其后证据与监管变化；pypdf 文字抽取可能损失表格/图布局，未对流程图做结构化识别；本次没有把指南全文或 PDF 上传云端。公共“指南提及”不是中国适应症或个体用药证明。

## M02 — EULAR/PReS Still’s disease 正式推荐

- **作者/题名：** Bruno Fautrel、Stéphane Mitrovic、Arianna De Matteis、Fabrizio De Benedetti 等，*EULAR/PReS recommendations for the diagnosis and management of Still’s disease, comprising systemic juvenile idiopathic arthritis and adult-onset Still’s disease*。
- **版本/发表：** 在线 **2024-09-24**；*Annals of the Rheumatic Diseases* **2024;83(12):e225851**。这是本次核到的版本，不写作“2026 最新版”。
- **真实 URL：** [DOI](https://doi.org/10.1136/ard-2024-225851)；[PMC11672000 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11672000/)；[本次实际读取的 Europe PMC fullTextXML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11672000/fullTextXML)；[PubMed PMID 39317417](https://pubmed.ncbi.nlm.nih.gov/39317417/)。
- **访问日/原件程度：** 2026-10-27；获得全文 XML，实际读 Methods、Results（OP A–D、RS1–14）、表1–4、算法与质量指标。不是只读摘要。
- **方法：** QoC011 task force，EULAR/PReS 于 2022 年正式批准，2022-09 启动；按 EULAR SOP/AGREE II。三项系统综述查 Medline、Embase、Cochrane，检索至 2022-10（生物标志物至 2023-02）；专家含成人/儿科风湿病及两名患者研究伙伴；共识门槛 80%；4 项总原则、14 项建议。
- **T01：** OP A 将 sJIA/AOSD 放在同一 Still’s disease 谱系；RS1–3 强调非特异表现、鉴别诊断和关节炎可晚出现；RS2 明确 IL-18/S100 的检测/阈值尚需验证。诊断/分类工具不可转为自测。
- **T02/T07：** RS4–5 有 CID、remission 与初始治疗的管理目标，但 RS5 明确指出统一活动量表证据不足；IL-6 抑制剂可影响 CRP 表现。不能将这些目标变为产品的疗效倒计时、活动评分或患者自测。
- **T03：** RS6–8 与算法涉及 IL-1/IL-6、减少长期激素、传统 DMARD 证据有限及减量需临床管理；原文说早期用药时机缺正式 RCT、减量研究很少。产品只记录患者实际治疗，不提供选药/调药建议。
- **T04/T06：** OP B 是患者/照护者与治疗团队共享决策；T2T 包括患者/家长与医生评价。支持主体区分和共同准备就诊材料，不支持自动评估依从性/心理或代替团队。
- **T05：** 正文没有 AOSD 专属营养方案或营养剂量；不作饮食治疗推论。
- **T07/T08：** RS9–14 指出 MAS/肺病可在任一阶段出现，需综合动态评估、联系医疗团队、严重病例与专家中心合作；列感染、炎症指标、肝病、肺病和治疗安全监测。任何单项异常都不特异，不能做成 MAS 风险计算或红黄绿判断。表4为汇总不良事件率，不能套用到个人，本文不复制成患者预期。
- **T09：** RS14/算法提及创新疗法的临床研究/专家中心，不等于个体试验资格；其研究议程明确统一活动指标、个体治疗、MAS/肺病最佳策略仍待研究。
- **局限：** 合并儿童与成人证据，不能直接套中国批准/医保；多项陈述 LoE 5、Strength D，治疗目标不能当生理定律；本次未逐份读取三篇独立 SLR、PROSPERO 记录和所有在线补充表；出版后是否更新未核，访问日不是内容更新日。

## M03 — 荷兰 AOSD 专家共识（补充，不称正式国际指南）

- **作者/题名：** Helen L. Leavis、Paul L. A. van Daele、Catharina Mulders-Manders 等，*Management of adult-onset Still’s disease: evidence- and consensus-based recommendations by experts*。
- **版本/发表：** 在线 2023-09-05；*Rheumatology (Oxford)* **2024;63(6):1656–1663**。
- **真实 URL：** [DOI 10.1093/rheumatology/kead461](https://doi.org/10.1093/rheumatology/kead461)；[PMC11147545 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC11147545/)；[Europe PMC fullTextXML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11147545/fullTextXML)；[PubMed PMID 37669122](https://pubmed.ncbi.nlm.nih.gov/37669122/)。
- **访问日/原件程度：** 2026-10-27；获得并阅读正文 XML、表1–4、方法、讨论和资助披露，非摘要级。
- **方法：** 17 名专家，modified Delphi 三轮，33 条中 29 条达成共识；阈值 80%；系统检索截至 **2020-01-31**。
- **T01/T02/T03：** 主要是排除诊断与感染/炎症/肿瘤鉴别；系统型与关节炎主导表型影响临床讨论。表1将 IL-1/IL-6、MTX、TNF 的证据等级分开，正文说明 IL-1 早期证据含 sJIA 外推、MTX 对系统表现证据少、TNF 没有 RCT。
- **T07/T08：** 讨论诊断评估、铁蛋白/CRP/ESR、MAS/HLH 和激素不良反应；原文的“response/remission”定义是共识/研究语境，不做产品自动标签。
- **T04/T05/T06/T10：** 没有建立患者功能记录模板、专属营养方案、家庭权限或中国费用结论。
- **局限：** 作者自己指出许多建议证据等级低、罕见病临床试验稀缺；荷兰专家构成与医疗环境限制外推；第三轮线上会议不保持匿名；部分 sJIA 结果外推成人；Novartis（SP 006.19）与 Sobi（HCC-4445）资助并披露作者关系。不能用作 NMPA 批准或药物比较宣传。

## M04 — PRO-AOSD：患者与医生感受差异

- **题名：** Norbert Blank、Ioana Andreica、Jürgen Rech、Zekayi Sözen、Eugen Feist，*Evaluating the Divide Between Patients’ and Physicians’ Perceptions of Adult-Onset Still’s Disease Cases: Insights from the PRO-AOSD Survey*，*Journal of Clinical Medicine* 14(19):7034。
- **日期：** 在线 2025-10-04；调查 2021-03-08 至 2022-11-14。
- **真实 URL：** [PMC12525019 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC12525019/)；[DOI 10.3390/jcm14197034](https://doi.org/10.3390/jcm14197034)；[全文 XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12525019/fullTextXML)。
- **访问日/程度：** 2026-10-27；本次沿用同日既有 `user-evidence.md` E01 的 XML 全文读取记录，当前研究核对 PMC/DOI 条目；非本项目访谈。
- **方法/发现：** 德国 19 中心、124 名确诊成人 AOSD 患者的横断面患者报告，医生/患者问卷互盲；121/124 报告既往或当前药物。支持区分本人感受与医生评估、保留持续症状与治疗沟通线索。
- **T04/T06 产品含义与边界：** 可以分别保存本人/代记/医生原文，不可以根据差异判谁“更正确”、计算活动或预测复发。
- **局限：** 地域/族裔有限，部分问题不同，缺失数据，活动/非活动亚组小，无统一 AOSD 活动评估工具；未评估记录工具效果；Novartis 资助并披露药企关系。患者不是本项目受访者。

## M05 — PRO-AOSD：HRQoL、疲乏与工作

- **题名：** 同一团队的 *Assessment of Health-Related Quality of Life in Patients with Active Versus Inactive Adult-Onset Still’s Disease: Data from the PRO-AOSD Survey During the COVID-19 Pandemic*，*J Clin Med* 14(21):7848。
- **日期：** 2025-11-05；与 M04 同一调查时段与队列，**不能算第二个独立样本**。
- **真实 URL：** [PMC12610029 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC12610029/)；[DOI 10.3390/jcm14217848](https://doi.org/10.3390/jcm14217848)；[全文 XML](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12610029/fullTextXML)。
- **访问日/程度：** 2026-10-27；沿用同日 `user-evidence.md` E02 的 XML 全文读取记录，非只读检索摘要。
- **T04/T06/T10：** 124 人中 37 人报告过去一个月大多时候疲惫、10 人报告总是疲惫；75 人有带薪工作，52 人报告因 AOSD 限制或放弃职业计划。支持把疲乏、工作/学习、心理社会功能作为可选记录话题。
- **边界：** 不外推中国比例，不把未就业全归因于 AOSD，不把疲乏或 SF-36 结果变成个人疾病活动判断；不证明低负担数字表单有效。
- **局限：** 仅 58 人有活动/非活动可用数据（18/40），可能选择偏倚；疫情时期；无经验证的 AOSD 专用 PRO；职业类型/收入/灵活性未评估；患者公众未参与研究设计；Novartis 资助及医学写作支持披露。

## M06 — 焦虑、抑郁与 HRQoL 横断面研究

- **作者/题名：** Huihui Chi、Haiyan Jin、Zhihong Wang 等，*Anxiety and depression in adult-onset Still’s disease patients and associations with health-related quality of life*，*Clinical Rheumatology* 39:3723–3732。
- **日期：** 在线 2020-05-23。
- **真实 URL：** [PubMed 32447600](https://pubmed.ncbi.nlm.nih.gov/32447600/)；[DOI 10.1007/s10067-020-05094-4](https://doi.org/10.1007/s10067-020-05094-4)；[Europe PMC 摘要/元数据 API](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:32447600&format=json&resultType=core)。
- **访问日/程度：** 2026-10-27；本次读取 Europe PMC 完整摘要与元数据，**未获得出版商全文**。
- **方法/结果：** 82 名 AOSD 患者（44 活动、38 缓解）与 82 名年龄/性别匹配健康对照；HADS、SF-36。摘要报告患者焦虑/抑郁及其与 HRQoL 的关联。
- **T06 边界：** 支持允许患者自愿记录心理社会话题并寻找专业帮助；不支持个人心理诊断、因果归因、风险计算或根据激素剂量推断情绪。
- **局限：** 摘要级，未核完整抽样、模型和限制；作者单位在中国不等于已核实每名参与者国籍/地点；横断面无因果或产品需求效果证据。

## M07 — 药物临床证据：正式推荐与共识已经足够说明的边界

本条目不是新增独立文献，而是对 M01–M03 的交叉核对：国内指南列出多种治疗；EULAR/PReS 的系统综述支撑部分 IL-1/IL-6 推荐；荷兰共识详列研究设计与数量，包括托珠单抗日本 27 人随机双盲安慰剂对照研究、MTX 小型研究及 TNF 无 RCT。IL-1 早期证据部分由 sJIA 外推；JAK/其他救援治疗多为病例或小样本。

**结论：** 可给公共“治疗全景”标注不同证据性质，不做药物优劣排名、不复制剂量到个人页面、不把指南药物自动连到 NMPA AOSD 适应症。所有药品中国状态看独立 NMPA 日志。

## M08 — 营养：没有取得 AOSD 专属营养指南

- **直接证据缺口：** M01 的 AOSD 五页、M02 的完整推荐和 M03 的完整共识没有提供 AOSD 专属膳食方案。
- **检索：** 2026-10-27 WebSearch 查询 `"adult-onset Still" nutrition diet guideline`。返回 Mayo 患者教育、荷兰共识和通用关节炎营养材料；没有返回可核的 AOSD 专属营养指南。**这是本轮未找到，不是证明不存在。**
- **间接 URL：** [Mayo Clinic — Adult Still’s disease: Diagnosis and treatment](https://www.mayoclinic.org/diseases-conditions/adult-stills-disease/diagnosis-treatment/drc-20351912)，页面日期本次未核实；搜索摘要称使用泼尼松等激素者可与医疗团队讨论钙/维生素 D 以帮助预防骨质疏松。
- **访问日/程度：** 2026-10-27；WebFetch 正文返回 403，**只取得搜索摘要，未读全文**；不能声称已审阅页面全部营养/复查内容，也不把它升级为指南或具体补充剂剂量。
- **产品边界：** 只保存患者实际饮食/补充剂、相关问题和医生/营养师书面答复；不生成饮食处方、营养目标、剂量或发作归因。
- **局限：** 未系统检索全部营养数据库/语言；激素骨质健康需要个体临床评估。通用健康饮食资料不等于 AOSD 专属证据。

## M09 — AOSD 疾病负担、费用与资源使用系统综述

- **作者/题名：** Piero Ruscitti、Eugen Feist、V. Canon-Garcia 等，*Burden of adult-onset Still’s disease: A systematic review of health-related quality of life, utilities, costs and resource use*，*Seminars in Arthritis and Rheumatism* 63:152264。
- **日期：** 在线 2023-09-26；系统检索在 **2022-08** 进行。
- **真实 URL：** [PubMed 37802002](https://pubmed.ncbi.nlm.nih.gov/37802002/)；[DOI 10.1016/j.semarthrit.2023.152264](https://doi.org/10.1016/j.semarthrit.2023.152264)；[Europe PMC 摘要 API](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:37802002&format=json&resultType=core)。
- **访问日/程度：** 2026-10-27；本次读取 Europe PMC 完整摘要；PubMed WebFetch 只返回 Cookie 提示。既有 `user-evidence.md` E03 记录全文 PDF 尝试返回 403，故本研究**仅摘要级**。
- **方法/结果：** 12 个数据库、4 个会议和 3 个技术评估/监管网站；纳入 16 项，8 项 HRQoL，2 项直接成本，7 项医疗资源使用；未识别间接成本研究。不同结局限制比较；作者指出 HRQoL 和成本负担研究不足。
- **T10 边界：** 可以保存患者实际费用、医疗利用和报销答复；“没有识别到研究”不是“没有间接成本/负担”；不推中国费用、住院天数预期、报销比例或未来成本。
- **局限：** 未读全文纳入研究质量、国家分布、货币与成本年份；检索只到 2022-08；无法外推中国当前医保/药价/供应。

## M10 — ClinicalTrials.gov 查询快照与纳入口径

- **查询日：** 2026-10-27。
- **真实 URL：** [条件查询 API v2（`query.cond=adult-onset Still's disease`、`pageSize=100`、`countTotal=true`）](https://clinicaltrials.gov/api/v2/studies?query.cond=adult-onset%20Still%27s%20disease&pageSize=100&format=json&countTotal=true)；[网页条件检索](https://clinicaltrials.gov/search?cond=adult-onset%20Still%27s%20disease)。
- **读取程度/结果：** 官方 JSON 返回 26 条；末次复核加入 `countTotal=true`，同日 `totalCount=26`、实际返回 26。逐条以 `/api/v2/studies/{NCT}` 核 M11–M18 的 8 条代表记录，加本条构成 9 个来源条目（M04/M05 同队列不重复计患者）。这是该查询当日快照，不是去重后的全球干预试验数。
- **纳入：** 用于说明不同状态/类型/地点的代表性记录，不声称覆盖全球全部研究，不提供“可参加”清单。
- **局限：** `query.cond` 有词项映射，包含混合 sJIA/AOSD、MAS、多病种登记与观察研究；未按 9 个月窗口筛、未纳排/去重/建 SQLite；只读 ClinicalTrials.gov，未核 ChiCTR/中国药物临床试验登记平台；状态和地点仍需登记方实时确认。

## M11 — NCT07203001（MAS825）

- **URL/访问：** [NCT07203001](https://clinicaltrials.gov/study/NCT07203001)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT07203001)；2026-10-27 读单记录 JSON。
- **快照：** II 期、干预性、Still’s disease（儿童与成人），MAS825；`RECRUITING`；开始 2025-11-03（实际）；登记最近更新发布 2026-09-25；估计 30 人；国家列表 Canada、France、Germany、Italy、Netherlands、Spain、Türkiye、United States；`hasResults=false`。
- **边界/局限：** 登记招募不等于中国可及、剩余名额、适合个人或疗效已证；没有中国地点，不据此推中国研究状态。

## M12 — NCT05927454（Acostill / RaDiCo）

- **URL/访问：** [NCT05927454](https://clinicaltrials.gov/study/NCT05927454)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT05927454)；2026-10-27。
- **快照：** 法国观察性队列；`RECRUITING`；开始 2017-07-11（实际）；最近更新发布 2026-02-12；估计 500 人；无分期；`hasResults=false`。
- **边界/局限：** 不是药物疗效试验，不是中国患者队列；估计样本不是实际入组数。

## M13 — NCT06497491（GNR-086 / Ilaris）

- **URL/访问：** [NCT06497491](https://clinicaltrials.gov/study/NCT06497491)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT06497491)；2026-10-27。
- **快照：** III 期干预性，成人 AOSD，GNR-086（canakinumab biosimilar）与 Ilaris；`COMPLETED`；开始 2023-12-12；最近更新发布 2025-08-17；实际 118 人；Russia；`hasResults=false`。
- **边界/局限：** “完成”不等于成功、有效、获批或可申请；无登记结果链接不等于没有别处发表，本文未做结果文献核验。

## M14 — NCT05814159（日本 anakinra）

- **URL/访问：** [NCT05814159](https://clinicaltrials.gov/study/NCT05814159)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT05814159)；2026-10-27。
- **快照：** III 期干预性，日本 sJIA/AOSD；`ACTIVE_NOT_RECRUITING`；开始 2022-08-24；最近更新发布 2025-03-05；实际 15 人；`hasResults=false`。
- **边界/局限：** “活跃但不招募”不可显示成开放招募；混合年龄/疾病谱，结果不可提前推断。

## M15 — NCT03265132（anakinra，终止）

- **URL/访问：** [NCT03265132](https://clinicaltrials.gov/study/NCT03265132)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT03265132)；2026-10-27。
- **快照：** III 期干预性，sJIA/AOSD，anakinra/安慰剂；`TERMINATED`；开始 2017-09-26；最近更新发布 2021-06-30；实际 13 人；Canada、United States；`hasResults=true`。登记 `whyStopped`：在合理时间内无法达到 81 人的招募目标。
- **边界/局限：** 终止原因与入组可行性有关，不能改写为疗效失败或安全性失败；保留终止状态，不把有结果等同推荐或获批。

## M16 — NCT02204293（canakinumab，终止）

- **URL/访问：** [NCT02204293](https://clinicaltrials.gov/study/NCT02204293)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT02204293)；2026-10-27。
- **快照：** II 期干预性成人 AOSD，canakinumab/安慰剂；`TERMINATED`；开始 2012-06-21；最近更新发布 2020-08-07；实际 36 人；Germany；`hasResults=true`。`whyStopped`：研究药物获得上市许可造成招募问题。
- **边界/局限：** 这是登记方历史原因，不是中国的批准事实，也不能推出疗效优劣；需阅读结果全文才可讨论具体结果，本研究未做。

## M17 — NCT07706868（中国人群 anakinra，撤回）

- **URL/访问：** [NCT07706868](https://clinicaltrials.gov/study/NCT07706868)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT07706868)；2026-10-27。
- **快照：** IV 期干预性，题名指向中国 sJIA/AOSD 人群；`WITHDRAWN`；预计开始 2025-09-01；最近更新发布 2026-07-16；实际入组 0；`whyStopped=Business decision`；`hasResults=false`。
- **边界/局限：** 撤回且 0 人，不得写成“中国正在招募”或已有 IV 期疗效证据；Business decision 不可推测为科学/安全原因。

## M18 — 中国登记与 MAS 研究补充

### M18a — NCT03651193

- **URL/访问：** [NCT03651193](https://clinicaltrials.gov/study/NCT03651193)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT03651193)；2026-10-27。
- **快照：** 中国人群多中心登记观察研究；`UNKNOWN`；开始 2018-11-28；最近更新发布 2021-02-02；估计 150 人；China；无干预分期；`hasResults=false`。
- **边界/局限：** UNKNOWN 是登记状态未知，不能写“已结束”“正在招募”或“研究不存在”；估计样本非实际。

### M18b — NCT03311854（emapalumab / MAS）

- **URL/访问：** [NCT03311854](https://clinicaltrials.gov/study/NCT03311854)；[API 记录](https://clinicaltrials.gov/api/v2/studies/NCT03311854)；2026-10-27。
- **快照：** II 期开放干预研究，sJIA/AOSD 发生 MAS/继发性 HLH；`COMPLETED`；开始 2018-02-20；最近更新发布 2022-05-17；实际 14 人；France、Italy、Spain、United Kingdom、United States；`hasResults=true`。
- **边界/局限：** 小样本单臂研究，不能将“完成”写成标准治疗或中国 AOSD/MAS 获批；结果解读须看正式论文/说明书，本次未评价疗效终点。

## M19 — 患者/家庭公开资料的复用边界

- **URL/原件：** 本项目同日 [user-evidence.md](./user-evidence.md) 的 E01–E14；访问日均为 2026-10-27。E05–E07 为 AiArthritis 公开叙述/共创手册/资源中心，E08 为 Arthritis UK 患者信息，E12–E13 为 Arthritis Society Canada 通用照护/就诊工具。
- **用于：** 支持将低精力、心理、家庭、费用、就诊问题列为待访谈主题；不用于证明具体界面、记录频率、共享账号或费用优先级。
- **家庭/心理：** 通用照护指南说本人可决定是否让照护者参与和共享范围，但这不是 AOSD 专项证据；工作台只能提出授权和代记的候选设计。
- **资源：** 患者组织网页可列“资源线索”，但服务开放、中文、隐私、费用、质量与可及性未独立核验；不能标成推荐或合作。
- **局限：** 公开个人叙述有选择偏差；儿童/成人、不同国家与疾病混合；本项目真实访谈仍 0。任何患者句必须是“待访谈假设”，不加引号，不伪装成患者原话。

## 2. 证据空白总表

| 空白 | 已做检索 | 仍未核/不能推断 |
| --- | --- | --- |
| 中国患者/家属需求 | 同日公开患者资料已建账 | 0 访谈；不能确认字段、优先级、共享权限或功能价值 |
| AOSD 专属营养 | 三份临床正文 + `nutrition diet guideline` WebSearch | 本轮未找到专属指南；不能推“无需营养”或给补充剂/食谱 |
| 复查节奏/指标可比 | 国内与 EULAR/PReS 正文 | 未做临床审核、方法学/单位目录；不设默认排程或阈值 |
| 药物中国 AOSD 适应症 | NMPA 域名多次检索、官方审评 PDF | 现行官方说明书未齐；查不到不是未获批，新闻不是官方证明 |
| 临床研究中国可及 | ClinicalTrials.gov API + 代表单记录 | 未查中国注册库/中心实时状态；不能判入组或疗效 |
| 费用/医保/援助 | 系统综述摘要 + NMPA 官方资料边界 | 无中国当前价格、医保、库存、间接成本与资格核验 |
| 心理与家庭授权 | 横断面摘要、共享决策推荐、通用照护资料 | 不做诊断/风险/危机预测；本地专业资源和家庭场景待核 |

## 3. 审计清单

- [x] 官方指南 517 页、printed17–21/PDF21–25、hash 已本地复算且原值未改。
- [x] EULAR/PReS 有真实 DOI、PMC 全文、版本日期、访问日与全文程度；荷兰共识另标 C。
- [x] 十主题均有来源、产品边界、未核项；空主题没有用药企新闻/宣传补位。
- [x] 所有在线事实标 2026-10-27 访问/检索快照，历史文献保留其发表/检索时限。
- [x] 不把 Yamaguchi、MAS、阈值或药物做成功能自测、风险计算或治疗建议。
- [x] 不把指南药物、试验登记、国外批准或 NMPA 送达记录自动转成中国 AOSD 适应症。
- [x] 本地 PDF 未入云；无患者资料处理；患者句只保留“待访谈假设”。
- [x] 未改 SPEC、manifest 或其他业务文件；未提交。
