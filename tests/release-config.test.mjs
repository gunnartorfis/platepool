import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMigrationTarget } from '../scripts/release-config.mjs'
const remote = {
  DATABASE_URL:
    'postgresql://user:synthetic@postgres.railway.internal:5432/railway',
  DB_DEPLOY_TARGET: 'postgres.railway.internal:5432/railway',
  DEPLOY_ENV: 'production',
}
test('requires explicit matching PostgreSQL target and environment', () => {
  assert.equal(validateMigrationTarget(remote).url, remote.DATABASE_URL)
  for (const key of Object.keys(remote)) {
    const env = { ...remote }
    delete env[key]
    assert.throws(() => validateMigrationTarget(env))
  }
  assert.throws(() =>
    validateMigrationTarget({
      ...remote,
      DB_DEPLOY_TARGET: 'other:5432/railway',
    }),
  )
})
test('rejects SQLite, Turso and missing credentials', () => {
  for (const DATABASE_URL of [
    'file:/tmp/test.db',
    'libsql://old.turso.io',
    'postgresql://localhost/railway',
  ]) {
    assert.throws(() => validateMigrationTarget({ ...remote, DATABASE_URL }))
  }
})
test('does not require duplicating passwords in the reviewed public identity', () => {
  assert.equal(
    validateMigrationTarget({
      ...remote,
      DATABASE_URL: 'postgres://user:another@postgres.railway.internal/railway',
    }).url,
    'postgres://user:another@postgres.railway.internal/railway',
  )
})
