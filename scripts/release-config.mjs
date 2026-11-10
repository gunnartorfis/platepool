export function validateMigrationTarget(env) {
  const url = env.DATABASE_URL
  if (!url || !/^postgres(ql)?:\/\//.test(url))
    throw new Error('A PostgreSQL DATABASE_URL is required')
  const parsed = new URL(url)
  if (
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must specify host, database and credentials')
  }
  if (!['staging', 'production', 'test'].includes(env.DEPLOY_ENV)) {
    throw new Error('Set DEPLOY_ENV to staging, production or test')
  }
  // Compare a public database identity, never duplicate credentials in config/logs.
  const target = `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`
  if (env.DB_DEPLOY_TARGET !== target)
    throw new Error(
      'DB_DEPLOY_TARGET must match the reviewed host:port/database',
    )
  return { url }
}
