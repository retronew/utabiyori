import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canTogglePlayback } from '#lib/playback-shortcut'

const space = {
  key: ' ',
  repeat: false,
  isComposing: false,
  keyCode: 32,
  defaultPrevented: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
}

test('only a plain first space press outside protected controls toggles playback', () => {
  assert.equal(canTogglePlayback(space, false), true)
  assert.equal(canTogglePlayback(space, true), false)
  for (const property of [
    'repeat',
    'isComposing',
    'defaultPrevented',
    'altKey',
    'ctrlKey',
    'metaKey',
    'shiftKey',
  ]) {
    assert.equal(
      canTogglePlayback({ ...space, [property]: true }, false),
      false,
      property,
    )
  }
  assert.equal(canTogglePlayback({ ...space, keyCode: 229 }, false), false)
  assert.equal(canTogglePlayback({ ...space, key: 'Enter' }, false), false)
})
