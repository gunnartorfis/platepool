#!/usr/bin/env node
// Vercel build invokes this before `vite build`. It picks the right
// `drizzle-kit push` flags based on the deploy environment:
//
//   VERCEL_ENV=production -> plain push (refuses destructive changes)
//   VERCEL_ENV=preview    -> push --force (auto-applies destructive
//                            changes so PR previews can drop stale
//                            tables on share-plate-dev without
//                            human interaction)
//   anything else         -> plain push (mirrors production safety)
//
// Bail out before touching the DB if the active env is missing the
// Turso credentials — better to fail the build than to push to the
// wrong (or no) database.

import { spawnSync } from 'node:child_process'

const env = process.env.VERCEL_ENV ?? 'unknown'

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error(
    `[db-deploy] TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required ` +
      `(VERCEL_ENV=${env}). Set them in Vercel for this environment.`,
  )
  process.exit(1)
}

const args = ['drizzle-kit', 'push']
if (env === 'preview') {
  args.push('--force')
  console.log(
    `[db-deploy] preview build — running 'drizzle-kit push --force' ` +
      `against share-plate-dev. Destructive changes will be applied.`,
  )
} else {
  console.log(
    `[db-deploy] ${env} build — running 'drizzle-kit push'. ` +
      `Destructive changes will fail the build by design.`,
  )
}

const result = spawnSync('pnpm', ['exec', ...args], {
  stdio: 'inherit',
  env: process.env,
})

process.exit(result.status ?? 1)
