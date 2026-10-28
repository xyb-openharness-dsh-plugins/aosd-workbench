# 成人斯蒂尔病临床试验快照（2026-10-28）

- 查询：`adult-onset Still's disease`，来源：ictrp / ctv / chictr_online / chinadrugtrials。
- 记录数：**2**（manifest 记录数 = jsonl 行数 = sqlite 行数，脚本校验）。
- 来源终态：
  - `ictrp`：**FAILED**（UPSTREAM_UNKNOWN_ERROR） · ictrp_search 上游返回错误：上游工具返回 isError，但未提供错误详情。
  - `ctv`：**NO_RESULTS**（EMPTY_RESULT_SET） · 仅表示本地 SQLite/FTS 索引未命中，不代表 ClinicalTrials.gov 上不存在该试验。
  - `chictr_online`：**SUCCESS**（OK） · 来源返回 2 条记录。
  - `chinadrugtrials`：**DENIED**（CHINADRUGTRIALS_NO_RESULT_TABLE） · ChinaDrugTrials 未返回结果表格与分页信息，无法确认本次检索是否真正执行；通常是会话失效、被限流或返回了中间页面。
- **登记状态未核实**：不等于有效、安全、可入组，也不代表适合任何个人。
- FAILED / DENIED / NEEDS_SETUP 的来源不算“查过”，其缺失不得解读为“不存在相关试验”。
- 合并规则：仅同一登记身份合并；本快照未发现跨来源重复（overlaps=0）。
