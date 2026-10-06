import { songs as builtInSongs } from '@jp-learn/content'
import {
  applyAccountOperation,
  emptyAccountData,
  parseAccountData,
  parseAccountOperation,
  record,
} from '@jp-learn/shared'
import type {
  AccountData,
  AccountSnapshot,
  PendingOperation,
} from '@jp-learn/shared'
import { readLibrary, libraryKey } from '#library'
import { favoritesKey, parseFavorites } from '#lib/music-favorites'
import { progressStorageKey, readProgress } from '#lib/progress'
import { parseTheme, themeStorageKey } from '#lib/theme'

export const accountCacheKey = (id: string) => `utabiyori:account:${id}:v1`
export interface AccountCache {
  base: AccountSnapshot
  pending: PendingOperation[]
  imported: boolean
}
export function readGuestData(): AccountData {
  const progress = Object.fromEntries(
    Object.entries(readProgress()).filter(([key]) =>
      /^[a-zA-Z0-9_-]{1,80}:[a-zA-Z0-9_-]{1,80}$/.test(key),
    ),
  )
  return parseAccountData({
    progress,
    lessons: readLibrary(),
    favorites: parseFavorites(localStorage.getItem(favoritesKey)),
    theme: localStorage.getItem(themeStorageKey)
      ? parseTheme(JSON.parse(localStorage.getItem(themeStorageKey)!))
      : null,
  })
}
export function writeGuestData(data: AccountData) {
  localStorage.setItem(progressStorageKey, JSON.stringify(data.progress))
  localStorage.setItem(libraryKey, JSON.stringify(data.lessons))
  localStorage.setItem(favoritesKey, JSON.stringify(data.favorites))
  if (data.theme)
    localStorage.setItem(themeStorageKey, JSON.stringify(data.theme))
}
export function cacheData(cache: AccountCache) {
  return cache.pending.reduce(
    (data, item) => applyAccountOperation(data, item.operation),
    cache.base.data,
  )
}
export function parseAccountCache(raw: string | null): AccountCache | null {
  if (!raw) return null
  const value: unknown = JSON.parse(raw)
  if (
    !record(value) ||
    !record(value.base) ||
    !Number.isSafeInteger(value.base.revision) ||
    Number(value.base.revision) < 0 ||
    !Array.isArray(value.pending) ||
    value.pending.length > 200 ||
    typeof value.imported !== 'boolean'
  )
    throw new Error('账号缓存损坏，原有数据未覆盖。')
  const pending: PendingOperation[] = []
  for (const item of value.pending) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !/^[a-f\d-]{36}$/i.test(item.id) ||
      !record(item.operation) ||
      !['progress', 'favorite', 'lesson', 'theme', 'import'].includes(
        String(item.operation.kind),
      )
    )
      throw new Error('待同步记录损坏。')
    pending.push({
      id: item.id,
      operation: parseAccountOperation(item.operation),
    })
  }
  const cache = {
    base: {
      data: validateCloudLessons(parseAccountData(value.base.data)),
      revision: Number(value.base.revision),
    },
    pending,
    imported: value.imported,
  }
  cacheData(cache)
  return cache
}
export function validateCloudLessons(data: AccountData) {
  if (
    data.lessons.some((song) =>
      builtInSongs.some((built) => built.id === song.id),
    )
  )
    throw new Error('云端课程编号与内置课程冲突。')
  return data
}
export const freshCache = (): AccountCache => ({
  base: { data: emptyAccountData(), revision: 0 },
  pending: [],
  imported: false,
})
