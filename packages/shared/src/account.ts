import { isSong } from '#index'
import type { Progress, Song } from '#index'

export interface FavoriteSong {
  id: string
  name: string
  artists: string
  duration: number
  album?: string
  cover?: string
}
export interface AccountTheme {
  mode: 'system' | 'light' | 'dark'
  color: string
}
export interface AccountData {
  progress: Progress
  lessons: Song[]
  favorites: FavoriteSong[]
  theme: AccountTheme | null
}
export interface AccountUser {
  id: string
  name: string
}
export interface AccountSnapshot {
  data: AccountData
  revision: number
}
export type AccountOperation =
  | { kind: 'progress'; key: string; mastered: boolean }
  | { kind: 'favorite'; song: FavoriteSong; saved: boolean }
  | { kind: 'lesson'; song: Song }
  | { kind: 'theme'; theme: AccountTheme }
  | { kind: 'import'; data: AccountData }
export interface PendingOperation {
  id: string
  operation: AccountOperation
}
export function parseAccountOperation(value: unknown): AccountOperation {
  if (!record(value)) throw new Error('待同步记录损坏。')
  switch (value.kind) {
    case 'progress':
      if (
        typeof value.key === 'string' &&
        /^[a-zA-Z0-9_-]{1,80}:[a-zA-Z0-9_-]{1,80}$/.test(value.key) &&
        typeof value.mastered === 'boolean'
      )
        return { kind: 'progress', key: value.key, mastered: value.mastered }
      break
    case 'favorite':
      if (typeof value.saved === 'boolean')
        return {
          kind: 'favorite',
          song: favoriteData(value.song),
          saved: value.saved,
        }
      break
    case 'lesson':
      return { kind: 'lesson', song: lessonData(value.song) }
    case 'theme':
      if (validTheme(value.theme))
        return {
          kind: 'theme',
          theme: { mode: value.theme.mode, color: value.theme.color },
        }
      break
    case 'import':
      return { kind: 'import', data: parseAccountData(value.data) }
  }
  throw new Error('待同步记录损坏。')
}
export const accountDataLimit = 2 * 1024 * 1024
export const emptyAccountData = (): AccountData => ({
  progress: {},
  lessons: [],
  favorites: [],
  theme: null,
})
export function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
export function validTheme(value: unknown): value is AccountTheme {
  return (
    record(value) &&
    ['system', 'light', 'dark'].includes(String(value.mode)) &&
    typeof value.color === 'string' &&
    /^#[a-f\d]{6}$/i.test(value.color)
  )
}
export function favoriteData(value: unknown): FavoriteSong {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !/^[a-zA-Z0-9]{1,64}$/.test(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 500 ||
    typeof value.artists !== 'string' ||
    value.artists.length > 500 ||
    typeof value.duration !== 'number' ||
    !Number.isFinite(value.duration) ||
    value.duration < 0
  )
    throw new Error('收藏数据不正确。')
  return {
    id: value.id,
    name: value.name,
    artists: value.artists,
    duration: value.duration,
    ...(typeof value.album === 'string'
      ? { album: value.album.slice(0, 500) }
      : {}),
    ...(typeof value.cover === 'string' && /^https:\/\//.test(value.cover)
      ? { cover: value.cover.slice(0, 2000) }
      : {}),
  }
}
export function lessonData(value: unknown): Song {
  if (!isSong(value)) throw new Error('课程数据不正确。')
  return {
    id: value.id,
    title: value.title,
    subtitle: value.subtitle,
    description: value.description,
    theme: value.theme,
    lines: value.lines.map((line) => ({
      id: line.id,
      kana: line.kana,
      romaji: line.romaji,
      translation: line.translation,
      tip: line.tip,
      tokens: line.tokens.map((token) => ({
        text: token.text,
        ...(token.reading ? { reading: token.reading } : {}),
      })),
      focus: line.focus.map((item) => ({
        kana: item.kana,
        romaji: item.romaji,
        example: item.example,
      })),
    })),
  }
}
export function parseAccountData(value: unknown): AccountData {
  if (
    !record(value) ||
    !record(value.progress) ||
    !Array.isArray(value.lessons) ||
    value.lessons.length > 50 ||
    !Array.isArray(value.favorites) ||
    value.favorites.length > 500 ||
    !(value.theme === null || validTheme(value.theme))
  )
    throw new Error('账号数据格式不正确。')
  const entries = Object.entries(value.progress)
  if (
    entries.length > 10000 ||
    entries.some(
      ([key, mastered]) =>
        !/^[a-zA-Z0-9_-]{1,80}:[a-zA-Z0-9_-]{1,80}$/.test(key) ||
        typeof mastered !== 'boolean',
    )
  )
    throw new Error('学习进度格式不正确。')
  const data: AccountData = {
    progress: Object.fromEntries(entries) as Progress,
    lessons: value.lessons.map(lessonData),
    favorites: value.favorites.map(favoriteData),
    theme:
      value.theme === null
        ? null
        : { mode: value.theme.mode, color: value.theme.color.toLowerCase() },
  }
  if (
    new Set(data.lessons.map((x) => x.id)).size !== data.lessons.length ||
    new Set(data.favorites.map((x) => x.id)).size !== data.favorites.length
  )
    throw new Error('账号数据包含重复编号。')
  if (new TextEncoder().encode(JSON.stringify(data)).length > accountDataLimit)
    throw new Error('账号数据超过 2 MB，请减少导入课程。')
  return data
}
function importedId(song: Song) {
  let hash = 2166136261
  for (const char of JSON.stringify(song))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `${song.id.slice(0, 60)}_import_${(hash >>> 0).toString(16)}`
}
export function mergeAccountData(
  cloud: AccountData,
  local: AccountData,
): AccountData {
  const lessons = [...cloud.lessons]
  const remap = new Map<string, string>()
  for (const song of local.lessons) {
    const existing = lessons.find((x) => x.id === song.id)
    if (!existing) lessons.push(song)
    else if (JSON.stringify(existing) !== JSON.stringify(song)) {
      const id = importedId(song)
      const collision = lessons.find((x) => x.id === id)
      if (
        collision &&
        JSON.stringify(collision) !== JSON.stringify({ ...song, id })
      )
        throw new Error('课程编号冲突，请修改课程编号后重新导入。')
      if (!collision) lessons.push({ ...song, id })
      remap.set(song.id, id)
    }
  }
  const progress = { ...cloud.progress }
  for (const [key, mastered] of Object.entries(local.progress)) {
    const [song, line] = key.split(':')
    const target = `${remap.get(song) ?? song}:${line}`
    if (!Object.hasOwn(progress, target)) progress[target] = mastered
  }
  return parseAccountData({
    progress,
    lessons,
    favorites: [
      ...cloud.favorites,
      ...local.favorites.filter(
        (song) => !cloud.favorites.some((x) => x.id === song.id),
      ),
    ],
    theme: cloud.theme ?? local.theme,
  })
}
export function applyAccountOperation(
  data: AccountData,
  operation: AccountOperation,
): AccountData {
  switch (operation.kind) {
    case 'progress':
      return parseAccountData({
        ...data,
        progress: { ...data.progress, [operation.key]: operation.mastered },
      })
    case 'favorite':
      return parseAccountData({
        ...data,
        favorites: operation.saved
          ? [
              favoriteData(operation.song),
              ...data.favorites.filter((x) => x.id !== operation.song.id),
            ]
          : data.favorites.filter((x) => x.id !== operation.song.id),
      })
    case 'lesson': {
      const song = lessonData(operation.song)
      const existing = data.lessons.find((x) => x.id === song.id)
      if (existing && JSON.stringify(existing) !== JSON.stringify(song))
        throw new Error('课程编号冲突，请修改编号后导入。')
      return parseAccountData({
        ...data,
        lessons: existing ? data.lessons : [...data.lessons, song],
      })
    }
    case 'theme':
      return parseAccountData({ ...data, theme: operation.theme })
    case 'import':
      return mergeAccountData(data, operation.data)
  }
}
