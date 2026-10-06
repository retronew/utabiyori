import { createHash, randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { emptyAccountData, parseAccountData } from '@jp-learn/shared'
import type {
  AccountData,
  AccountSnapshot,
  AccountUser,
} from '@jp-learn/shared'

export const sessionHash = (token: string) =>
  createHash('sha256').update(token).digest('hex')
export function accountDatabase(url: string) {
  const sql = neon(url)
  function snapshot(row: Record<string, unknown>): AccountSnapshot {
    if (!Number.isSafeInteger(row.revision) || Number(row.revision) < 0)
      throw new Error('Invalid database revision')
    return { data: parseAccountData(row.data), revision: Number(row.revision) }
  }
  return {
    async login(subject: string, name: string) {
      const token = randomBytes(32).toString('base64url')
      const rows = await sql`
        WITH account AS (
          INSERT INTO app_users (provider, subject, name) VALUES ('https://vercel.com', ${subject}, ${name})
          ON CONFLICT (provider, subject) DO UPDATE SET name = EXCLUDED.name RETURNING id, name
        ), document AS (
          INSERT INTO app_data (user_id, data) SELECT id, ${JSON.stringify(emptyAccountData())}::jsonb FROM account
          ON CONFLICT (user_id) DO NOTHING
        ), session AS (
          INSERT INTO app_sessions (token_hash, user_id, expires_at)
          SELECT ${sessionHash(token)}, id, NOW() + INTERVAL '7 days' FROM account
        ) SELECT id, name FROM account`
      const user = rows[0]
      if (!user || typeof user.id !== 'string' || typeof user.name !== 'string')
        throw new Error('Invalid user')
      return { token, user: { id: user.id, name: user.name } }
    },
    async session(token: string): Promise<AccountUser | null> {
      const rows =
        await sql`SELECT u.id, u.name FROM app_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.token_hash = ${sessionHash(token)} AND s.expires_at > NOW()`
      const user = rows[0]
      return user &&
        typeof user.id === 'string' &&
        typeof user.name === 'string'
        ? { id: user.id, name: user.name }
        : null
    },
    async logout(token: string) {
      await sql`DELETE FROM app_sessions WHERE token_hash = ${sessionHash(token)}`
    },
    async read(userId: string) {
      const rows =
        await sql`SELECT data, revision FROM app_data WHERE user_id = ${userId}`
      if (!rows[0]) throw new Error('Missing user document')
      return snapshot(rows[0])
    },
    async write(
      userId: string,
      revision: number,
      mutation: string,
      data: AccountData,
    ) {
      // The receipt and revision update commit together; a lost response is safe to retry.
      const rows = await sql`
        WITH changed AS (
          UPDATE app_data SET data = ${JSON.stringify(data)}::jsonb, revision = revision + 1, updated_at = NOW()
          WHERE user_id = ${userId} AND revision = ${revision}
          AND NOT EXISTS (SELECT 1 FROM app_mutations WHERE user_id = ${userId} AND mutation_id = ${mutation})
          RETURNING data, revision
        ), receipt AS (
          INSERT INTO app_mutations (user_id, mutation_id) SELECT ${userId}, ${mutation} FROM changed
        ) SELECT data, revision FROM changed`
      if (rows[0]) return { accepted: true, ...snapshot(rows[0]) }
      const existing =
        await sql`SELECT 1 FROM app_mutations WHERE user_id = ${userId} AND mutation_id = ${mutation}`
      return { accepted: existing.length > 0, ...(await this.read(userId)) }
    },
    async limit(key: string, limit: number) {
      const rows =
        await sql`INSERT INTO app_rate_limits (key, window_started, count) VALUES (${key}, date_trunc('minute', NOW()), 1)
        ON CONFLICT (key) DO UPDATE SET window_started = EXCLUDED.window_started, count = CASE WHEN app_rate_limits.window_started = EXCLUDED.window_started THEN app_rate_limits.count + 1 ELSE 1 END RETURNING count`
      return Number(rows[0]?.count) <= limit
    },
  }
}
