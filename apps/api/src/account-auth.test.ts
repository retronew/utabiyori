import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import {
  accountOrigin,
  newAuthorization,
  readAuthorization,
  verifiedIdentity,
} from '#account-auth'

const env = {
  APP_SESSION_SECRET: 'a'.repeat(64),
  VERCEL_APP_CLIENT_ID: 'test-app',
}
test('authorization binds state, nonce, callback origin and S256 verifier', () => {
  const auth = newAuthorization(env, 'http://localhost:5173')
  const url = new URL(auth.url)
  const state = url.searchParams.get('state')
  const oauth = readAuthorization(
    auth.cookie,
    state,
    'http://localhost:5173',
    env,
  )
  assert.equal(
    url.searchParams.get('code_challenge'),
    createHash('sha256').update(oauth.verifier).digest('base64url'),
  )
  assert.equal(url.searchParams.get('nonce'), oauth.nonce)
  assert.equal(url.searchParams.get('scope'), 'openid profile')
  assert.throws(() =>
    readAuthorization(
      auth.cookie,
      '0'.repeat(64),
      'http://localhost:5173',
      env,
    ),
  )
  assert.throws(() =>
    readAuthorization(auth.cookie, state, 'https://other.invalid', env),
  )
  assert.throws(() =>
    readAuthorization(
      `${auth.cookie}broken`,
      state,
      'http://localhost:5173',
      env,
    ),
  )
  assert.throws(() => accountOrigin({ VERCEL: '1' }, 'evil.invalid'))
})
test('identity requires signed ID token with exact issuer, audience, nonce and unexpired claims', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const key = createLocalJWKSet({
    keys: [{ ...(await exportJWK(publicKey)), kid: 'test', alg: 'RS256' }],
  })
  const token = await new SignJWT({ nonce: 'nonce', name: '测试用户' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://vercel.com')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)
  assert.deepEqual(await verifiedIdentity(token, 'test-app', 'nonce', key), {
    subject: 'user',
    name: '测试用户',
  })
  await assert.rejects(verifiedIdentity(token, 'wrong-app', 'nonce', key))
  await assert.rejects(verifiedIdentity(token, 'test-app', 'wrong-nonce', key))
  const expired = await new SignJWT({ nonce: 'nonce' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://vercel.com')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 1000)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 500)
    .sign(privateKey)
  await assert.rejects(verifiedIdentity(expired, 'test-app', 'nonce', key))
  const future = await new SignJWT({ nonce: 'nonce' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://vercel.com')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt()
    .setNotBefore('2m')
    .setExpirationTime('5m')
    .sign(privateKey)
  await assert.rejects(verifiedIdentity(future, 'test-app', 'nonce', key))
  const skewed = await new SignJWT({ nonce: 'nonce' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://vercel.com')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt()
    .setNotBefore('10s')
    .setExpirationTime('5m')
    .sign(privateKey)
  assert.equal(
    (await verifiedIdentity(skewed, 'test-app', 'nonce', key)).subject,
    'user',
  )
  const wrongIssuer = await new SignJWT({ nonce: 'nonce' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://other.invalid')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)
  await assert.rejects(verifiedIdentity(wrongIssuer, 'test-app', 'nonce', key))
  const otherKey = await generateKeyPair('RS256')
  const forged = await new SignJWT({ nonce: 'nonce' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://vercel.com')
    .setAudience('test-app')
    .setSubject('user')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(otherKey.privateKey)
  await assert.rejects(verifiedIdentity(forged, 'test-app', 'nonce', key))
})
