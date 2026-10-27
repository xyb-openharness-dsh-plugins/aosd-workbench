# 指南与公共医学资料桥接（M0）

状态：🔧 仅登记入口，未下载完整指南、未核页数、未建立 refs/cadence、未启用阈值。

| 机构/资料 | 当前核验事实 | 用途边界 | 验证状态 |
| --- | --- | --- | --- |
| 国家卫生健康委办公厅，国卫办医政函〔2025〕252号 | 2025-07-10 发布《软骨发育不全等86个罕见病病种诊疗指南（2025年版）》通知；页面列有 PDF 附件 | 作为 AOSD 中文规范原件的优先来源；不把 BACKLOG 页码当正文页码 | [官方通知](https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml) 已检索；附件待取得 |
| 《第二批罕见病目录》 | 官方目录含成人斯蒂尔病，BACKLOG 列 #4 | 仅核对标准名称与范围，不推导个体诊断 | 目录编号已核；正文不适用 |
| 其他中文/国际资料 | 待 M1 按十主题检索 | 不以相邻疾病外推；未得原件写未取得 | 未核实 |

## M1 原件与链接验收

1. 从通知页解析真实附件 URL，下载至本项目 `guidebooks/`（不是患者资料目录），记录页数、sha256、发布/获取日期和 OCR 状态。
2. 实测文件是 PDF 而非 HTML 登录页；`kind` 使用 36/38 号词表，栏目页不冒充原件。
3. 只将病种名称、版本、公开目录/页码和允许范围内的极短出处写入结构化参考；不复制临床正文。
4. `guidebooks/manifest.json`、`assets/reference/guideline/refs.json`、未来 `cadence.json` 的 document id/version/published/sha256 逐字一致；没有原件就不建节奏/阈值。
5. `README` 疾病概要与原型 primer-data 同源；表格原件/二次来源可点，`check-primer-links --http` 实测，WARN 不算通过。

来源：[国家卫健委通知](https://www.nhc.gov.cn/yzygj/c100068/202507/5b3f41180a42465eb9eec34597bacaf2.shtml)；[第二批罕见病目录官方 PDF](https://www.nhc.gov.cn/cms-search/downFiles/1b943db0e49348cab64f069b0f4cd9cf.pdf)。访问日期 2026-10-27。
