import { test } from 'node:test'
import assert from 'node:assert/strict'
import { completion, progressKey, validLoop, isSong } from '#index'
import type { Song } from '#index'
import { readFileSync } from 'node:fs'

test('import validates nested content and rejects duplicate line IDs', () => {
  const sample = JSON.parse(
    readFileSync(
      new URL('../../../apps/web/public/lesson-template.json', import.meta.url),
      'utf8',
    ),
  )
  assert.equal(isSong(sample), true)
  assert.equal(isSong({ ...sample, lines: [] }), false)
  assert.equal(isSong({ ...sample, id: 'bad:key' }), false)
  assert.equal(
    isSong({ ...sample, lines: [sample.lines[0], sample.lines[0]] }),
    false,
  )
  assert.equal(
    isSong({
      ...sample,
      lines: [{ ...sample.lines[0], tokens: [{ text: 42 }] }],
    }),
    false,
  )
})

test('progress is isolated between songs and empty lessons are safe', () => {
  const song = { id: 'a', lines: [{ id: '1' }, { id: '2' }] } as Song
  assert.equal(
    completion(song, {
      [progressKey('a', '1')]: true,
      [progressKey('b', '2')]: true,
    }),
    50,
  )
  assert.equal(completion({ ...song, lines: [] }, {}), 0)
})
test('loop rejects reversed, missing and out of range boundaries', () => {
  assert.equal(validLoop(1, 4, 5), true)
  for (const [a, b, d] of [
    [4, 1, 5],
    [-1, 3, 5],
    [1, 6, 5],
    [1, 1, 5],
    [0, NaN, 5],
    [0, 1, Infinity],
  ]) {
    assert.equal(validLoop(a, b, d), false)
  }
})
