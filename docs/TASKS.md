# 实施任务与当前交接

规格：M1 草案（G1 待签）；原型 hash：无（未制作）；当前分支：research/main（本地，无远端）；包版本：0.1.0 骨架。

| ID | 业务单元 | 前置依赖 | 拥有文件/模块 | 实现/检查要求 | 证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| T01 | 接入基线 | BRIEF/SPEC | package/patch/entry | 实际包可被目标宿主加载 | check/staticPass；真机未做 | 🔧 骨架 |
| T02 | G1 范围签认 | 本文件M1+HVT/患者评审 | SPEC/SCENARIOS/INTERACTION/ACCEPTANCE | 用户明确范围、原话、日期；两项偏离确认 | 待用户 | ⛔ 待签 |
| T03 | HTML原型 | T02+维护者建仓/授权 | prototypes/v0.2四件套 | file://、整页、原值表、AI五态、窄宽；X1–X4 | 未做 | ⏳ |
| T04 | 数据模型 | T03/G3 | schema/0001+freeze-contract | 禁判读列、revision、授权、采样/报告日期；sha256 | 未做 | ⏳ |
| T05 | 公共指南/疾病概要 | T03 | primer-data/assets route | 本地+官方、四段、P1–P8、hash/HTTP | 文件/pack已核；UI未做 | 🔧 |
| T06 | 业务API/UI | T04 | dsh/public | 手录/同日/原值/用药/复诊/答复合规；私密三出口 | 未做 | ⏳ |
| T07 | MinerU | T04合同 | dsh/mineru/settings | Token、显式授权、失败零候选、逐项核对 | 未做 | ⏳ |
| T08 | 原生Agent | T02+宿主合同 | lib/client | 34号发送、右栏、草稿冲突、诱导负例/急症退出 | 未做 | ⏳ |
| T09 | 五套测试/parity | T06/T08 | test/ | 内存库、五类测试、public逐字符 | 未做 | ⏳ |
| T10 | 装机与真机 | T09+维护者建仓 | tgz/profile | 升版、bundles、重启新会话、真机走查 | 未做 | ⏳ |
| T11 | 发布/回填/回流 | T10 | Release/CHANGELOG/BACKLOG/starter | tag/Release/hash；BACKLOG只改状态；M9 | 未做 | ⏳ |

## 当前失败/复现

- 无业务代码失败；`npm run check`当前通过、`npm test`10/10，只覆盖骨架/文档合同/指南资产。
- 最终HVT定点复核待回；若仍有W/B，不开HTML。

## 未验证项

患者/家属访谈0、临床审核0、可用性0、真实AOSD报告MinerU 0、原生会话0、生产DB/API 0、原型0、Desktop安装0、P1–P5/X1–X4 0。

## 下一步

1. 定点复核确认研究占位与B/G/W计数。
2. 向用户提交G1范围、图形偏离、非肿瘤出口偏离，等待明确签认。
3. 维护者triage确认T1/波次/建仓；未授权不建组织仓、不推远端。
4. G1签后才开HTML；G2签后才写生产schema/业务。
