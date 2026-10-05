/// <reference path="./vendor.d.ts" />
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { createServer } from 'node:http'
import { once } from 'node:events'
import encrypt from '@neteasecloudmusicapienhanced/api/util/crypto.js'
import { MUSIC_QUALITIES } from '@jp-learn/shared'
import handle from '#handler'
import { seal } from '#session'
import { songTicket } from '#song-ticket'

test('music quality is allowlisted, sent to the provider and reports actual quality while retaining trial limits', async () => {
  const secret = 'test-quality-session-secret-'.repeat(3)
  const deviceId = 'a'.repeat(32)
  const id = 'b'.repeat(32)
  const env = {
    NETEASE_APP_ID: 'test',
    NETEASE_APP_SECRET: 'secret',
    NETEASE_PRIVATE_KEY: generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ format: 'pem', type: 'pkcs8' })
      .toString(),
    NETEASE_SESSION_SECRET: secret,
    NETEASE_PLAYBACK_PROVIDER: 'hybrid',
  }
  const user = {
    accessToken: 'test-token',
    refreshToken: 'test-refresh',
    expires: Date.now() + 3600000,
  }
  const cookie = `utabiyori_ncm=${seal({ deviceId, user, anonymous: user }, secret)}; utabiyori_ncm_web=${seal({ deviceId, web: { cookies: { MUSIC_U: 'test-web-token' }, expires: Date.now() + 3600000 } }, secret)}`
  const ticket = songTicket(
    { id, originalId: '123', duration: 90000, visible: false },
    secret,
  )
  const nativeFetch = globalThis.fetch
  let requestedLevel: unknown
  let providerCalls = 0
  let url: string | null = 'https://m7.music.126.net/test.flac'
  let actualLevel: unknown = 'lossless'
  const encrypted = mock.method(
    encrypt,
    'weapi',
    (data: Record<string, unknown>) => {
      requestedLevel = data.level
      return { params: 'test', encSecKey: 'test' }
    },
  )
  const fetched = mock.method(
    globalThis,
    'fetch',
    async (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (String(input).startsWith('http://127.0.0.1:'))
        return nativeFetch(input, options)
      assert.ok(String(input).startsWith('https://music.163.com/weapi/'))
      providerCalls++
      return Response.json({
        code: 200,
        data: [
          {
            id: 123,
            url,
            br: 800000,
            type: 'flac',
            level: actualLevel,
            freeTrialInfo: { start: 10, end: 20 },
            privateDebug: 'not-public',
          },
        ],
      })
    },
  )
  const server = createServer((req, res) => void handle(req, res, env))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const request = (quality: unknown) =>
    nativeFetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ action: 'playback', songId: id, ticket, quality }),
    })
  try {
    for (const { value } of MUSIC_QUALITIES) {
      const response = await request(value)
      assert.equal(response.status, 200, await response.clone().text())
      assert.equal(requestedLevel, value)
      const body = await response.json()
      assert.equal(body.quality, 'lossless')
      assert.equal(body.bitrate, 800)
      assert.equal(body.codec, 'FLAC')
      assert.deepEqual(body.trial, { start: 10, end: 20 })
      assert.ok(!JSON.stringify(body).includes('test-web-token'))
      assert.ok(!JSON.stringify(body).includes('not-public'))
    }
    const count = providerCalls
    assert.equal((await request('unblock')).status, 400)
    assert.equal((await request({ level: 'hires' })).status, 400)
    assert.equal(providerCalls, count)
    actualLevel = 'private-invalid-level'
    assert.equal((await (await request('hires')).json()).quality, undefined)
    url = null
    assert.equal((await request('hires')).status, 403)
  } finally {
    fetched.mock.restore()
    encrypted.mock.restore()
    server.close()
    server.closeAllConnections()
  }
})
