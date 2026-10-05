import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  favoriteMetadata,
  parseFavorites,
  resolveFavorite,
} from '#lib/music-favorites'
import type { MusicSong } from '#music'

const song: MusicSong = {
  id: 'abc123',
  name: 'spiral',
  artists: 'LONGMAN',
  duration: 230000,
  ticket: 'fresh-ticket',
  visible: true,
  playable: true,
  vip: true,
  trial: false,
}

test('favorites keep metadata only and reject corrupt or unsafe stored entries', () => {
  const metadata = favoriteMetadata(song)
  assert.equal('ticket' in metadata, false)
  const rows = parseFavorites(
    JSON.stringify([
      song,
      song,
      { ...song, id: '../../bad' },
      { ...song, id: 'other', duration: '300' },
      { ...song, id: 'cover', cover: 'javascript:alert(1)' },
    ]),
  )
  assert.equal(rows.length, 2)
  assert.equal('ticket' in rows[0], false)
  assert.equal(rows[1].cover, undefined)
  assert.throws(() => parseFavorites('{broken'))
  assert.throws(() => parseFavorites('{}'))
})

test('opening a favorite retrieves a fresh signed result and matches its exact ID', async () => {
  const offsets: number[] = []
  const fresh = await resolveFavorite(
    song,
    async (_keyword, offset) => {
      offsets.push(offset)
      return {
        total: 13,
        songs:
          offset === 0
            ? [{ ...song, id: 'wrong', ticket: 'wrong-ticket' }]
            : [{ ...song, ticket: 'new-ticket' }],
      }
    },
    new AbortController().signal,
  )
  assert.deepEqual(offsets, [0, 12])
  assert.equal(fresh.ticket, 'new-ticket')
})

test('favorite resolution is bounded and abortable; missing songs never substitute another version', async () => {
  let calls = 0
  await assert.rejects(
    resolveFavorite(
      song,
      async () => {
        calls++
        return { total: 1000, songs: [{ ...song, id: 'wrong' }] }
      },
      new AbortController().signal,
    ),
    /暂时无法/,
  )
  assert.equal(calls, 6)
  const controller = new AbortController()
  await assert.rejects(
    resolveFavorite(
      song,
      async () => {
        controller.abort()
        return { songs: [song], total: 1 }
      },
      controller.signal,
    ),
    { name: 'AbortError' },
  )
})
