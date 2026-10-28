# 临床公共数据登记（M0）

状态：⏳ **M4 尚未执行四通道采集、未建库**。M1 医学调研仅用 ClinicalTrials.gov API 宽条件查询 `adult-onset Still's disease`，2026-10-27 返回 26 条登记；这不是规范筛选、去重快照或正在招募数，详见 `RESEARCH-MEDICAL.md` T09。不能把该调研写成 M4 已完成。

- 目标：M4 通过 unified-trial-mcp 的 MCP stdio 通道，按用户指定四通道实际能力执行，记录 query、时间、来源、覆盖、成功/超时/未配置/失败。
- 不预先写四通道均已调用成功；脚本尚未实现，在线服务与凭据尚未检测。
- 胰腺相关离线语料对 AOSD 无覆盖，不能计作“查过”；若 M4 不采用则记未配置。
- 交付目标为 `research/aosd/{manifest.json,trials-2026.jsonl,aosd_trials_2026.sqlite,README.md}`；确切目录/文件名随 M4 设计冻结。
- 一致性要求：manifest 记录数 = JSONL 行数 = SQLite 行数，sha256 与实算一致，关键字段逐 record_id 比对；采集重跑不代替只读核验。
- 登记状态未核实；登记不等于有效、安全、可入组或适合某位患者。不生成 eligible/suitability 判读列。
- NMPA：本轮尚未检索或核验任何药品批准/适应症。医学趋势段若需监管事实，必须回到 NMPA 官方批件/公告，不能用药企新闻代替官方核验。


## 2026-10-28 四通道快照（M4）

- 查询：`adult-onset Still's disease`；逐来源顺序检索（并发会让慢源拖垮其他源）。
- 产物：`research/aosd/{manifest.json, trials-2026.jsonl, aosd_trials_2026.sqlite, README.md}`；manifest 记录数 = jsonl 行数 = sqlite 行数，sha256 已校验。
- 来源终态：**ictrp FAILED**、**ctv NO_RESULTS**、**chictr_online SUCCESS（2 条）**、**chinadrugtrials DENIED**。
- 2 条均为 ChiCTR 登记：AF 评分诊断价值前瞻队列（2026/04/17）、伏欣奇拜单抗治疗 AOSD 临床研究（2026/08/01）。
- 口径：登记状态未核实；不等于有效/安全/可入组；FAILED/DENIED 不算查过，零命中不等于不存在。
- 未配置：chictr 胰腺癌离线语料对本病种无覆盖；xyb 归档仅胰腺癌。
