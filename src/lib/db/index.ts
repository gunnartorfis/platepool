import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN!

const client = createClient({ url, authToken })

export const db = drizzle(client, { schema })
export const getDbWithSchema = () => db
export type DB = typeof db
