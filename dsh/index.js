import Schema from '@deepseek-ai/schemastery'
import { readFileSync } from 'node:fs'

export const name = 'aosd-main'
export const inject = ['webServer', 'connection']
export const Config = Schema.object({
  // cordis.patch.yml 注入本包独立数据根；业务存储实现前不创建患者目录。
  root: Schema.string(),
})
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export function apply(ctx) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/api/aosd/health',
    handler(req, res) {
      const send = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(body))
      }
      if (typeof ctx.connection?.requestRejection !== 'function') return send(503, { error: 'connection authentication capability unavailable' })
      const rejection = ctx.connection.requestRejection(req)
      if (rejection !== undefined) return send(rejection, { error: 'Authentication required' })
      if (req.method !== 'GET') return send(405, { error: 'Method not allowed' })
      send(200, { ok: true, version: manifest.version, apiVersion: 'v1', capabilities: ['health'] })
    },
  }), 'aosd health')
}
