export interface MusicSong {
  id: string
  ticket: string
  name: string
  artists: string
  album?: string
  duration: number
  cover?: string
  visible: boolean
  playable: boolean
  vip: boolean
  trial: boolean
}
export interface TimedLine {
  time: number
  text: string
  translation?: string
  romaji?: string
}
export class MusicRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
export function parseLrc(text: string): TimedLine[] {
  const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000
  const lines: TimedLine[] = []
  for (const row of text.split(/\r?\n/)) {
    const matches = [...row.matchAll(/\[(\d+):([0-5]?\d)(?:[.:](\d{1,3}))?\]/g)]
    const content = row.replace(/\[[^\]]*\]/g, '').trim()
    for (const m of matches)
      lines.push({
        time: Math.max(
          0,
          Number(m[1]) * 60 + Number(m[2]) + Number(`0.${m[3] || 0}`) + offset,
        ),
        text: content,
      })
  }
  // Empty timestamp rows are retained as boundaries, so a lyric does not loop across silence.
  return lines
    .sort((a, b) => a.time - b.time)
    .filter(
      (line, i, all) =>
        i === 0 ||
        line.time !== all[i - 1].time ||
        line.text !== all[i - 1].text,
    )
}
export function mergeLyrics(
  lyric: string,
  translation: string,
  romaji: string,
) {
  const translations = parseLrc(translation),
    romanized = parseLrc(romaji)
  const find = (rows: TimedLine[], time: number) =>
    rows.find((row) => Math.abs(row.time - time) < 0.08)?.text
  return parseLrc(lyric).map((row) => ({
    ...row,
    translation: find(translations, row.time),
    romaji: find(romanized, row.time),
  }))
}
export async function musicRequest<T>(
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch('/api/netease', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const result = await response.json()
  if (!response.ok)
    throw new MusicRequestError(
      result.error || '网易云请求未完成，请稍后重试。',
      response.status,
    )
  return result as T
}
