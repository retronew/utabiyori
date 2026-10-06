export { parseWordLyrics } from '#word-lyrics'
export type { TimedWord, WordLyricLine } from '#word-lyrics'

export interface LyricToken {
  text: string
  reading?: string
}
export interface LyricLine {
  id: string
  tokens: LyricToken[]
  kana: string
  romaji: string
  translation: string
  tip: string
  focus: { kana: string; romaji: string; example: string }[]
}
export interface Song {
  id: string
  title: string
  subtitle: string
  description: string
  theme: 'sage' | 'peach' | 'lavender'
  lines: LyricLine[]
}
export type Progress = Record<string, boolean>
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function isText(value: unknown): value is string {
  return (
    typeof value === 'string' && value.trim().length > 0 && value.length <= 2000
  )
}
function isId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
}
export function isSong(value: unknown): value is Song {
  if (!isRecord(value) || !isId(value.id)) return false
  if (![value.title, value.subtitle, value.description].every(isText))
    return false
  if (!['sage', 'peach', 'lavender'].includes(String(value.theme))) return false
  if (
    !Array.isArray(value.lines) ||
    value.lines.length === 0 ||
    value.lines.length > 200
  )
    return false
  const ids = new Set<string>()
  return value.lines.every((line) => {
    if (!isRecord(line) || !isId(line.id) || ids.has(line.id)) return false
    ids.add(line.id)
    if (![line.kana, line.romaji, line.translation, line.tip].every(isText))
      return false
    if (
      !Array.isArray(line.tokens) ||
      !line.tokens.length ||
      line.tokens.length > 100 ||
      !line.tokens.every(
        (token) =>
          isRecord(token) &&
          isText(token.text) &&
          (token.reading === undefined || isText(token.reading)),
      )
    )
      return false
    return (
      Array.isArray(line.focus) &&
      line.focus.length > 0 &&
      line.focus.length <= 10 &&
      line.focus.every(
        (item) =>
          isRecord(item) &&
          [item.kana, item.romaji, item.example].every(isText),
      )
    )
  })
}
export function progressKey(songId: string, lineId: string): string {
  return `${songId}:${lineId}`
}
export function completion(song: Song, progress: Progress): number {
  if (!song.lines.length) return 0
  return Math.round(
    (song.lines.filter((line) => progress[progressKey(song.id, line.id)])
      .length /
      song.lines.length) *
      100,
  )
}
export function validLoop(
  start: number,
  end: number,
  duration: number,
): boolean {
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(duration) &&
    start >= 0 &&
    end > start &&
    end <= duration
  )
}
export { MUSIC_QUALITIES, isMusicQuality } from '#music-quality'
export type { MusicQuality } from '#music-quality'
export {
  emptyAccountData,
  parseAccountData,
  parseAccountOperation,
  mergeAccountData,
  applyAccountOperation,
  favoriteData,
  lessonData,
  validTheme,
  record,
  accountDataLimit,
} from '#account'
export type {
  AccountData,
  AccountTheme,
  AccountUser,
  AccountSnapshot,
  AccountOperation,
  PendingOperation,
  FavoriteSong,
} from '#account'
