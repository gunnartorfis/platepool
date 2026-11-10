import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL
const needsDatabase = /\b(push|migrate|pull|studio)\b/.test(
  process.argv.slice(2).join(' '),
)
if (needsDatabase && !url) throw new Error('DATABASE_URL is required')

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle-postgres',
  dialect: 'postgresql',
  dbCredentials: { url: url ?? 'postgresql://unused:unused@localhost/unused' },
})
