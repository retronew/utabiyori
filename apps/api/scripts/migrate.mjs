import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

// Explicit migration only; request handlers never modify database schema.
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const sql = neon(process.env.DATABASE_URL)
const source = await readFile(
  new URL('../migrations/001-account.sql', import.meta.url),
  'utf8',
)
await sql.transaction(
  source
    .split(';')
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => sql.query(text)),
)
console.log('Account schema is ready.')
