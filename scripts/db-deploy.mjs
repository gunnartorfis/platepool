#!/usr/bin/env node
// Explicit schema release only. Never invoked by build or web startup.
import { validateMigrationTarget } from './release-config.mjs'
const { url } = validateMigrationTarget(process.env)
const { default: pg } = await import('pg')
const { drizzle } = await import('drizzle-orm/node-postgres')
const { migrate } = await import('drizzle-orm/node-postgres/migrator')
// One connection keeps advisory lock and all migrations in the same session.
const client = new pg.Client({
  connectionString: url,
  connectionTimeoutMillis: 10_000,
})
await client.connect()
try {
  await client.query('SELECT pg_advisory_lock(734927511)')
  const result = await client.query(
    "SELECT to_regclass('public.users') AS users, to_regclass('drizzle.__drizzle_migrations') AS journal",
  )
  if (result.rows[0].users && !result.rows[0].journal)
    throw new Error(
      'Existing schema has no migration journal; review is required',
    )
  await migrate(drizzle(client), { migrationsFolder: './drizzle-postgres' })
  console.log(
    JSON.stringify({
      event: 'schema.deploy',
      environment: process.env.DEPLOY_ENV,
      status: 'passed',
    }),
  )
} finally {
  await client.query('SELECT pg_advisory_unlock(734927511)').catch(() => {})
  await client.end()
}
