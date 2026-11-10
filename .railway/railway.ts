// Application partial: PostgreSQL is managed through Railway's database template.
// Release sources are pinned separately to exact Git commit SHAs.
import { defineRailway, project, service, preserve } from 'railway/iac'
export const partial = 'application'
export default defineRailway((ctx) => {
  if (
    ctx.projectId !== 'b0713a82-814e-4515-be0d-ecd84d036fda' ||
    ctx.environment !== 'production'
  ) {
    throw new Error(
      'Expected the GA solutions Platepool production environment',
    )
  }
  const web = service('web-production', {
    healthcheck: '/health',
    healthcheckTimeout: 60,
    replicas: { 'europe-west4-drams3a': 1 },
    deploy: {
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 5,
      overlapSeconds: 10,
      drainingSeconds: 130,
    },
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: '3000',
      DATABASE_URL: '${{Postgres.DATABASE_URL}}',
      GEMINI_API_KEY: preserve(),
      INTEGRATION_MODE: 'live',
    },
  })
  return project('Platepool', { resources: [web] })
})
