import { createPrivateKey, sign } from 'node:crypto'

export type Environment = Record<string, string | undefined>
export class MusicError extends Error {
  code: number
  constructor(message: string, code = 502) {
    super(message)
    this.code = code
  }
}
export function signingContent(params: Record<string, string>) {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
}
export function privateKey(value: string) {
  const key = value.replace(/\\n/g, '\n').trim()
  return createPrivateKey(
    key.includes('BEGIN')
      ? key
      : `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`,
  )
}
export function configured(env: Environment) {
  return Boolean(
    env.NETEASE_APP_ID &&
    env.NETEASE_PRIVATE_KEY &&
    env.NETEASE_APP_SECRET &&
    env.NETEASE_SESSION_SECRET?.length &&
    env.NETEASE_SESSION_SECRET.length >= 32,
  )
}
// Endpoint and business fields are chosen by the server, never passed through from a browser.
export async function call(
  env: Environment,
  route: string,
  biz: Record<string, unknown>,
  deviceId: string,
  ip: string,
  accessToken?: string,
) {
  if (!configured(env))
    throw new MusicError('网易云服务尚未配置，请联系应用维护者。', 503)
  const params: Record<string, string> = {
    appId: env.NETEASE_APP_ID!,
    signType: 'RSA_SHA256',
    timestamp: String(Date.now()),
    device: JSON.stringify({
      deviceType: env.NETEASE_DEVICE_TYPE || 'openapi',
      os: env.NETEASE_DEVICE_OS || 'ncmcli',
      appVer: '0.1.0',
      channel: env.NETEASE_DEVICE_CHANNEL || 'ncmcli',
      brand: env.NETEASE_DEVICE_BRAND || 'ncmcli',
      model: 'utabiyori',
      deviceId,
      osVer: '1.0.0',
      clientIp: ip,
      netStatus: 'wifi',
    }),
    bizContent: JSON.stringify(biz),
  }
  if (accessToken) params.accessToken = accessToken
  params.sign = sign(
    'RSA-SHA256',
    Buffer.from(signingContent(params)),
    privateKey(env.NETEASE_PRIVATE_KEY!),
  ).toString('base64')
  let response: Response
  try {
    response = await fetch(`https://openapi.music.163.com${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(12000),
    })
  } catch {
    throw new MusicError('网易云暂时无法连接，请稍后重试。')
  }
  if (!response.ok) throw new MusicError('网易云暂时无法响应，请稍后重试。')
  const result = (await response.json()) as {
    code: number
    subCode?: string
    data?: Record<string, any>
  }
  if (Number(result.code) !== 200) {
    const code = Number(result.code)
    if (code === 301)
      throw new MusicError('请先扫码登录网易云，再使用曲库。', 401)
    if (code === 300)
      throw new MusicError('应用尚未获得这个网易云官方接口的访问权限。', 300)
    if ([1406, 1407, 1408].includes(code))
      throw new MusicError('网易云授权已失效，请重新扫码登录。', code)
    // Do not echo provider debug/message fields: they can contain tokens or signed request data.
    throw new MusicError(
      `网易云接口未通过（${Number.isFinite(code) ? code : '未知状态'}），请检查应用权限或稍后重试。`,
    )
  }
  return result
}
