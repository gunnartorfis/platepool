import { defineConfig } from 'drizzle-kit'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

// Only the commands below open a connection to the database. `generate`,
// `check`, etc. work purely on schema files and snapshots, so it's fine to
// load this config without env vars when running them.
const needsDatabase = /\b(push|migrate|pull|studio|drop|up)\b/.test(
  process.argv.slice(2).join(' '),
)

if (needsDatabase) {
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is required for this drizzle-kit command. ' +
        'Set it in your local .env or in Vercel for the active environment ' +
        '(Production / Preview / Development).',
    )
  }
  if (!authToken) {
    throw new Error(
      'TURSO_AUTH_TOKEN is required for this drizzle-kit command. ' +
        'Set it in your local .env or in Vercel for the active environment ' +
        '(Production / Preview / Development).',
    )
  }
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: url
      ? authToken
        ? `${url}?authToken=${authToken}`
        : url
      : 'libsql://placeholder.invalid',
  },
})
