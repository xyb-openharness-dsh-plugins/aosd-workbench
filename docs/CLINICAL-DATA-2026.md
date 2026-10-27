# 临床公共数据登记（M0）

状态：⏳ **M4 尚未执行四通道采集、未建库**。M1 医学调研仅用 ClinicalTrials.gov API 宽条件查询 `adult-onset Still's disease`，2026-10-27 返回 26 条登记；这不是规范筛选、去重快照或正在招募数，详见 `RESEARCH-MEDICAL.md` T09。不能把该调研写成 M4 已完成。

- 目标：M4 通过 unified-trial-mcp 的 MCP stdio 通道，按用户指定四通道实际能力执行，记录 query、时间、来源、覆盖、成功/超时/未配置/失败。
- 不预先写四通道均已调用成功；脚本尚未实现，在线服务与凭据尚未检测。
- 胰腺相关离线语料对 AOSD 无覆盖，不能计作“查过”；若 M4 不采用则记未配置。
- 交付目标为 `research/aosd/{manifest.json,trials-2026.jsonl,aosd_trials_2026.sqlite,README.md}`；确切目录/文件名随 M4 设计冻结。
- 一致性要求：manifest 记录数 = JSONL 行数 = SQLite 行数，sha256 与实算一致，关键字段逐 record_id 比对；采集重跑不代替只读核验。
- 登记状态未核实；登记不等于有效、安全、可入组或适合某位患者。不生成 eligible/suitability 判读列。
- NMPA：本轮尚未检索或核验任何药品批准/适应症。医学趋势段若需监管事实，必须回到 NMPA 官方批件/公告，不能用药企新闻代替官方核验。
