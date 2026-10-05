import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import handle from '#handler'
import { seal, unseal } from '#session'
import { songTicket } from '#song-ticket'

test('web QR keeps playback credentials out of JSON and isolated from the official session; logout clears both', async () => {
  const secret = 'test-session-secret-'.repeat(3)
  const env = {
    NETEASE_APP_ID: 'test',
    NETEASE_APP_SECRET: 'secret',
    NETEASE_PRIVATE_KEY: 'unused',
    NETEASE_SESSION_SECRET: secret,
    NETEASE_PLAYBACK_PROVIDER: 'hybrid',
  }
  const deviceId = 'a'.repeat(32)
  const session = {
    deviceId,
    user: {
      accessToken: 'official-access-token',
      refreshToken: 'official-refresh-token',
      expires: Date.now() + 60000,
    },
    anonymous: {
      accessToken: 'anonymous-access-token',
      refreshToken: 'anonymous-refresh-token',
      expires: Date.now() + 60000,
    },
  }
  const officialCookie = `utabiyori_ncm=${seal(session, secret)}`
  let webCookie = ''
  let sawPlaybackCredential = false
  const nativeFetch = globalThis.fetch
  const mockFetch = mock.method(
    globalThis,
    'fetch',
    async (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (!String(input).startsWith('https://music.163.com/'))
        return nativeFetch(input, options)
      if (String(input).includes('/unikey'))
        return Response.json({ code: 200, unikey: 'web-key' })
      if (String(input).includes('/client/login')) {
        const headers = new Headers()
        headers.append(
          'Set-Cookie',
          'MUSIC_U=web-playback-credential; HttpOnly',
        )
        headers.append('Set-Cookie', '__csrf=csrf-value; Path=/')
        return Response.json({ code: 803 }, { headers })
      }
      sawPlaybackCredential = String(
        (options?.headers as Record<string, string>).Cookie,
      ).includes('MUSIC_U=web-playback-credential')
      return Response.json({
        code: 200,
        data: [
          { id: 123, url: 'https://m7.music.126.net/test.mp3', br: 128000 },
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
  const post = (body: Record<string, unknown>, cookie = officialCookie) =>
    nativeFetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Cookie: [cookie, webCookie].filter(Boolean).join('; '),
      },
      body: JSON.stringify(body),
    })
  try {
    const qr = await post({ action: 'webQr' })
    assert.equal(qr.status, 200)
    assert.equal(
      (await qr.json()).url,
      'https://music.163.com/login?codekey=web-key',
    )
    webCookie = qr.headers.getSetCookie()[0]!.split(';')[0]!
    const poll = await post({ action: 'webPoll' })
    assert.deepEqual(await poll.json(), { status: 803 })
    webCookie = poll.headers.getSetCookie()[0]!.split(';')[0]!
    assert.ok(!webCookie.includes('web-playback-credential'))
    assert.equal(
      unseal(webCookie.slice(webCookie.indexOf('=') + 1), secret)?.web?.cookies
        .MUSIC_U,
      'web-playback-credential',
    )
    const status = await nativeFetch(`${origin}/api/netease`, {
      headers: { Cookie: `${officialCookie}; ${webCookie}` },
    })
    assert.equal((await status.json()).webLoggedIn, true)
    const otherBrowser = `utabiyori_ncm=${seal({ ...session, deviceId: 'b'.repeat(32) }, secret)}`
    const isolated = await nativeFetch(`${origin}/api/netease`, {
      headers: { Cookie: `${otherBrowser}; ${webCookie}` },
    })
    assert.equal((await isolated.json()).webLoggedIn, false)
    const id = 'f'.repeat(32)
    const ticket = songTicket(
      { id, originalId: '123', duration: 90000, visible: false },
      secret,
    )
    const playback = await post({ action: 'playback', songId: id, ticket })
    assert.equal(playback.status, 200)
    assert.equal(sawPlaybackCredential, true)
    assert.ok(
      !JSON.stringify(await playback.json()).includes(
        'web-playback-credential',
      ),
    )
    const logout = await post({ action: 'logout' })
    const removed = logout.headers.getSetCookie()
    assert.ok(
      removed.some(
        (s) => s.startsWith('utabiyori_ncm_web=;') && s.includes('Max-Age=0'),
      ),
    )
    assert.ok(removed.some((s) => s.startsWith('utabiyori_ncm=')))
  } finally {
    mockFetch.mock.restore()
    server.close()
    server.closeAllConnections()
  }
})

test('expired web QR does not call the provider or expose a previous web credential', async () => {
  const { webPoll } = await import('#web-auth')
  const session = {
    deviceId: 'a'.repeat(32),
    webPending: { key: 'old-key', expires: Date.now() - 1000 },
  }
  assert.deepEqual(await webPoll(session, '127.0.0.1'), { status: 800 })
  assert.equal(session.webPending, undefined)
})

test('expired web playback clears only its cookie and preserves official authorization', async () => {
  const secret = 'server-test-secret-'.repeat(3)
  const deviceId = 'a'.repeat(32)
  const user = {
    accessToken: 'official-access',
    refreshToken: 'official-refresh',
    expires: Date.now() + 86400000,
  }
  const official = seal({ deviceId, user, anonymous: user }, secret)
  const web = seal(
    {
      deviceId,
      web: {
        cookies: { MUSIC_U: 'expired-web-credential' },
        expires: Date.now() + 60000,
      },
    },
    secret,
  )
  const nativeFetch = globalThis.fetch
  const mocked = mock.method(
    globalThis,
    'fetch',
    async (input: Parameters<typeof fetch>[0], options?: RequestInit) => {
      if (String(input).startsWith('https://music.163.com/'))
        return Response.json({
          code: 301,
          message: 'must-not-echo-provider-debug',
        })
      return nativeFetch(input, options)
    },
  )
  const server = createServer(
    (req, res) =>
      void handle(req, res, {
        NETEASE_APP_ID: 'test',
        NETEASE_APP_SECRET: 'unused',
        NETEASE_PRIVATE_KEY: 'unused',
        NETEASE_SESSION_SECRET: secret,
        NETEASE_PLAYBACK_PROVIDER: 'hybrid',
      }),
  )
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  try {
    const id = 'f'.repeat(32)
    const r = await nativeFetch(`${origin}/api/netease`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Cookie: `utabiyori_ncm=${official}; utabiyori_ncm_web=${web}`,
      },
      body: JSON.stringify({
        action: 'playback',
        songId: id,
        ticket: songTicket(
          { id, originalId: '123', duration: 90000, visible: false },
          secret,
        ),
      }),
    })
    assert.equal(r.status, 403)
    assert.ok(!(await r.text()).includes('must-not-echo-provider-debug'))
    const cookies = r.headers.getSetCookie()
    assert.ok(
      cookies.some(
        (s) => s.startsWith('utabiyori_ncm_web=;') && s.includes('Max-Age=0'),
      ),
    )
    const officialOut = cookies.find((s) => s.startsWith('utabiyori_ncm='))!
    assert.deepEqual(
      unseal(officialOut.split(';')[0]!.slice('utabiyori_ncm='.length), secret)
        ?.user,
      user,
    )
  } finally {
    mocked.mock.restore()
    server.close()
    server.closeAllConnections()
  }
})
