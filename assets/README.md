# 社区开发 assets

- `brand/xyb-logo.png`：社区提供的 Logo 参考副本，hash/来源见 manifest。作为社区品牌参考提供；当前目录未查到独立素材许可，**不得把“本机存在”视为已取得公开再分发授权**。社区项目使用按权利人授权执行，其他品牌可替换；模板不自动展示该 Logo。
- `tokens.css` / `tokens.json`：本脚手架自写的社区主题建议，作用域 `.wb-root`，不修改宿主全局；语义值可随已确认原型调整。
- `icons/flower-5.svg` / `flower-7.svg` / `clover.svg`：本脚手架绘制的简单几何装饰。五/七色花自带慢旋转及减少动效支持；每页仅用于 1–3 处重要标题，嵌入业务页作为纯装饰时 aria-hidden。
- `patterns/page-view.js` / `page-view.css`：32 号整页视图的可运行实现（导航栈、Esc 一层一退、浏览器返回键、`#page=` 深链、焦点与滚动恢复）。只放结构与版式，颜色用 `--pv-*` 由项目覆盖；改它必须同时跑 `scripts/probe-page-view.mjs` 与 `--self-test`。
- `patterns/page-view.js` / `page-view.css`：32 号整页视图的可运行实现（导航栈、Esc 一层一退、浏览器返回键、`#page=` 深链、焦点与滚动恢复）。只放结构与版式，颜色用 `--pv-*` 由项目覆盖；改它必须同时跑 `scripts/probe-page-view.mjs` 与 `--self-test`。
- `patterns/disease-primer.js` / `disease-primer.css`：36 号疾病概要（「?」入口）的实现。经典脚本（IIFE，`file://` 下可直接 `<script src>`），自动把「?」插进 `.top-actions`，点开是整页视图，`open` 压一条 history、`close` 走 `history.back()`。数据来自 `window.DISEASE_PRIMER`（四段：定义 / 指南情况 / 治疗全景 / 趋势）。改它必须同时跑 `scripts/probe-disease-primer.mjs` 与 `--self-test`。
- `manifest.json`：记录来源、用途、体积、hash、许可状态。自定义图片、数据、字体都应追加。

- `guidebooks/nhc-86-rare-diseases-2025.pdf`：用户于 2026-10-27 明确要求随项目保留的官方指南。来源为中国政府网公开 PDF，517 页、15,611,195 bytes、SHA-256 `d03fe69585320fea7938bf85bea9ec346a3d5d7671c7d8627fff8393679bbfef`。AOSD 为正文 17–21 页（PDF 21–25 页）。保留官方来源链接，提供本地只读阅读，不修改正文；本地链接的渲染/装机验证见 M2/M6，不能以文件存在代替 UI 通过。
- `guidebooks/manifest.json`：该文件的版本、hash、页码、获取日期与用途。
