# 数据契约冻结 · 0001

- 文件：`schema/migrations/0001_initial.sql`
- SHA-256：`a88cb598f52f7e5b66bbb4fe79544e7a0b824c8bebfcc926d4dc9889d0ba2538`
- 冻结日期：2026-10-28
- 依据：用户 2026-10-27 指示「手工维护/AI对话后写入能力，支持 sqlite 为唯一存储对象」；G3 数据模型签认由该指示授权，范围见下。

## 内容边界（改结构只能新增 0002_*.sql，禁止修改本文件与 0001）

1. **唯一存储**：所有业务事实（叙述、报告、指标、用药、答复、问题、营养、心理、试验、就诊快照）只存 `config.root` 下这一个 SQLite 库；原型 demo-data.js 是演示投影，不是第二事实源。
2. **无判读列**：全库无 `diagnosis / risk_level / eligible / suitability / activity_score / efficacy` 列；`check-schema-freeze` 会扫描迁移文件并失败。
3. **可空语义**：`value_num / unit / ref_low / ref_high / reported_at` 等可空列缺失即 NULL；`<0.5` 类原文保留在 `raw_text` 且 `value_num` 为 NULL；未知单位不得用字典补。
4. **隐私默认**：`narratives.is_private` 默认 1（敏感记录）、`family_visible/export_allowed/ai_allowed` 默认 0；撤销只影响后续读取，不回召历史导出。
5. **更正只追加**：`revision + supersedes_id` 链式更正，禁止 UPDATE 覆盖旧值语义字段（`decision / review_state / saved / stale` 等状态列除外）。
6. **候选→确认**：候选接受后在 `observations` 生成新行并回写候选 `decision='accepted'`；拒收只改 `decision`，不产生观察值。
7. **试验匹配**：`trials.pct` 是展示层计算值随快照落库（含 `snapshot_date`），不作为判定列；禁止改名 eligible/suitability。
8. **复合主键读取**：`(profile_key, id)` 主键表裸查询必须 `ORDER BY rowid`。

## 验收

- `node scripts/check-schema-freeze.mjs`：SHA-256 一致 + 禁用列扫描 + 关键表存在。
- `test/store.test.mjs`：内存库走 写入/更正/候选决策/隐私默认/不等式 语义。
- 用户 G3 确认：待签（本合同由用户指示建立，最终签认留 G3-SIGNOFF）。
