import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')
if (!/^postgres(ql)?:\/\//.test(connectionString)) {
  throw new Error('DATABASE_URL must identify PostgreSQL')
}

export const pool = new pg.Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
})
pool.on('error', () => {
  console.error(JSON.stringify({ event: 'database.pool.error' }))
})
export const db = drizzle(pool, { schema })
export const getDbWithSchema = () => db
export type DB = typeof db
