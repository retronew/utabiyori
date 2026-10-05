import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readSongTicket, songTicket } from '#song-ticket'

test('web playback uses the original ID and duration signed from official search results', () => {
  const id = 'a'.repeat(32),
    secret = 'test-signing-secret'
  const ticket = songTicket(
    { id, originalId: '28445990', duration: 289000, visible: true },
    secret,
  )
  const value = readSongTicket(ticket, id, secret)
  assert.equal(value?.originalId, '28445990')
  assert.equal(value?.duration, 289000)
  assert.equal(readSongTicket(ticket, 'b'.repeat(32), secret), undefined)
  assert.equal(readSongTicket(ticket, id, 'wrong-secret'), undefined)
  const [payload, signature] = ticket.split('.')
  const changed = JSON.parse(Buffer.from(payload, 'base64url').toString())
  changed.originalId = '1'
  assert.equal(
    readSongTicket(
      `${Buffer.from(JSON.stringify(changed)).toString('base64url')}.${signature}`,
      id,
      secret,
    ),
    undefined,
  )
})
