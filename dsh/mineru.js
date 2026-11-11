/**
 * dsh/mineru.js — MinerU HTTP API v4 接入 + 候选抽取（M5 模块）
 *
 * 合同（starter docs/18）：
 *  - 显式文件选择 + 逐文件云授权；未授权不发。
 *  - Token 来源：显式 > 密钥文件 > 环境变量；只回显来源与掩码，原文不进日志/错误。
 *  - 默认 pipeline；失败不产候选、保留原件；表格先转竖线表再按位置对齐，数量不符整行放弃。
 *  - 解析结果永远是候选，逐项确认才入事实。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const API = 'https://mineru.net/api/v4'

export function tokenPath(root) {
  return join(root, '.secrets', 'mineru.json')
}
export function readToken(root) {
  const file = tokenPath(root)
  if (existsSync(file)) {
    try {
      const token = JSON.parse(readFileSync(file, 'utf8')).token
      if (token) return { token, source: 'file', path: file }
    } catch { /* 坏文件不覆盖，下一位来源兜底 */ }
  }
  if (process.env.MINERU_TOKEN) return { token: process.env.MINERU_TOKEN, source: 'env', path: null }
  return { token: null, source: 'none', path: null }
}
export function saveToken(root, token) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('Token 不能为空')
  const file = tokenPath(root)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify({ token: token.trim() }, null, 2) + '\n')
  try { chmodSync(file, 0o600) } catch { /* 平台不支持时忽略 */ }
  return { source: 'file', path: file }
}
export function maskToken(token) {
  if (!token) return ''
  return token.length <= 8 ? '****' : token.slice(0, 4) + '…' + token.slice(-4)
}
export function settingsStatus(root) {
  const { token, source, path } = readToken(root)
  return { configured: Boolean(token), source, masked: maskToken(token), path: path || null }
}

/** 极简 ZIP 读取：只按中央目录找指定文件名，deflate/stored 均支持。 */
export function unzipEntry(buffer, name) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('ZIP 缺少中央目录')
  const count = buf.readUInt16LE(eocd + 10)
  let offset = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(offset) !== 0x02014b50) throw new Error('ZIP 中央目录损坏')
    const method = buf.readUInt16LE(offset + 10)
    const compSize = buf.readUInt32LE(offset + 20)
    const nameLen = buf.readUInt16LE(offset + 28)
    const extraLen = buf.readUInt16LE(offset + 30)
    const commentLen = buf.readUInt16LE(offset + 32)
    const localOffset = buf.readUInt32LE(offset + 42)
    const entryName = buf.slice(offset + 46, offset + 46 + nameLen).toString('utf8')
    if (entryName === name) {
      const localNameLen = buf.readUInt16LE(localOffset + 26)
      const localExtraLen = buf.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLen + localExtraLen
      const data = buf.slice(dataStart, dataStart + compSize)
      if (method === 0) return data.toString('utf8')
      if (method === 8) return inflateRawSync(data).toString('utf8')
      throw new Error(`不支持的 ZIP 压缩方法 ${method}`)
    }
    offset += 46 + nameLen + extraLen + commentLen
  }
  throw new Error(`ZIP 中没有 ${name}`)
}

/** 表格先转竖线表：`<table>` → `| a | b |`，用于后续按位置对齐。 */
export function htmlTablesToPipes(md) {
  /* 先剥标签再解码实体：反过来会把 &lt;0.5 解成 <0.5，再被“去标签”正则当作标签删掉。 */
  return String(md).replace(/<table[\s\S]*?<\/table>/gi, (table) => {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) =>
      [...m[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)].map((c) => c[0].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()))
    return '\n' + rows.map((r) => '| ' + r.join(' | ') + ' |').join('\n') + '\n'
  })
}

/** 从 MinerU markdown 抽取“名称 值 单位 参考范围”候选；数量不符整行放弃。 */
export function extractCandidates(markdown, { documentId, collectedAt }) {
  const md = htmlTablesToPipes(markdown)
  const out = []
  const lines = md.split('\n').map((l) => l.trim())
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 2) continue
    const name = cells[0]
    if (!name || /^-+$/.test(name) || /项目|检验|名称|结果/.test(name)) continue
    const raw = cells[1]
    if (!/^-?\d+(\.\d+)?$|^[<>≤≥]\s*\d+(\.\d+)?$/.test(raw)) continue
    const unit = cells[2] && !/参考|范围/.test(cells[2]) ? cells[2] : null
    const refCell = cells.find((c) => /\d\s*[-–~]\s*\d/.test(c))
    const ref = refCell ? refCell.match(/(\d+(?:\.\d+)?)\s*[-–~]\s*(\d+(?:\.\d+)?)/) : null
    const numeric = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : null
    out.push({
      documentId, fieldName: name, rawText: raw, valueText: numeric == null ? raw : null,
      valueNum: numeric, unit, refLow: ref ? Number(ref[1]) : null, refHigh: ref ? Number(ref[2]) : null,
      collectedAt, decision: 'pending',
      note: numeric == null ? '不等式原文保留，数值为空' : (unit ? null : '单位未印，保持为空'),
    })
  }
  return out
}

async function call(path, { token, method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(API + path, {
    method,
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { /* 非 JSON */ }
  if (!response.ok) {
    const code = data?.code ?? response.status
    throw Object.assign(new Error(`MinerU 请求失败（${response.status}${code ? ' / ' + code : ''}）`), { status: response.status })
  }
  return data
}

/** 解析一份 PDF（pipeline 默认）；失败抛出，不返回伪造内容。 */
export async function parseWithMineru({ token, buffer, filename }) {
  if (!token) throw Object.assign(new Error('未配置 MinerU Token'), { code: 'mineru_no_token' })
  const batch = await call('/file-urls/batch', { token, method: 'POST', body: { enable_formula: false, language: 'ch', files: [{ name: filename, data_id: filename }] } })
  const uploadUrl = batch?.data?.file_urls?.[0]
  const batchId = batch?.data?.batch_id
  if (!uploadUrl || !batchId) throw new Error('MinerU 未返回上传地址')
  const put = await fetch(uploadUrl, { method: 'PUT', body: buffer })
  if (!put.ok) throw new Error(`MinerU 上传失败（${put.status}）`)
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await call(`/extract-results/batch/${batchId}`, { token })
    const state = result?.data?.extract_result?.[0]?.state
    if (state === 'done') {
      const zipUrl = result?.data?.extract_result?.[0]?.full_zip_url
      if (!zipUrl) throw new Error('MinerU 完成但未给下载地址')
      const zip = Buffer.from(await (await fetch(zipUrl)).arrayBuffer())
      return unzipEntry(zip, 'full.md')
    }
    if (state === 'failed') throw new Error('MinerU 解析失败')
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error('MinerU 解析超时')
}