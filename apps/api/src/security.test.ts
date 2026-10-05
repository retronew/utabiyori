import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { seal, unseal } from './session.ts'
import { privateKey, signingContent } from './client.ts'
import handle from './handler.ts'

test('RSA signing sorts raw parameter values before transport encoding', () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pem = keys.privateKey
    .export({ format: 'pem', type: 'pkcs8' })
    .toString()
  const raw = pem.replace(/-----[^\n]+-----/g, '').replace(/\s/g, '')
  const params = {
    timestamp: '123',
    bizContent: '{"keyword":"宇多田&ヒカル"}',
    appId: 'app',
    sign: 'ignored',
    accessToken: '',
  }
  const content = signingContent(params)
  assert.equal(
    content,
    'appId=app&bizContent={"keyword":"宇多田&ヒカル"}&timestamp=123',
  )
  assert.equal(
    verify(
      'RSA-SHA256',
      Buffer.from(content),
      keys.publicKey,
      sign('RSA-SHA256', Buffer.from(content), privateKey(raw)),
    ),
    true,
  )
})
test('sessions encrypt tokens and reject tampering or a different server key', () => {
  const session = {
    deviceId: 'a'.repeat(32),
    user: {
      accessToken: 'private-user-token',
      refreshToken: 'private-refresh-token',
      expires: Date.now() + 1000,
    },
  }
  const encrypted = seal(session, 'server-secret')
  assert.ok(!encrypted.includes('private-user-token'))
  assert.deepEqual(unseal(encrypted, 'server-secret'), session)
  assert.equal(unseal(encrypted, 'another-secret'), undefined)
  const bytes = Buffer.from(encrypted, 'base64url')
  bytes[40] ^= 1
  assert.equal(unseal(bytes.toString('base64url'), 'server-secret'), undefined)
})
test('HTTP gateway rejects cross-origin, unknown actions and malformed song IDs before contacting provider', async () => {
  const env = {
    NETEASE_APP_ID: 'test',
    NETEASE_APP_SECRET: 'secret',
    NETEASE_PRIVATE_KEY: 'invalid-unused-key',
    NETEASE_SESSION_SECRET: 'x'.repeat(32),
  }
  const server = createServer((req, res) => void handle(req, res, env))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  try {
    const foreign = await fetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: {
        Origin: 'https://foreign.example',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'search', keyword: 'test' }),
    })
    assert.equal(foreign.status, 403)
    const unknown = await fetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'proxy', url: 'https://example.org' }),
    })
    assert.equal(unknown.status, 400)
    const invalid = await fetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'playback', songId: '../../token' }),
    })
    assert.equal(invalid.status, 400)
    const status = await fetch(`${origin}/api/netease`)
    assert.deepEqual(await status.json(), {
      configured: true,
      loggedIn: false,
      hybrid: false,
    })
  } finally {
    server.close()
    server.closeAllConnections()
  }
})
