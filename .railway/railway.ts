// Run with the Railway CLI IaC toolchain (railway/iac), separate from app deps.
// No GitHub source: releases are explicit CLI uploads, never deploy-on-push.
import { defineRailway, project, service, preserve } from 'railway/iac'

export default defineRailway((ctx) => {
  if (ctx.projectId !== 'b0713a82-814e-4515-be0d-ecd84d036fda') {
    throw new Error(
      'Refusing to apply outside the GA solutions Platepool project',
    )
  }
  if (!['staging', 'production'].includes(ctx.environment)) {
    throw new Error('Expected staging or production')
  }
  const web = service(
    ctx.environment === 'production' ? 'web-production' : 'web',
    {
      // Railway detects the root Dockerfile. Keep its exec-form CMD as PID 1.
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
        DATABASE_URL:
          ctx.environment === 'production'
            ? '${{Postgres.DATABASE_URL}}'
            : '${{Postgres-GwvK.DATABASE_URL}}',
        GEMINI_API_KEY: preserve(),
        INTEGRATION_MODE: ctx.environment === 'staging' ? 'disabled' : 'live',
      },
    },
  )
  return project('Platepool', { resources: [web] })
})
