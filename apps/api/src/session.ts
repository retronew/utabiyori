import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

export interface Token {
  accessToken: string
  refreshToken: string
  expires: number
}
export interface Session {
  deviceId: string
  oauth?: {
    state: string
    nonce: string
    verifier: string
    origin: string
    expires: number
  }
  web?: {
    cookies: { MUSIC_U?: string; __csrf?: string }
    expires: number
  }
  webPending?: { key: string; expires: number }
  anonymous?: Token
  user?: Token
  pending?: { key: string; expires: number }
  playback?: {
    source: 'official' | 'web'
    id: string
    duration: number
    bitrate: number
    trial?: { start: number; end: number }
    expires: number
  }
}
export function seal(value: Session, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(
    'aes-256-gcm',
    createHash('sha256').update(secret).digest(),
    iv,
  )
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    'base64url',
  )
}
export function unseal(value: string, secret: string): Session | undefined {
  try {
    if (value.length > 6500) return
    const bytes = Buffer.from(value, 'base64url')
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(secret).digest(),
      bytes.subarray(0, 12),
    )
    decipher.setAuthTag(bytes.subarray(12, 28))
    const session: Session = JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString('utf8'),
    )
    if (!/^[a-f0-9]{32}$/.test(session.deviceId)) return
    return session
  } catch {
    return
  }
}
export function token(value: Record<string, unknown>): Token {
  if (
    typeof value.accessToken !== 'string' ||
    value.accessToken === 'null' ||
    !value.accessToken ||
    typeof value.refreshToken !== 'string'
  )
    throw new Error('Invalid token response')
  const seconds = Number(value.expireTime ?? value.expiresTime)
  return {
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    expires:
      Date.now() +
      (Number.isFinite(seconds) && seconds > 0 ? seconds : 604800) * 1000,
  }
}
