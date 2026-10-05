import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toAmllLyrics } from '#lib/amll-lyrics'
import type { TimedLine } from '#music'

const options = { duration: 30, showRomaji: true, showTranslation: true }

test('AMLL receives integer milliseconds, official word gaps and separate learning text', () => {
  const lines: TimedLine[] = [
    {
      time: 1.125,
      end: 5,
      text: '好き',
      romaji: 'suki',
      translation: '喜欢',
      words: [
        { text: '好', start: 1.25, end: 2.5 },
        { text: 'き', start: 3, end: 4.5 },
      ],
    },
  ]
  const before = structuredClone(lines)
  const result = toAmllLyrics(lines, options)
  assert.deepEqual(result.lyricLines[0], {
    startTime: 1125,
    endTime: 5000,
    words: [
      { word: '好', startTime: 1250, endTime: 2500 },
      { word: 'き', startTime: 3000, endTime: 4500 },
    ],
    translatedLyric: '喜欢',
    romanLyric: 'suki',
    isBG: false,
    isDuet: false,
  })
  assert.deepEqual(lines, before)
  assert.deepEqual(result.sourceIndexes, [0])
})

test('LRC stays line-level and silent rows bound the preceding line without shifting click indexes', () => {
  const result = toAmllLyrics(
    [
      { time: 1, text: '歌' },
      { time: 3, text: '' },
      { time: 7, text: '後' },
    ],
    options,
  )
  assert.deepEqual(result.sourceIndexes, [0, 2])
  assert.deepEqual(result.lyricLines[0].words, [
    { word: '歌', startTime: 1000, endTime: 3000 },
  ])
  assert.equal(result.lyricLines[1].endTime, 30000)
})

test('AMLL validates ranges and words, clamps duration and hides text without mutating the original', () => {
  const result = toAmllLyrics(
    [
      { time: NaN, text: 'bad' },
      { time: -1, text: 'bad' },
      {
        time: 1,
        end: 3,
        text: '歌',
        words: [{ text: '歌', start: 0, end: 4 }],
        romaji: 'uta',
        translation: '歌曲',
      },
      { time: 20, end: 40, text: '最後' },
      { time: 40, text: 'outside' },
    ],
    { ...options, showRomaji: false, showTranslation: false },
  )
  assert.deepEqual(result.sourceIndexes, [2, 3])
  assert.equal(result.lyricLines[1].endTime, 30000)
  assert.deepEqual(result.lyricLines[0].words, [
    { word: '歌', startTime: 1000, endTime: 3000 },
  ])
  assert.equal(result.lyricLines[0].romanLyric, '')
  assert.equal(result.lyricLines[0].translatedLyric, '')
  assert.deepEqual(
    toAmllLyrics([{ time: 1, text: '歌' }], { ...options, duration: Infinity })
      .lyricLines,
    [],
  )
})
