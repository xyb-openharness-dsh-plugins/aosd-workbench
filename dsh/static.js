/**
 * dsh/static.js — public/ 与公共指南资产的只读静态服务（零依赖，宿主入口与测试共用）。
 * 规则：路径穿越拦截；index.html 注入 __VERSION_DISPLAY__/__BUILD_DATE__（35 号：页面显示版本=服务端版本）；
 * 指南 PDF 只走白名单文件名，与患者资料目录分根。
 */
import { readFileSync, statSync, createReadStream } from 'node:fs'
import { join, resolve, sep, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const PUBLIC_DIR = join(PKG_ROOT, 'public')
const GUIDE_DIR = join(PKG_ROOT, 'assets', 'guidebooks')
export const GUIDE_PDF = 'nhc-86-rare-diseases-2025.pdf'

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf',
}

function safeJoin(root, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  const rel = clean.replace(/^\/+/, '')
  const full = resolve(root, rel || 'index.html')
  if (full !== root && !full.startsWith(root + sep)) return null
  return full
}

function sendFile(res, file, { version, buildDate } = {}) {
  try {
    const st = statSync(file)
    if (!st.isFile()) return false
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream'
    if (file.endsWith('index.html')) {
      const html = readFileSync(file, 'utf8')
        .replaceAll('__VERSION_DISPLAY__', 'v' + version)
        .replaceAll('__BUILD_DATE__', buildDate || '')
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' })
      res.end(html)
      return true
    }
    res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'cache-control': 'no-cache' })
    createReadStream(file).pipe(res)
    return true
  } catch { return false }
}

/** @returns {boolean} 是否已写响应（false = 不归本模块管，调用方继续走 API 路由）。 */
export function serveStatic(req, res, { version, buildDate } = {}) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  let path
  try { path = new URL(req.url, 'http://local').pathname } catch { return false }
  if (path === '/api/aosd/assets/guidebooks/' + GUIDE_PDF) {
    return sendFile(res, join(GUIDE_DIR, GUIDE_PDF), { version, buildDate })
  }
  if (!path.startsWith('/api/aosd/ui')) return false
  const rel = path.slice('/api/aosd/ui'.length) || '/'
  const file = safeJoin(PUBLIC_DIR, rel)
  if (file && sendFile(res, file, { version, buildDate })) return true
  return sendFile(res, join(PUBLIC_DIR, 'index.html'), { version, buildDate })
}
