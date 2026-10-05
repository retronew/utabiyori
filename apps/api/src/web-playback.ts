import { createRequire } from 'node:module'
import { existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MusicError } from './client.ts'

interface WebTrack {
  id: number
  url: string | null
  br: number
  freeTrialInfo?: { start: number; end: number } | null
}
type WebRequest = (
  route: string,
  data: Record<string, unknown>,
  options: Record<string, unknown>,
) => Promise<{ body: { code: number; data: WebTrack[] } }>
const require = createRequire(import.meta.url)
let request: WebRequest | undefined
export async function webPlayback(
  originalId: string,
  deviceId: string,
  ip: string,
) {
  if (!request) {
    // The SDK reads this guest-token cache on import. No named-account cookie is stored here.
    const file = join(tmpdir(), 'anonymous_token')
    if (!existsSync(file)) {
      try {
        writeFileSync(file, '', { flag: 'wx', mode: 0o600 })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
    }
    request =
      require('@neteasecloudmusicapienhanced/api/util/request.js') as WebRequest
  }
  try {
    const result = await request(
      '/api/song/enhance/player/url/v1',
      { ids: `[${originalId}]`, level: 'standard', encodeType: 'flac' },
      {
        crypto: 'weapi',
        cookie: { deviceId },
        realIP: ip,
        randomCNIP: false,
        timeout: 12000,
      },
    )
    const track = result.body.data?.find((s) => String(s.id) === originalId)
    if (result.body.code !== 200 || !track?.url)
      throw new MusicError(
        '网易云网页播放接口没有提供音频，可能需要网页版登录、会员或购买。',
        403,
      )
    return { url: track.url, br: track.br, freeTrail: track.freeTrialInfo }
  } catch (error) {
    if (error instanceof MusicError) throw error
    throw new MusicError('网易云网页播放接口暂时不可用，请稍后重试。')
  }
}
