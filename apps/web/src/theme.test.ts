import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeColor,
  parseTheme,
  defaultTheme,
  themePalette,
  contrast,
} from '#lib/theme'

test('custom colors normalize HEX and reject CSS expressions or incomplete input', () => {
  assert.equal(normalizeColor(' #AbC '), '#aabbcc')
  assert.equal(normalizeColor('#8B5CF6'), '#8b5cf6')
  for (const value of ['#12', '#fffffff', 'red', 'var(--primary)', 'url(x)'])
    assert.equal(normalizeColor(value), null)
})
test('invalid saved appearance settings fall back without losing valid fields', () => {
  assert.deepEqual(parseTheme(null), defaultTheme)
  assert.deepEqual(parseTheme({ mode: 'unknown', color: '#abc' }), {
    mode: 'system',
    color: '#aabbcc',
  })
  assert.deepEqual(parseTheme({ mode: 'dark', color: 'invalid' }), {
    mode: 'dark',
    color: defaultTheme.color,
  })
})
test('extreme custom colors remain readable in both themes and on primary buttons', () => {
  for (const dark of [false, true])
    for (const color of [
      '#ffffff',
      '#000000',
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#e74762',
    ]) {
      const palette = themePalette(color, dark)
      assert.ok(contrast(palette.primary, dark ? '#18181c' : '#ffffff') >= 4.5)
      assert.ok(contrast(palette.primary, palette.foreground) >= 4.5)
    }
})
