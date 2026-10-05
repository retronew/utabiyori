import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseWordLyrics } from '@jp-learn/shared'
import { call, configured, MusicError } from '#client'
import type { Environment } from '#client'
import { seal, token, unseal } from '#session'
import type { Session } from '#session'
import { readSongTicket, songTicket } from '#song-ticket'
import { webPlayback } from '#web-playback'
import { webQr, webPoll } from '#web-auth'
import { WebAuthorizationError } from '#web-client'

const cookieName = 'utabiyori_ncm'
const webCookieName = 'utabiyori_ncm_web'
const buckets = new Map<string, { time: number; count: number }>()
const path = '/openapi/music/basic'
const idPattern = /^[a-fA-F0-9]{32}$/
function safeImage(value: unknown) {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value)
    if (
      !/(^|\.)music\.126\.net$/.test(url.hostname) &&
      !/(^|\.)music\.163\.com$/.test(url.hostname)
    )
      return undefined
    url.protocol = 'https:'
    return url.href
  } catch {
    return undefined
  }
}
function bodyObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') return bodyObject(JSON.parse(value))
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new MusicError('请求格式不正确。', 400)
  return value as Record<string, unknown>
}
async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body !== undefined) return bodyObject(req.body)
  let buffer = ''
  for await (const chunk of req) {
    buffer += chunk
    if (Buffer.byteLength(buffer) > 4096)
      throw new MusicError('请求过大。', 413)
  }
  return bodyObject(buffer)
}
export default async function handle(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  env: Environment = process.env,
) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  const send = (value: unknown, status = 200) => {
    res.statusCode = status
    res.end(JSON.stringify(value))
  }
  if (!configured(env))
    return send({ configured: false, error: '网易云服务尚未配置。' }, 503)
  const secret = env.NETEASE_SESSION_SECRET!
  const rawCookie = req.headers.cookie
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)
  const session: Session = (rawCookie && unseal(rawCookie, secret)) || {
    deviceId: randomBytes(16).toString('hex'),
  }
  const webCookie = req.headers.cookie
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${webCookieName}=`))
    ?.slice(webCookieName.length + 1)
  const decodedWeb = webCookie && unseal(webCookie, secret)
  const webSession: Session =
    decodedWeb && decodedWeb.deviceId === session.deviceId
      ? decodedWeb
      : { deviceId: session.deviceId }
  const webLoggedIn = Boolean(
    webSession.web?.cookies.MUSIC_U && webSession.web.expires > Date.now(),
  )
  const setCookie = (name: string, value: string, maxAge = 1728000) => {
    const existing = res.getHeader('Set-Cookie')
    const cookies = Array.isArray(existing)
      ? existing.map(String)
      : existing
        ? [String(existing)]
        : []
    const header = `${name}=${value}; Path=/api/netease; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${env.VERCEL || 'encrypted' in req.socket ? '; Secure' : ''}`
    if (Buffer.byteLength(header) > 4000)
      throw new MusicError('网易云会话过大，请重新扫码登录。')
    res.setHeader('Set-Cookie', [
      ...cookies.filter((x) => !x.startsWith(`${name}=`)),
      header,
    ])
  }
  const save = () => setCookie(cookieName, seal(session, secret))
  const saveWeb = () =>
    setCookie(webCookieName, seal(webSession, secret), 7 * 86400)
  const clearWeb = () => {
    delete webSession.web
    delete webSession.webPending
    setCookie(webCookieName, '', 0)
  }
  const clearUser = () => {
    delete session.user
    delete session.pending
    delete session.playback
    clearWeb()
    save()
  }
  try {
    if (req.method === 'GET')
      return send({
        configured: true,
        loggedIn: Boolean(
          session.user && session.user.expires > Date.now() - 13 * 86400000,
        ),
        hybrid: env.NETEASE_PLAYBACK_PROVIDER === 'hybrid',
        webLoggedIn,
      })
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return send({ error: '不支持此请求方式。' }, 405)
    }
    const host = req.headers.host
    let originHost: string | undefined
    try {
      originHost = new URL(req.headers.origin || '').host
    } catch {
      /* absent/invalid origin */
    }
    if (!host || originHost !== host)
      throw new MusicError('请从歌日和页面发起请求。', 403)
    const ip = String(
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
    )
      .split(',')[0]
      .trim()
    const now = Date.now()
    for (const [key, bucket] of buckets)
      if (now - bucket.time > 60000) buckets.delete(key)
    const bucket = buckets.get(ip) || { time: now, count: 0 }
    bucket.count++
    buckets.set(ip, bucket)
    if (bucket.count > 40) {
      res.setHeader('Retry-After', '60')
      throw new MusicError('请求太频繁，请稍后再试。', 429)
    }
    const body = await readBody(req)
    const action = body.action
    if (
      ![
        'search',
        'lyrics',
        'playback',
        'qr',
        'poll',
        'logout',
        'report',
        'webQr',
        'webPoll',
        'webLogout',
      ].includes(String(action))
    )
      throw new MusicError('未知操作。', 400)
    if (action === 'logout') {
      clearUser()
      return send({ loggedIn: false })
    }
    if (['webQr', 'webPoll', 'webLogout'].includes(String(action))) {
      if (env.NETEASE_PLAYBACK_PROVIDER !== 'hybrid')
        throw new MusicError('当前服务没有启用网页播放。', 403)
      if (action === 'webLogout') {
        clearWeb()
        delete session.playback
        save()
        return send({ webLoggedIn: false })
      }
      if (!session.user) throw new MusicError('请先扫码连接网易云曲库。', 401)
      const result =
        action === 'webQr'
          ? await webQr(webSession, ip)
          : await webPoll(webSession, ip)
      saveWeb()
      return send(result)
    }
    const id = typeof body.songId === 'string' ? body.songId : ''
    if (
      ['lyrics', 'playback', 'report'].includes(String(action)) &&
      !idPattern.test(id)
    )
      throw new MusicError('歌曲编号不正确。', 400)
    if (
      action === 'search' &&
      (typeof body.keyword !== 'string' ||
        !body.keyword.trim() ||
        body.keyword.length > 100)
    )
      throw new MusicError('请输入 1–100 个字的歌曲或歌手名。', 400)
    if (!session.anonymous) {
      const result = await call(
        env,
        `${path}/oauth2/login/anonymous`,
        { clientId: env.NETEASE_APP_ID },
        session.deviceId,
        ip,
      )
      session.anonymous = token(result.data!)
      save()
    }
    const invoke = async (
      route: string,
      biz: Record<string, unknown>,
      anonymous = false,
    ) => {
      const run = () =>
        call(
          env,
          route,
          biz,
          session.deviceId,
          ip,
          anonymous
            ? session.anonymous!.accessToken
            : (session.user || session.anonymous)!.accessToken,
        )
      if (
        !anonymous &&
        session.user &&
        session.user.expires <= Date.now() + 60000
      ) {
        try {
          const r = await call(
            env,
            `${path}/user/oauth2/token/refresh/v2`,
            {
              clientId: env.NETEASE_APP_ID,
              clientSecret: env.NETEASE_APP_SECRET,
              refreshToken: session.user.refreshToken,
            },
            session.deviceId,
            ip,
            session.user.accessToken,
          )
          session.user = token(r.data!)
          save()
        } catch {
          clearUser()
          throw new MusicError('网易云授权已失效，请重新扫码登录。', 401)
        }
      }
      try {
        return await run()
      } catch (error) {
        if (
          error instanceof MusicError &&
          [1406, 1407, 1408].includes(error.code)
        ) {
          if (error.code === 1406 && session.user && !anonymous) {
            try {
              const r = await call(
                env,
                `${path}/user/oauth2/token/refresh/v2`,
                {
                  clientId: env.NETEASE_APP_ID,
                  clientSecret: env.NETEASE_APP_SECRET,
                  refreshToken: session.user.refreshToken,
                },
                session.deviceId,
                ip,
                session.user.accessToken,
              )
              session.user = token(r.data!)
              save()
              return await run()
            } catch {
              clearUser()
            }
          } else clearUser()
          throw new MusicError('网易云授权已失效，请重新扫码登录。', 401)
        }
        throw error
      }
    }
    if (action === 'qr') {
      const result = await invoke(
        `${path}/user/oauth2/qrcodekey/get/v2`,
        { type: 2, expiredKey: '300' },
        true,
      )
      const data = result.data!
      if (
        typeof data.uniKey !== 'string' ||
        typeof data.qrCodeUrl !== 'string' ||
        !/^https:\/\//.test(data.qrCodeUrl)
      )
        throw new MusicError('网易云没有返回有效的登录二维码。')
      session.pending = { key: data.uniKey, expires: Date.now() + 300000 }
      save()
      return send({ url: data.qrCodeUrl, expires: session.pending.expires })
    }
    if (action === 'poll') {
      if (!session.pending || session.pending.expires < Date.now())
        return send({ status: 800 })
      const result = await invoke(
        `${path}/oauth2/device/login/qrcode/get`,
        { key: session.pending.key, clientId: env.NETEASE_APP_ID },
        true,
      )
      const status = Number(result.data!.status)
      if (status === 803) {
        session.user = token(result.data!.accessToken)
        delete session.pending
        delete session.playback
        save()
      }
      if (status === 800) {
        delete session.pending
        save()
      }
      return send({ status })
    }
    if (action === 'search') {
      const offset = Number(body.offset ?? 0)
      if (!Number.isInteger(offset) || offset < 0 || offset > 1000)
        throw new MusicError('页码不正确。', 400)
      const result = await invoke(`${path}/search/song/get/v3`, {
        keyword: (body.keyword as string).trim(),
        limit: 12,
        offset,
      })
      return send({
        total: result.data!.recordCount,
        songs: (result.data!.records || []).map((s: Record<string, any>) => ({
          id: s.id,
          name: s.name,
          artists: (s.artists || [])
            .map((a: Record<string, string>) => a.name)
            .join(' / '),
          album: s.album?.name,
          duration: s.duration,
          cover: safeImage(s.coverImgUrl),
          visible: s.visible !== false,
          playable: s.playFlag === true,
          vip: s.vipFlag === true || s.vipPlayFlag === true,
          trial: s.freeTrailFlag === true,
          ticket: songTicket(
            {
              id: s.id,
              originalId: String(s.originalId),
              duration: Number(s.duration),
              visible: s.visible !== false,
            },
            secret,
          ),
        })),
      })
    }
    if (action === 'lyrics') {
      const result = await invoke(`${path}/song/lyric/get/v2`, { songId: id })
      const data = result.data!
      let words: Record<string, unknown> | null | undefined
      let wordTiming: 'missing' | 'restricted' | 'unavailable' = 'missing'
      try {
        words = (
          await invoke(`${path}/song/lyric/word/by/word/get`, { songId: id })
        ).data
      } catch (error) {
        // Optional word timing must not hide usable lyrics; expired authorization still propagates.
        if (error instanceof MusicError && error.code === 401) throw error
        wordTiming =
          error instanceof MusicError && error.code === 300
            ? 'restricted'
            : 'unavailable'
      }
      const wordLines = parseWordLyrics(words?.lyrics)
      return send({
        lyric: typeof data.lyric === 'string' ? data.lyric : '',
        translation: typeof data.transLyric === 'string' ? data.transLyric : '',
        romaji: typeof data.romalrc === 'string' ? data.romalrc : '',
        pureMusic: !!data.pureMusic,
        noLyric: !!data.noLyric,
        wordLines,
        wordTiming: wordLines.length ? 'available' : wordTiming,
        wordTranslation: typeof words?.ytlrcs === 'string' ? words.ytlrcs : '',
      })
    }
    if (action === 'playback') {
      delete session.playback
      save()
      const song = readSongTicket(body.ticket, id, secret)
      if (!song) throw new MusicError('歌曲信息已过期，请重新搜索。', 400)
      let result: Awaited<ReturnType<typeof call>>
      let source: 'official' | 'web' = 'official'
      try {
        if (!song.visible)
          throw new MusicError('当前官方应用没有此歌曲的播放版权。', 403)
        result = await invoke(`${path}/song/playurl/get/v2`, {
          songId: id,
          bitrate: 320,
        })
      } catch (error) {
        if (
          env.NETEASE_PLAYBACK_PROVIDER !== 'hybrid' ||
          !(error instanceof MusicError) ||
          ![300, 403].includes(error.code)
        )
          throw error
        try {
          const track = await webPlayback(
            song.originalId,
            session.deviceId,
            ip,
            webLoggedIn ? webSession.web!.cookies : undefined,
          )
          result = { code: 200, data: track }
        } catch (error) {
          if (error instanceof WebAuthorizationError) clearWeb()
          throw error
        }
        source = 'web'
      }
      const data = result.data!
      const messages: Record<string, string> = {
        '10003': '这首歌在当前应用没有播放版权，请在网易云音乐中收听。',
        '10004':
          '这首歌需要网易云会员或单独购买，请先扫码登录或在网易云完成购买。',
      }
      if (!data.url)
        throw new MusicError(
          messages[String(result.subCode)] ||
            '网易云没有提供可播放地址，请稍后重试。',
          403,
        )
      const url = safeImage(data.url)
      if (!url) throw new MusicError('网易云返回的播放地址不受支持。')
      const duration = song.duration
      if (!Number.isFinite(duration) || duration <= 0 || duration > 3600000)
        throw new MusicError('歌曲时长不正确。', 400)
      const trial = data.freeTrail || data.freeTrial
      const validTrial =
        trial &&
        Number.isFinite(Number(trial.start)) &&
        Number.isFinite(Number(trial.end)) &&
        Number(trial.end) > Number(trial.start)
          ? { start: Number(trial.start), end: Number(trial.end) }
          : undefined
      if (trial && !validTrial)
        throw new MusicError('网易云返回的试听范围不正确。')
      session.playback = {
        source,
        id,
        duration: duration / 1000,
        bitrate:
          Number(data.br) > 1000
            ? Number(data.br) / 1000
            : Number(data.br) || 320,
        trial: validTrial,
        expires: Date.now() + 25 * 60000,
      }
      save()
      return send({
        url,
        trial: validTrial,
        expires: session.playback.expires,
        source,
      })
    }
    if (action === 'report') {
      const playback = session.playback
      if (!playback || playback.id !== id || playback.expires < Date.now())
        throw new MusicError('播放会话已失效，请重新选择歌曲。', 400)
      // Official playback statistics belong to the official playback permission context.
      // A web guest preview must not be attributed to the user's official OAuth account.
      if (playback.source === 'web') return send({ ok: true })
      if (!['startplay', 'play'].includes(String(body.event)))
        throw new MusicError('播放事件不正确。', 400)
      const start = Number(body.start),
        seconds = Number(body.seconds || 0)
      if (
        !Number.isFinite(start) ||
        start > Date.now() + 10000 ||
        start < Date.now() - 86400000 ||
        !Number.isFinite(seconds) ||
        seconds < 0
      )
        throw new MusicError('播放记录不正确。', 400)
      const end = ['playend', 'ui', 'exception', 'interrupt'].includes(
        String(body.end),
      )
        ? body.end
        : 'ui'
      const biz: Record<string, unknown> = {
        id,
        action: body.event,
        type: 'song',
        file: 4,
        bitrate: playback.bitrate,
        startLogTime: start,
        alg: 'search',
        sourceId: 'search',
        sourceType: 'search',
      }
      if (body.event === 'play') {
        biz.time = Math.min(seconds, playback.duration)
        biz.end = end
        if (seconds === 0) return send({ ok: true })
      }
      if (playback.trial)
        Object.assign(biz, {
          isAudition: 1,
          auditionStart: playback.trial.start,
          auditionEnd: playback.trial.end,
        })
      await invoke(`${path}/play/data/record`, biz)
      return send({ ok: true })
    }
  } catch (error) {
    if (error instanceof MusicError)
      return send(
        { error: error.message },
        error.code >= 400 && error.code < 600 ? error.code : 502,
      )
    return send({ error: '网易云请求未完成，请稍后重试。' }, 502)
  }
}
