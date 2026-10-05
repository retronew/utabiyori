import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeLyrics, parseLrc } from '#music'
import { parseWordLyrics } from '@jp-learn/shared'
import {
  lyricCharacterProgress,
  lyricCharacterTimings,
  lyricProgress,
} from '#lib/lyric-progress'

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

test('official word timestamps are absolute milliseconds and malformed rows are rejected', () => {
  const rows = parseWordLyrics([
    {
      start: 10000,
      duration: 3000,
      words: [
        { suspend: 10000, duration: 500, words: '好' },
        { suspend: 12000, duration: 1000, words: 'き' },
      ],
    },
    {
      start: 20000,
      duration: 1000,
      words: [{ suspend: 0, duration: 1000, words: 'bad offset' }],
    },
    {
      start: 30000,
      duration: 1000,
      words: [{ suspend: 30000, duration: 2000, words: 'outside line' }],
    },
    { start: NaN, duration: 1000, words: [] },
  ])
  assert.deepEqual(rows, [
    {
      start: 10,
      end: 13,
      words: [
        { text: '好', start: 10, end: 10.5 },
        { text: 'き', start: 12, end: 13 },
      ],
    },
  ])
  assert.deepEqual(parseWordLyrics(null), [])
})

test('word timeline retains romaji, word-aligned translation, and silence without interrupting words', () => {
  const words = [
    { start: 1.5, end: 3, words: [{ text: '好き', start: 1.5, end: 3 }] },
  ]
  const rows = mergeLyrics(
    '[00:01.00]好き\n[00:02.00]\n[00:04.00]',
    '[00:01.00]喜欢',
    '[00:01.00]suki',
    words,
    '[00:01.50]喜爱',
  )
  assert.equal(rows[0].time, 1.5)
  assert.equal(rows[0].romaji, 'suki')
  assert.equal(rows[0].translation, '喜爱')
  assert.equal(rows[0].words, words[0].words)
  assert.deepEqual(rows[1], {
    time: 4,
    text: '',
    translation: undefined,
    romaji: undefined,
  })
  assert.equal(rows.length, 2)
})

test('progress respects nonuniform word timing, gaps, seeking, and grapheme boundaries', () => {
  const chars = lyricCharacterTimings('が好き', 10, 14, [
    { text: 'が', start: 10, end: 11 },
    { text: '好き', start: 13, end: 14 },
  ])
  assert.equal(chars.length, 3)
  assert.equal(lyricCharacterProgress(10.5, chars[0]).fill, 0.5)
  assert.equal(lyricCharacterProgress(12, chars[1]).fill, 0)
  assert.equal(lyricCharacterProgress(13.25, chars[1]).fill, 0.5)
  assert.equal(lyricCharacterProgress(13.25, chars[0]).glow, 0)
  assert.equal(lyricCharacterProgress(9, chars[0]).fill, 0)
  assert.equal(lyricCharacterProgress(15, chars[2]).fill, 1)
  assert.equal(lyricProgress(Infinity, 1, 2), 0)
  assert.equal(lyricProgress(1, 2, 2), 0)
})

test('partial word data does not discard later usable line lyrics', () => {
  const rows = mergeLyrics('[00:01.00]前\n[00:10.00]後', '', '[00:10.00]ato', [
    { start: 1, end: 2, words: [{ text: '前', start: 1, end: 2 }] },
  ])
  assert.equal(rows.length, 2)
  assert.equal(rows[1].text, '後')
  assert.equal(rows[1].romaji, 'ato')
  assert.equal(rows[1].words, undefined)
})
