// Fail closed in staging until the operator explicitly enables sandbox adapters.
// Never enable live grocery credentials on a staging database.
export function requireLiveIntegrations() {
  if (
    process.env.INTEGRATION_MODE === 'disabled' ||
    (process.env.RAILWAY_ENVIRONMENT_NAME === 'staging' &&
      process.env.INTEGRATION_MODE !== 'live')
  ) {
    throw new Error('External integrations are disabled in this environment')
  }
}
