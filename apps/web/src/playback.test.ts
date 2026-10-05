import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLineRange, getPlaybackStep } from '#lib/music-playback'
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

test('a clipped line repeats at the trial boundary instead of ending playback', () => {
  const trial = { start: 6, end: 8 }
  const range = getLineRange(lines, 0, 20, trial)
  for (const time of [8, 8.3])
    assert.deepEqual(getPlaybackStep(time, range, true, trial), {
      position: 6,
      ended: false,
    })
  assert.deepEqual(getPlaybackStep(8, range, false, trial), {
    position: 6,
    ended: true,
  })
})

test('last-line loops rewind at the real media end and reject unavailable trial lines', () => {
  const range = getLineRange(lines, 3, 18)
  assert.deepEqual(getPlaybackStep(18, range, true), {
    position: 14,
    ended: false,
  })
  const trial = { start: 6, end: 12 }
  const unavailable = getLineRange(lines, 3, 18, trial)
  assert.deepEqual(getPlaybackStep(12, unavailable, true, trial), {
    position: 6,
    ended: true,
  })
})

test('loop seeks stay inside the selected line and ordinary playback retains its position', () => {
  const range = getLineRange(lines, 3, 20)
  assert.deepEqual(getPlaybackStep(10, range, true), {
    position: 14,
    ended: false,
  })
  assert.deepEqual(getPlaybackStep(16, range, true), {
    position: 16,
    ended: false,
  })
  assert.deepEqual(getPlaybackStep(10, range, false), {
    position: 10,
    ended: false,
  })
})
