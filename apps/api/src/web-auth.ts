import { MusicError } from './client.ts'
import { webCall } from './web-client.ts'
import type { Session } from './session.ts'

export async function webQr(session: Session, ip: string) {
  const result = await webCall(
    '/api/login/qrcode/unikey',
    { type: 3 },
    session.deviceId,
    ip,
  )
  const key = result.body.unikey
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(key))
    throw new MusicError('网易云没有返回有效的网页登录二维码。')
  session.webPending = { key, expires: Date.now() + 300000 }
  return {
    url: `https://music.163.com/login?codekey=${encodeURIComponent(key)}`,
    expires: session.webPending.expires,
  }
}
export async function webPoll(session: Session, ip: string) {
  if (!session.webPending || session.webPending.expires < Date.now()) {
    delete session.webPending
    return { status: 800 }
  }
  const result = await webCall(
    '/api/login/qrcode/client/login',
    { key: session.webPending.key, type: 3 },
    session.deviceId,
    ip,
  )
  const status = Number(result.body.code)
  if (status === 803) {
    if (!result.cookies.MUSIC_U)
      throw new MusicError('网页登录没有返回有效会话，请重新生成二维码。')
    session.web = {
      cookies: result.cookies,
      expires: Date.now() + 7 * 86400000,
    }
    delete session.webPending
  }
  if (status === 800) delete session.webPending
  return { status }
}
