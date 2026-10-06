import type { IncomingMessage, ServerResponse } from 'node:http'
import { accountDataLimit, parseAccountData, record } from '@jp-learn/shared'
import { accountDatabase, sessionHash } from '#account-db'
import {
  accountOrigin,
  appCookie,
  authCookie,
  configuredAccount,
  cookieValue,
  exchangeIdentity,
  newAuthorization,
  readAuthorization,
} from '#account-auth'
import type { AccountEnvironment } from '#account-auth'

export default async function handleAccount(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  env: AccountEnvironment = process.env,
) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  const send = (value: unknown, status = 200) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(value))
  }
  const redirect = (url: string) => {
    res.statusCode = 302
    res.setHeader('Location', url)
    res.end()
  }
  const setCookie = (
    name: string,
    value: string,
    maxAge: number,
    secure: boolean,
  ) => {
    const previous = res.getHeader('Set-Cookie')
    const cookies = Array.isArray(previous)
      ? previous.map(String)
      : previous
        ? [String(previous)]
        : []
    res.setHeader('Set-Cookie', [
      ...cookies,
      `${name}=${value}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`,
    ])
  }
  if (!configuredAccount(env))
    return send(
      { configured: false, user: null, error: '账号同步服务尚未配置。' },
      503,
    )
  let origin: string
  try {
    origin = accountOrigin(env, req.headers.host)
  } catch {
    return send({ error: '账号服务地址配置不正确。' }, 503)
  }
  const secure = origin.startsWith('https:')
  const url = new URL(req.url || '/', origin)
  const path = url.pathname
  const db = accountDatabase(env.DATABASE_URL!)
  try {
    if (req.headers.host !== new URL(origin).host)
      return send({ error: '请求地址不匹配。' }, 403)
    if (req.method === 'POST' && req.headers.origin !== origin)
      return send({ error: '请从本站执行此操作。' }, 403)
    if (req.method === 'GET' && path === '/api/auth/authorize') {
      if (req.headers['sec-fetch-site'] === 'cross-site')
        return send({ error: '请从本站开始登录。' }, 403)
      const ip = String(
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      )
        .split(',')[0]
        .trim()
      if (!(await db.limit(`login:${sessionHash(ip)}`, 10)))
        return send({ error: '登录请求过于频繁，请稍后重试。' }, 429)
      const auth = newAuthorization(env, origin)
      setCookie(authCookie, auth.cookie, 600, secure)
      return redirect(auth.url)
    }
    if (req.method === 'GET' && path === '/api/auth/callback') {
      setCookie(authCookie, '', 0, secure)
      try {
        const oauth = readAuthorization(
          cookieValue(req.headers.cookie, authCookie),
          url.searchParams.get('state'),
          origin,
          env,
        )
        const code = url.searchParams.get('code')
        if (!code || code.length > 2048 || url.searchParams.has('error'))
          throw new Error('Login canceled')
        const identity = await exchangeIdentity(code, oauth, env)
        const login = await db.login(identity.subject, identity.name)
        setCookie(appCookie, login.token, 7 * 86400, secure)
        return redirect(`${origin}/?account=connected`)
      } catch {
        return redirect(`${origin}/?account=error`)
      }
    }
    const token = cookieValue(req.headers.cookie, appCookie)
    const user =
      token && /^[a-zA-Z0-9_-]{43}$/.test(token)
        ? await db.session(token)
        : null
    if (req.method === 'GET' && path === '/api/auth/session')
      return send({ configured: true, user })
    if (req.method === 'POST' && path === '/api/auth/logout') {
      if (token && user) await db.logout(token)
      setCookie(appCookie, '', 0, secure)
      return send({ user: null })
    }
    if (path !== '/api/account') return send({ error: '接口不存在。' }, 404)
    if (!user) return send({ error: '请先登录歌日和账号。' }, 401)
    if (!(await db.limit(`data:${user.id}`, 120)))
      return send({ error: '同步过于频繁，请稍后重试。' }, 429)
    if (req.method === 'GET') return send({ user, ...(await db.read(user.id)) })
    if (req.method !== 'POST') return send({ error: '不支持此请求方法。' }, 405)
    let value: unknown = req.body
    if (value === undefined) {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        const bytes = Buffer.from(chunk)
        size += bytes.length
        if (size > accountDataLimit + 8192)
          return send({ error: '同步数据过大。' }, 413)
        chunks.push(bytes)
      }
      try {
        value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return send({ error: '同步数据格式不正确。' }, 400)
      }
    } else if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch {
        return send({ error: '同步数据格式不正确。' }, 400)
      }
    }
    if (
      !record(value) ||
      !Number.isSafeInteger(value.revision) ||
      Number(value.revision) < 0 ||
      typeof value.mutationId !== 'string' ||
      !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
        value.mutationId,
      )
    )
      return send({ error: '同步版本或请求编号不正确。' }, 400)
    if (value.userId !== user.id)
      return send({ error: '账号已变化，请重新连接。' }, 401)
    let data
    try {
      data = parseAccountData(value.data)
    } catch (error) {
      return send(
        { error: error instanceof Error ? error.message : '同步数据不正确。' },
        400,
      )
    }
    const result = await db.write(
      user.id,
      Number(value.revision),
      value.mutationId,
      data,
    )
    return send({ user, ...result }, result.accepted ? 200 : 409)
  } catch {
    return send({ error: '账号服务暂时不可用，请稍后重试。' }, 503)
  }
}
