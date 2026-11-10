# Platepool

Family meal planning, recipes, dietary constraints, shared plans and Krónan integration. TanStack Start + React + TypeScript, Drizzle and Railway PostgreSQL; existing custom PBKDF2 login with database-backed sessions.

The Railway database starts **empty**, as explicitly authorized on 2026-11-10. No Turso users, passwords, recipes, plans or grocery credentials are imported. Users register again. The retained Vercel/Turso deployment is separate and is not a rollback target for new PostgreSQL records.

## Development

Use Node **24.21.0** and **pnpm 10.29.2** (`nvm use`, `corepack enable`).

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Set DATABASE_URL to a dedicated PostgreSQL development database. `INTEGRATION_MODE=disabled` blocks external AI/grocery requests, including cart writes; enable live only with approved accounts and budgets. Keep credentials in environment secrets, never Git or client build variables.

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test:release
# Requires TEST_DATABASE_URL with a dedicated database name ending in _test:
pnpm test
```

`pnpm start` runs the built Node server. `preview` is for development only. `check` is read-only; `check:fix` rewrites files. The frozen pnpm lock is authoritative. Nitro remains pinned to the existing 3.0.1-alpha.2 version; no framework upgrade is included.

Run schema migrations only as an explicit controlled release step (`pnpm db:deploy`). Builds and web startup never migrate or seed. See [hosting and recovery](docs/hosting.md) for exact Railway services, release steps, credentials, cutover and remaining validation. The current release is being validated through Railway builds/logs and HTTP checks, as requested; local Docker/browser acceptance is waived.
