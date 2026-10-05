import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseProgress } from '#lib/progress'

test('stored progress retains boolean flags and discards malformed entries', () => {
  assert.deepEqual(
    parseProgress({
      'song:first': true,
      'song:second': false,
      string: 'true',
      number: 1,
      object: {},
    }),
    {
      'song:first': true,
      'song:second': false,
    },
  )
})

test('non-record storage values safely fall back to empty progress', () => {
  for (const value of [null, undefined, [], 'broken', 1, true])
    assert.deepEqual(parseProgress(value), {})
})
