import Schema from '@deepseek-ai/schemastery'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import * as store from './store.js'
import { isStoreError } from './store.js'
import { serveStatic } from './static.js'
import { createDispatcher } from './routes.js'

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

export function apply(ctx, config = {}) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')
  /* 懒加载：开库失败不能把插件带崩（否则路由不注册、UI 直接 not found）。
     真机踩过：apply 里同步 openStore 抛错 → 整个 bundle 失效。 */
  let db = null
  let dbError = null
  function getDb() {
    if (db) return db
    if (dbError) return null
    try {
      db = store.openStore(config?.root ? join(config.root, 'aosd.sqlite') : ':memory:')
      return db
    } catch (error) {
      dbError = String(error && error.message || error)
      return null
    }
  }

  const staticOpts = { version: manifest.version, buildDate: manifest.buildDate }
  /* 单前缀 + 内部分发（同家族底本）：宿主只注册 /api/aosd 一条 prefix，
     内部先认静态子路径，再按「方法 + 精确路径」查 API 表。
     这样不会出现“静态全前缀先截住 health 返回 404”的顺序问题
     （2026-10-28 装机实测：客户端因此进入服务连接失败假状态）。 */
  const apiRoutes = new Map()
  const json = (path, method, handler) => {
    apiRoutes.set(`${method} ${path}`, handler)
  }

  async function dispatchApi(req, res, pathname) {
    const reject = ctx.connection?.requestRejection?.(req)
    if (reject !== undefined) return send(res, reject, { error: { code: 'auth_required', message: 'Authentication required' } })
    const handler = apiRoutes.get(`${req.method} ${pathname}`)
    if (!handler) return fail(res, 'not_found', '未知接口', 404)
    if (pathname !== '/api/aosd/health' && !getDb()) return fail(res, 'database_unavailable', dbError || '数据库不可用', 503)
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
  }

  const handle = createDispatcher({
    apiRoutes,
    serveStatic: (req, res) => serveStatic(req, res, staticOpts),
    auth: (req) => ctx.connection?.requestRejection?.(req),
    sendJson: send,
    notFound: (res, message) => fail(res, 'not_found', message, 404),
  })
  ctx.effect(() => {
    const dispose = ctx.webServer.register({ kind: 'prefix', path: '/api/aosd', handler: handle })
    return () => {
      try { dispose && dispose() } catch { /* 卸载清理失败不盖住原错误 */ }
      try { db && db.close() } catch { /* 同上 */ }
    }
  }, 'aosd ui + api')

  json('/api/aosd/health', 'GET', (req, res) => {
    if (req.method !== 'GET') return fail(res, 'method_not_allowed', '仅支持 GET', 405)
    send(res, 200, { ok: true, version: manifest.version, apiVersion: 'v1', capabilities: ['health', 'write'], database: db ? 'open' : (dbError ? 'error' : 'lazy') })
  })

  // 手工维护写入：叙述（本人/家属三类来源）
  json('/api/aosd/narratives', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    const row = store.writeNarrative(getDb(), body.profileKey, body)
    send(res, 201, { narrative: row })
  })

  json('/api/aosd/narratives/:id/corrections', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    const row = store.correctNarrative(getDb(), body.profileKey, body.id, body)
    send(res, 201, { narrative: row })
  })

  json('/api/aosd/nutrition', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { entry: store.writeNutrition(getDb(), body.profileKey, body) })
  })

  json('/api/aosd/mind', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { entry: store.writeMind(getDb(), body.profileKey, body) })
  })

  json('/api/aosd/questions', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey) return fail(res, 'missing_profile', 'profileKey 必填')
    send(res, 201, { question: store.writeQuestion(getDb(), body.profileKey, body) })
  })

  json('/api/aosd/candidates/:id/decision', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    const result = store.decideCandidate(getDb(), body.profileKey, body.id, body.decision)
    send(res, 200, result)
  })

  json('/api/aosd/trials/:id/saved', 'POST', async (req, res) => {
    if (req.method !== 'POST') return fail(res, 'method_not_allowed', '仅支持 POST', 405)
    const body = await readJsonBody(req)
    if (!body.profileKey || !body.id) return fail(res, 'missing_profile', 'profileKey/id 必填')
    send(res, 200, { trial: store.toggleTrialSaved(getDb(), body.profileKey, body.id) })
  })

  json('/api/aosd/day', 'GET', (req, res) => {
    if (req.method !== 'GET') return fail(res, 'method_not_allowed', '仅支持 GET', 405)
    const url = new URL(req.url, 'http://local')
    const profileKey = url.searchParams.get('profileKey')
    const date = url.searchParams.get('date')
    if (!profileKey || !date) return fail(res, 'missing_params', 'profileKey/date 必填')
    const includePrivate = url.searchParams.get('private') === '1'
    send(res, 200, store.readDay(getDb(), profileKey, date, { includePrivate }))
  })

}
