/* 版本号的运行时副本（与根目录 VERSION 同源）。
 *
 * 客户端是单文件、由宿主直接加载，没地方 import 根目录文件，所以这里落一份字面量；
 * `scripts/check-pane-params.mjs` 会比对它与 VERSION，不一致 `npm run check` 直接红。
 */
export const version = '0.5.11'
