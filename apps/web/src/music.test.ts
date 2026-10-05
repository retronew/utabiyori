import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeLyrics, parseLrc } from '#music'

test('LRC supports repeated timestamps, fractional seconds, offsets, and silent boundaries', () => {
  const rows = parseLrc(
    '[ar:test]\n[offset:-100]\n[00:01.50][00:05.500]好き\n[00:03.00]\n[00:09.00]歌',
  )
  assert.deepEqual(rows, [
    { time: 1.4, text: '好き' },
    { time: 2.9, text: '' },
    { time: 5.4, text: '好き' },
    { time: 8.9, text: '歌' },
  ])
})
test('translation and romaji follow the original timeline without inventing missing lyrics', () => {
  const rows = mergeLyrics(
    '[00:01.00]好き\n[00:03.00]歌',
    '[00:01.02]喜欢',
    '[00:01.00]suki',
  )
  assert.equal(rows[0].translation, '喜欢')
  assert.equal(rows[0].romaji, 'suki')
  assert.equal(rows[1].translation, undefined)
  assert.equal(rows[1].romaji, undefined)
  assert.deepEqual(parseLrc('unsynchronized text'), [])
})
