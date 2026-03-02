import { defineConfig } from 'drizzle-kit'

const authToken = process.env.TURSO_AUTH_TOKEN
const url =
  process.env.TURSO_DATABASE_URL ||
  'libsql://platepool-gunnartorfis.aws-eu-west-1.turso.io'

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: authToken ? `${url}?authToken=${authToken}` : url,
  },
})
