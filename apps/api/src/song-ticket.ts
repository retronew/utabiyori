import { createHmac, timingSafeEqual } from 'node:crypto'
export interface SongTicket {
  id: string
  originalId: string
  duration: number
  visible: boolean
  expires: number
}
export function songTicket(song: Omit<SongTicket, 'expires'>, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({ ...song, expires: Date.now() + 3600000 }),
  ).toString('base64url')
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}
export function readSongTicket(
  ticket: unknown,
  id: string,
  secret: string,
): SongTicket | undefined {
  try {
    if (typeof ticket !== 'string' || ticket.length > 1000) return
    const [payload, signature, ...rest] = ticket.split('.')
    if (rest.length || !signature) return
    const expected = createHmac('sha256', secret).update(payload).digest()
    const given = Buffer.from(signature, 'base64url')
    if (given.length !== expected.length || !timingSafeEqual(given, expected))
      return
    const data: SongTicket = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    )
    if (
      data.id !== id ||
      !/^\d{1,16}$/.test(data.originalId) ||
      !Number.isFinite(data.duration) ||
      data.duration <= 0 ||
      data.expires < Date.now()
    )
      return
    return data
  } catch {
    return
  }
}
