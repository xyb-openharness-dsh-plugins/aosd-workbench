import Schema from '@deepseek-ai/schemastery'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import * as store from './store.js'
import { isStoreError } from './store.js'
import { serveStatic } from './static.js'

export const name = 'aosd-main'
export const inject = ['webServer', 'connection']
export const Config = Schema.object({
  // cordis.patch.yml 注入本包独立数据根；SQLite 唯一事实库位于 root/aosd.sqlite。
  root: Schema.string(),
})
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

function fail(res, code, message, status = 400) {
  send(res, status, { error: { code, message, retryable: false } })
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) { reject(Object.assign(new Error('payload too large'), { code: 'payload_too_large' })); req.destroy() }
    })
    req.on('end', () => {
      if (!raw) return reject(Object.assign(new Error('empty body'), { code: 'empty_body' }))
      try { resolve(JSON.parse(raw)) } catch { reject(Object.assign(new Error('bad json'), { code: 'bad_json' })) }
    })
    req.on('error', reject)
  })
}

export function apply(ctx) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')
  const db = store.openStore(ctx.config?.root ? join(ctx.config.root, 'aosd.sqlite') : ':memory:')

  const staticOpts = { version: manifest.version, buildDate: manifest.buildDate }
  ctx.webServer.register({
    kind: 'prefix', path: '/api/aosd/',
    handler(req, res) {
      const reject = ctx.connection?.requestRejection?.(req)
      if (reject !== undefined && !String(req.url).startsWith('/api/aosd/ui')) return send(res, reject, { error: { code: 'auth_required', message: 'Authentication required' } })
      if (serveStatic(req, res, staticOpts)) return
      fail(res, 'not_found', '未知接口', 404)
    },
  }, 'aosd static + api')

  const json = (path, method, handler) => {
    ctx.webServer.register({
      kind: 'exact', path, method: undefined,
      async handler(req, res) {
        const reject = ctx.connection?.requestRejection?.(req)
        if (reject !== undefined) return send(res, reject, { error: { code: 'auth_required', message: 'Authentication required' } })
        try {
          await handler(req, res)
        } catch (error) {
          if (isStoreError(error)) {
            const status = error.code === 'store/not_found' ? 404 : error.code === 'store/conflict' ? 409 : 400
            return send(res, status, { error: { code: error.code, message: error.message, retryable: false } })
          }
          if (error.code === 'payload_too_large') return fail(res, 'payload_too_large', '请求体过大', 413)
          if (error.code === 'bad_json' || error.code === 'empty_body') return fail(res, error.code, error.message, 400)
          send(res, 500, { error: { code: 'internal', message: '服务器内部错误', retryable: false } })
        }
      },
    }, `aosd ${method} ${path}`)
  }

  json('/api/aosd/health', 'GET', (req, res) => {
    if (req.method !== 'GET') return fail(res, 'method_not_allowed', '仅支持 GET', 405)
    send(res, 200, { ok: true, version: manifest.version, apiVersion: 'v1', capabilities: ['health', 'write'] })
  })

  // 手工维护写入：叙述（本人/家属三类来源）
  json('/api/aosd/narratives', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    const row = store.writeNarrative(db, body.profileKey, body)
    send(res, 201, { narrative: row })
  })

  json('/api/aosd/narratives/:id/corrections', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    const row = store.correctNarrative(db, body.profileKey, body.id, body)
    send(res, 201, { narrative: row })
  })

  json('/api/aosd/nutrition', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { entry: store.writeNutrition(db, body.profileKey, body) })
  })

  json('/api/aosd/mind', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { entry: store.writeMind(db, body.profileKey, body) })
  })

  json('/api/aosd/questions', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { question: store.writeQuestion(db, body.profileKey, body) })
  })

  json('/api/aosd/candidates/:id/decision', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    const result = store.decideCandidate(db, body.profileKey, body.id, body.decision)
    send(res, 200, result)
  })

  json('/api/aosd/trials/:id/saved', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    send(res, 200, { trial: store.toggleTrialSaved(db, body.profileKey, body.id) })
  })

  json('/api/aosd/day', 'GET', (req, res) => {
    if (req.method !== 'GET') return fail(res, 'method_not_allowed', '仅支持 GET', 405)
    const url = new URL(req.url, 'http://local')
    const profileKey = url.searchParams.get('profileKey')
    const date = url.searchParams.get('date')
    if (!profileKey || !date) return fail(res, 'missing_params', 'profileKey/date 必填')
    const includePrivate = url.searchParams.get('private') === '1'
    send(res, 200, store.readDay(db, profileKey, date, { includePrivate }))
  })

  ctx.effect(() => db.close?.(), 'aosd store close')
}
