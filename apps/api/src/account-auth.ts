import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTVerifyGetKey } from 'jose'
import { record } from '@jp-learn/shared'
import { seal, unseal } from '#session'

export type AccountEnvironment = Record<string, string | undefined>
const jwks = createRemoteJWKSet(new URL('https://vercel.com/.well-known/jwks'))
export const authCookie = 'utabiyori_oauth'
export const appCookie = 'utabiyori_account'
export function configuredAccount(env: AccountEnvironment) {
  return !!(
    env.DATABASE_URL &&
    env.VERCEL_APP_CLIENT_ID &&
    env.VERCEL_APP_CLIENT_SECRET &&
    env.APP_SESSION_SECRET &&
    env.APP_SESSION_SECRET.length >= 32
  )
}
export function accountOrigin(
  env: AccountEnvironment,
  host: string | undefined,
) {
  const configured =
    env.APP_ORIGIN ||
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '')
  if (configured) {
    const url = new URL(configured)
    if (
      url.origin !== configured ||
      url.username ||
      url.password ||
      (url.protocol !== 'https:' &&
        !(
          url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname) &&
          !env.VERCEL
        ))
    )
      throw new Error('Invalid application origin')
    return url.origin
  }
  if (!env.VERCEL && host && /^(localhost|127\.0\.0\.1):\d{1,5}$/.test(host))
    return `http://${host}`
  throw new Error('Application origin is required')
}
export function cookieValue(header: string | undefined, name: string) {
  return header
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}
export function newAuthorization(env: AccountEnvironment, origin: string) {
  const state = randomBytes(32).toString('hex')
  const nonce = randomBytes(32).toString('hex')
  const verifier = randomBytes(32).toString('base64url')
  const value = seal(
    {
      deviceId: randomBytes(16).toString('hex'),
      oauth: { state, nonce, verifier, origin, expires: Date.now() + 600000 },
    },
    env.APP_SESSION_SECRET!,
  )
  const params = new URLSearchParams({
    client_id: env.VERCEL_APP_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid profile',
    state,
    nonce,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  })
  return { cookie: value, url: `https://vercel.com/oauth/authorize?${params}` }
}
export function readAuthorization(
  value: string | undefined,
  state: string | null,
  origin: string,
  env: AccountEnvironment,
) {
  const oauth = value && unseal(value, env.APP_SESSION_SECRET!)?.oauth
  if (
    !oauth ||
    !state ||
    !/^[a-f0-9]{64}$/.test(state) ||
    oauth.expires <= Date.now() ||
    oauth.origin !== origin ||
    typeof oauth.state !== 'string' ||
    oauth.state.length !== state.length ||
    !timingSafeEqual(Buffer.from(oauth.state), Buffer.from(state)) ||
    typeof oauth.nonce !== 'string' ||
    typeof oauth.verifier !== 'string'
  )
    throw new Error('Invalid OAuth state')
  return oauth
}
export async function verifiedIdentity(
  token: string,
  clientId: string,
  nonce: string,
  key: JWTVerifyGetKey = jwks,
) {
  const { payload } = await jwtVerify(token, key, {
    issuer: 'https://vercel.com',
    audience: clientId,
    algorithms: ['RS256'],
    // Allow small clock differences while retaining expiry and not-before validation.
    clockTolerance: 30,
    maxTokenAge: '10m',
    requiredClaims: ['exp', 'iat', 'sub', 'nonce'],
  })
  if (payload.nonce !== nonce || !payload.sub || payload.sub.length > 200)
    throw new Error('Invalid identity')
  const name =
    typeof payload.name === 'string'
      ? payload.name
      : typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : 'Vercel 用户'
  return { subject: payload.sub, name: name.slice(0, 100) }
}
export async function exchangeIdentity(
  code: string,
  oauth: { verifier: string; nonce: string; origin: string },
  env: AccountEnvironment,
) {
  const response = await fetch('https://api.vercel.com/login/oauth/token', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: oauth.verifier,
      redirect_uri: `${oauth.origin}/api/auth/callback`,
      client_id: env.VERCEL_APP_CLIENT_ID!,
      client_secret: env.VERCEL_APP_CLIENT_SECRET!,
    }),
  })
  const value: unknown = await response.json()
  if (!response.ok || !record(value) || typeof value.id_token !== 'string')
    throw new Error('Login exchange failed')
  return verifiedIdentity(
    value.id_token,
    env.VERCEL_APP_CLIENT_ID!,
    oauth.nonce,
  )
}
