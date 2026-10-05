import { isMusicQuality } from '@jp-learn/shared'
import type { MusicQuality } from '@jp-learn/shared'
import { MusicError } from '#client'
import { webCall } from '#web-client'
import type { WebCookies } from '#web-client'

interface WebTrack {
  id: number
  url: string | null
  br: number
  freeTrialInfo?: { start: number; end: number } | null
  code?: number
  fee?: number
  level?: unknown
  type?: unknown
}
export async function webPlayback(
  originalId: string,
  deviceId: string,
  ip: string,
  cookies: WebCookies = {},
  quality: MusicQuality = 'standard',
) {
  try {
    const result = await webCall(
      '/api/song/enhance/player/url/v1',
      { ids: `[${originalId}]`, level: quality, encodeType: 'flac' },
      deviceId,
      ip,
      cookies,
    )
    const track = result.body.data?.find((s) => String(s.id) === originalId) as
      WebTrack | undefined
    if (result.body.code !== 200 || !track?.url)
      throw new MusicError(
        cookies.MUSIC_U
          ? '网易云未向当前网页登录账号提供此歌曲音频，可能受歌曲版权、会员权益或服务所在地区限制。'
          : '游客播放未获得音频，请连接网页播放账号以使用你的会员或购买权限；歌曲也可能受服务所在地区限制。',
        403,
      )
    return {
      url: track.url,
      br: track.br,
      freeTrail: track.freeTrialInfo,
      level: isMusicQuality(track.level) ? track.level : undefined,
      codec:
        typeof track.type === 'string' &&
        /^(mp3|flac|aac|m4a|wav|ogg)$/i.test(track.type)
          ? track.type.toUpperCase()
          : undefined,
    }
  } catch (error) {
    if (error instanceof MusicError) throw error
    throw new MusicError('网易云网页播放接口暂时不可用，请稍后重试。')
  }
}
