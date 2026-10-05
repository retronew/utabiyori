/// <reference path="./vendor.d.ts" />
import { createHash } from 'node:crypto'
import encrypt from '@neteasecloudmusicapienhanced/api/util/crypto.js'
import { MusicError } from '#client'

export interface WebCookies {
  MUSIC_U?: string
  __csrf?: string
}
interface WebResult {
  code: number
  unikey?: string
  data?: Record<string, any>[]
}
export class WebAuthorizationError extends MusicError {
  constructor() {
    super('网页播放登录已失效，请重新扫码连接网页播放账号。', 403)
  }
}
export async function webCall(
  route: string,
  data: Record<string, unknown>,
  deviceId: string,
  ip: string,
  auth: WebCookies = {},
) {
  const cookie = {
    ...auth,
    deviceId,
    os: 'pc',
    appver: '3.1.3.203419',
    __remember_me: 'true',
    _ntes_nuid: createHash('sha256').update(deviceId).digest('hex'),
    WEVNSM: '1.0.0',
  }
  let response: Response
  try {
    response = await fetch(`https://music.163.com/weapi/${route.slice(5)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://music.163.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Cookie: Object.entries(cookie)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('; '),
        ...(ip ? { 'X-Real-IP': ip, 'X-Forwarded-For': ip } : {}),
      },
      body: new URLSearchParams(
        encrypt.weapi({ ...data, csrf_token: auth.__csrf || '' }),
      ),
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    throw new MusicError('网易云网页接口暂时无法连接，请稍后重试。')
  }
  if (!response.ok) throw new MusicError('网易云网页接口暂时无法响应。')
  let body: WebResult
  try {
    body = (await response.json()) as WebResult
  } catch {
    throw new MusicError('网易云网页接口没有返回有效数据。')
  }
  if (body.code === 301) throw new WebAuthorizationError()
  if (![200, 800, 801, 802, 803].includes(Number(body.code)))
    throw new MusicError('网易云网页接口未完成请求，请稍后重试。')
  const cookies: WebCookies = {}
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(';')[0]!
    const split = pair.indexOf('=')
    const name = pair.slice(0, split)
    if (name !== 'MUSIC_U' && name !== '__csrf') continue
    const value = pair.slice(split + 1)
    if (!value || value.length > (name === 'MUSIC_U' ? 1800 : 128))
      throw new MusicError('网易云返回的网页登录信息不正确。')
    cookies[name] = value
  }
  return { body, cookies }
}
