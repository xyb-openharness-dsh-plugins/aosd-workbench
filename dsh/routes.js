/**
 * dsh/routes.js — 单前缀 /api/aosd 的内部分发（零依赖，可单测）。
 * 顺序：静态子路径（/api/aosd/ui、/api/aosd/assets）优先，其余按「方法 + 精确路径」查 API 表。
 * 2026-10-28 装机事故：曾注册 /api/aosd/ 全前缀静态处理器，先截住 /api/aosd/health 并回 404，
 * 客户端据此显示“服务连接失败”。本模块把分发顺序固定下来并加测试。
 */
export function createDispatcher({ apiRoutes, serveStatic, auth = () => undefined, sendJson, notFound }) {
  return async function handle(req, res) {
    let pathname
    try { pathname = new URL(req.url, 'http://local').pathname } catch { return sendJson(res, 400, { error: { code: 'bad_request', message: '非法请求路径' } }) }
    if (pathname.startsWith('/api/aosd/ui') || pathname.startsWith('/api/aosd/assets')) {
      if (serveStatic(req, res)) return
      return notFound(res, '静态资源不存在')
    }
    const rejection = auth(req)
    if (rejection !== undefined) return sendJson(res, rejection, { error: { code: 'auth_required', message: 'Authentication required' } })
    const handler = apiRoutes.get(`${req.method} ${pathname}`)
    if (!handler) return notFound(res, '未知接口')
    return handler(req, res)
  }
}