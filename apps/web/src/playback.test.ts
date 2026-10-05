import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLineRange } from '#lib/music-playback'
import { formatTime } from '#lib/media'

const lines = [
  { time: 6, text: 'first' },
  { time: 6, text: 'repeated timestamp' },
  { time: 10, text: '' },
  { time: 14, text: 'last' },
]

test('line loops stop at silent boundaries and skip duplicate timestamps', () => {
  assert.deepEqual(getLineRange(lines, 0, 20), {
    start: 6,
    end: 10,
    available: true,
  })
  assert.deepEqual(getLineRange(lines, 1, 20), {
    start: 6,
    end: 10,
    available: true,
  })
  assert.deepEqual(getLineRange(lines, 3, 20), {
    start: 14,
    end: 20,
    available: true,
  })
})

test('trial clips loops and excludes lines outside the playable interval', () => {
  const trial = { start: 6, end: 16 }
  assert.deepEqual(getLineRange(lines, 3, 20, trial), {
    start: 14,
    end: 16,
    available: true,
  })
  assert.equal(
    getLineRange(lines, 0, 20, { start: 8, end: 16 }).available,
    false,
  )
  assert.equal(
    getLineRange(lines, 3, 20, { start: 0, end: 14 }).available,
    false,
  )
  assert.equal(
    getLineRange([{ time: 20, text: 'end' }], 0, 20).available,
    false,
  )
})

test('media time formatting safely handles unavailable and negative durations', () => {
  assert.equal(formatTime(NaN), '0:00')
  assert.equal(formatTime(Infinity), '0:00')
  assert.equal(formatTime(-1), '0:00')
  assert.equal(formatTime(61.9), '1:01')
})
