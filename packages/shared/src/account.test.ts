import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAccountOperation,
  emptyAccountData,
  mergeAccountData,
  parseAccountData,
  parseAccountOperation,
} from '#account'
import type { Song } from '#index'

const lesson: Song = {
  id: 'custom',
  title: '歌',
  subtitle: '練習',
  description: '説明',
  theme: 'sage',
  lines: [
    {
      id: 'first',
      kana: 'あ',
      romaji: 'a',
      translation: '啊',
      tip: '发音',
      tokens: [{ text: 'あ' }],
      focus: [{ kana: 'あ', romaji: 'a', example: 'あ' }],
    },
  ],
}
test('cloud documents strip tokens and reject invalid flags, duplicates and oversized data', () => {
  const favorite = {
    id: '1',
    name: 'song',
    artists: 'artist',
    duration: 1,
    ticket: 'secret',
    url: 'https://audio.invalid',
  }
  const parsed = parseAccountData({
    ...emptyAccountData(),
    favorites: [favorite],
  })
  assert.deepEqual(parsed.favorites, [
    { id: '1', name: 'song', artists: 'artist', duration: 1 },
  ])
  assert.throws(() =>
    parseAccountData({ ...parsed, progress: { 'custom:first': 'true' } }),
  )
  assert.throws(() =>
    parseAccountData({ ...parsed, favorites: [favorite, favorite] }),
  )
  assert.throws(() =>
    parseAccountOperation({ kind: 'favorite', song: favorite, saved: 'false' }),
  )
  assert.throws(() =>
    parseAccountData({ ...parsed, lessons: Array(51).fill(lesson) }),
  )
})
test('guest merge preserves cloud false flags and both versions of a conflicting lesson, and is repeatable', () => {
  const cloud = {
    ...emptyAccountData(),
    lessons: [lesson],
    progress: { 'custom:first': false },
    theme: { mode: 'dark' as const, color: '#123456' },
  }
  const local = {
    ...emptyAccountData(),
    lessons: [{ ...lesson, title: '別の歌' }],
    progress: { 'custom:first': true },
    theme: { mode: 'light' as const, color: '#ffffff' },
  }
  const merged = mergeAccountData(cloud, local)
  assert.equal(merged.lessons.length, 2)
  assert.equal(merged.progress['custom:first'], false)
  assert.equal(merged.progress[`${merged.lessons[1].id}:first`], true)
  assert.deepEqual(merged.theme, cloud.theme)
  assert.deepEqual(mergeAccountData(merged, local), merged)
})
test('explicit operations can undo progress and remove favorites without losing other devices changes', () => {
  const original = {
    ...emptyAccountData(),
    progress: { 'custom:first': true, 'other:line': true },
    favorites: [{ id: '1', name: 'song', artists: 'artist', duration: 1 }],
  }
  const changed = applyAccountOperation(original, {
    kind: 'progress',
    key: 'custom:first',
    mastered: false,
  })
  assert.equal(changed.progress['other:line'], true)
  const removed = applyAccountOperation(changed, {
    kind: 'favorite',
    song: original.favorites[0],
    saved: false,
  })
  assert.equal(removed.favorites.length, 0)
  assert.equal(original.progress['custom:first'], true)
})
