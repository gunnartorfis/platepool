import { defineConfig } from 'drizzle-kit'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  throw new Error(
    'TURSO_DATABASE_URL is required for drizzle-kit. ' +
      'Set it in your local .env or in Vercel for the active environment ' +
      '(Production / Preview / Development).',
  )
}
if (!authToken) {
  throw new Error(
    'TURSO_AUTH_TOKEN is required for drizzle-kit. ' +
      'Set it in your local .env or in Vercel for the active environment ' +
      '(Production / Preview / Development).',
  )
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: `${url}?authToken=${authToken}`,
  },
})
