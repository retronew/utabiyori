import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { createServer } from 'node:http'
import { once } from 'node:events'
import handle from '#handler'
import { seal } from '#session'

test('optional official word lyrics normalize times and safely fall back without leaking provider fields', async () => {
  const secret = 'test-session-secret-'.repeat(3)
  const key = generateKeyPairSync('rsa', { modulusLength: 2048 })
    .privateKey.export({ format: 'pem', type: 'pkcs8' })
    .toString()
  const env = {
    NETEASE_APP_ID: 'test',
    NETEASE_APP_SECRET: 'secret',
    NETEASE_PRIVATE_KEY: key,
    NETEASE_SESSION_SECRET: secret,
  }
  const token = {
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    expires: Date.now() + 3600000,
  }
  const cookie = `utabiyori_ncm=${seal({ deviceId: 'a'.repeat(32), user: token, anonymous: token }, secret)}`
  const nativeFetch = globalThis.fetch
  let wordCode = 200
  let wordData: unknown = {
    lyrics: [
      {
        start: 10000,
        duration: 1000,
        words: [{ suspend: 10000, duration: 1000, words: '歌' }],
      },
    ],
    ytlrcs: '[00:10.00]歌曲',
  }
  const mocked = mock.method(
    globalThis,
    'fetch',
    async (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (!String(input).startsWith('https://openapi.music.163.com/'))
        return nativeFetch(input, options)
      if (String(input).includes('/word/by/word/'))
        return Response.json({
          code: wordCode,
          data: wordData,
          message: 'private-provider-debug',
        })
      return Response.json({
        code: 200,
        data: {
          lyric: '[00:10.00]歌',
          transLyric: '[00:10.00]歌曲',
          romalrc: '[00:10.00]uta',
        },
      })
    },
  )
  const server = createServer((req, res) => void handle(req, res, env))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const request = () =>
    nativeFetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ action: 'lyrics', songId: 'a'.repeat(32) }),
    })
  try {
    const available = await (await request()).json()
    assert.equal(available.wordTiming, 'available')
    assert.deepEqual(available.wordLines, [
      { start: 10, end: 11, words: [{ text: '歌', start: 10, end: 11 }] },
    ])
    wordCode = 300
    const denied = await (await request()).json()
    assert.equal(denied.wordTiming, 'restricted')
    assert.equal(denied.lyric, available.lyric)
    assert.equal(denied.romaji, available.romaji)
    assert.deepEqual(denied.wordLines, [])
    assert.ok(!JSON.stringify(denied).includes('private-provider-debug'))
    wordCode = 200
    wordData = null
    assert.equal((await (await request()).json()).wordTiming, 'missing')
    wordCode = 301
    assert.equal((await request()).status, 401)
  } finally {
    mocked.mock.restore()
    server.close()
    server.closeAllConnections()
  }
})
