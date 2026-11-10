# Platepool hosting and PostgreSQL release

Updated 2026-11-10. Latest authorization: deploy/debug using Railway remote builds, runtime logs and HTTP checks; local Docker/browser testing is waived. Replace Turso with a **fresh empty Railway PostgreSQL database**. No data import is authorized or required. Framework and login remain TanStack Start and custom PBKDF2/database sessions. Deleting old databases/hosts still requires approval.

## Verified infrastructure

Company workspace: **GA solutions**, team `c3eeb9c9-ecb1-4994-8ea1-4a94ea009093`.

[Platepool project](https://railway.com/project/b0713a82-814e-4515-be0d-ecd84d036fda), project ID `b0713a82-814e-4515-be0d-ecd84d036fda`.

| Environment | Environment ID                       | Web service                                           | PostgreSQL service                              |
| ----------- | ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------- |
| Production  | 631970a8-ffed-4889-8f1c-743572c39b1e | web-production / f8063140-16b1-4bf5-96c2-121472356ea1 | Postgres / 1ae45c5a-f899-439c-8fc2-28beb2265e46 |

The production PostgreSQL instance reached SUCCESS using Railway's maintained postgres template (`ghcr.io/railwayapp-templates/postgres-ssl:18`) in Amsterdam. A 5GB persistent volume mounts `/var/lib/postgresql/data`. The web service references its DATABASE_URL through Railway variables. No public database TCP endpoint was requested. Confirm backup schedules/retention and restore before relying on a recovery guarantee.

Production schema-release job: `52aff950-6b51-4e58-8223-cf6bbf2e9a23`, Dockerfile.migrate, restart NEVER, private production DB reference. It runs once per explicit pinned release and exits; it is not a web startup hook.

Web settings: 1 Amsterdam replica, 1vCPU/0.5GB limit, /health with 60s readiness timeout, ON_FAILURE up to 5 retries, 10s overlap/130s drain, sleep disabled. No predeploy migration commands. These settings are API-verified; initial idle resource/HTTP measurements are recorded below. IaC must be planned against the target environment before applying. Preserve explicit source SHA pins; do not enable deploy-on-push inadvertently.

## Existing host and reset boundary

Vercel project [share-plate](https://vercel.com/gunnar-steinarssons-projects/share-plate) serves **platepool.com** and **share-plate-one.vercel.app**. Observed production deployment [C825y5MusbBpetUU8goQVzpbhqfQ](https://vercel.com/gunnar-steinarssons-projects/share-plate/C825y5MusbBpetUU8goQVzpbhqfQ), main SHA d4e187723f1a459400baafb307f6a379da25d6c8, Node 24.x/iad1. Vercel deploys main automatically and has no configured deployment checks. The release branch disables all future Vercel Git builds through vercel.json; do not push these changes to main until cutover is concrete.

Turso account gunnartorfis is Free, default group Ireland, with share-plate (155.65KB observed), share-plate-dev and a newly created empty platepool-railway-staging. Production Vercel Turso variables are masked Secret values; preview values are Config. No values were revealed and no tokens were rotated or invalidated. These old resources are retained; do not delete them as part of this release.

**The reset includes all users and sessions.** Existing cookies cannot authenticate against the fresh PostgreSQL DB. Clear/replace old cookies naturally through login; new users register and create/join new families. No automatic password resets, ID remapping or login-provider migration occurs. Do not restore old customer records after cutover without a new explicit data-migration scope.

## Application and integration inventory

- TanStack Start 1.164.0, React 19.2.4, Vite 7.3.1 from the existing pnpm lock. Nitro pinned to existing 3.0.1-alpha.2; PostgreSQL driver pg 8.23.1 and @types/pg 8.23.1 added using cached verified lock entries. No unrelated framework upgrade.
- PostgreSQL Drizzle schema preserves entity names/text IDs and application Date/boolean types. Timestamp columns are timezone-aware; home setup uses boolean. JSON arrays/recipe metadata remain JSON strings to preserve application behavior. Original SQLite migrations are retained under drizzle/ as historical evidence, but are never applied to PostgreSQL. Active history is drizzle-postgres/.
- Custom password hashing: PBKDF2 SHA-256; existing registration/login/logout/change-password handlers. Cookie sp_session, HttpOnly, SameSite=Lax, Secure in production, path /, max-age 30 days; DB expiry slides after half-life. Root responses exclude passwordHash.
- Families/members, personal/family plans/days, shares, subscriptions, constraints/templates, recipes and per-user grocery tokens are database-backed. PostgreSQL pool: max 5, 10s connection timeout, 30s idle timeout. Pool errors omit credentials.
- AI: server-side Gemini key, model gemini-3.1-flash-lite-preview, synchronous generation/validation/tagging. Per-call 90s aborts added; full request duration and model availability still need measurement. Grocery calls use 30s aborts. No provider response body is included in Krónan exception messages.
- Krónan credentials stay server-side in the database; cart calls can modify a real account. Acceptance must use synthetic fixtures/sandbox accounts, never real purchases. INTEGRATION_MODE=disabled blocks AI and all grocery requests; production live mode needs GEMINI_API_KEY configured separately.
- No uploads, browser automation, cron/queue worker or webhook was found in source. Images/recipe URLs are external; i18next uses localStorage for English/Icelandic preference. Legacy SQLite migration/data-sync scripts now refuse execution. No local filesystem durability is used by the application.

## Configuration

Runtime: DATABASE_URL (private Railway reference), GEMINI_API_KEY (secret), NODE_ENV=production, HOST=0.0.0.0, PORT=3000, INTEGRATION_MODE=live or disabled. Turso credentials are no longer read by the app. Remove any stale Turso variables from Railway only after verifying they are unused; no original Turso resources are deleted.

Schema job only: DEPLOY_ENV, DATABASE_URL and DB_DEPLOY_TARGET. The target is the reviewed public host:port/database identity, composed from Postgres.PGHOST/PGPORT/PGDATABASE references, never a second copy of the password.

Tests: TEST_DATABASE_URL must identify a separate disposable PostgreSQL database whose name ends in _test. Tests never silently fall back to application DATABASE_URL. GitHub CI provides PostgreSQL 18 for these tests.

## Reproducible build and release

Dockerfile installs Node 24.21.0/pnpm 10.29.2 with the frozen pnpm lock, then builds, checks types and runs dependency-free release guards. Verify the actual `.output/server/index.mjs` output before deploy; the image asserts its existence. Runtime contains only .output, runs as node, listens on 0.0.0.0/PORT and handles SIGTERM through Nitro/srvx. This installed srvx version reads SERVER_SHUTDOWN_TIMEOUT in seconds (120) and SERVER_FORCE_SHUTDOWN_TIMEOUT (5); NITRO_SHUTDOWN_TIMEOUT is not read by this preset. Railway drain is 130s. Builds/startup do not touch schema or seed data.

1. Commit reviewed source on codex/railway-hosting. GitHub write access was rechecked successfully; no user push is required.
2. Connect Railway to the exact commit SHA (not a floating branch). Inspect build logs, output layout and type errors. Keep platepool.com on the working host while resolving failures.
3. Run schema-release once against the fresh production DB using Dockerfile.migrate. It validates the target identity and takes a PostgreSQL advisory lock; Drizzle migrations and journal are versioned. Existing unjournaled schemas are rejected. Re-run should be a no-op. Never force-push schema.
4. Web deployment uses the same schema-compatible SHA and private DATABASE_URL. Confirm SUCCESS, health, direct login/register routes, static assets and unauthenticated redirects. Verify DB readiness with authenticated synthetic workflows before cutover.
5. Use synthetic registration/login/logout, expiry, family join, membership denial, recipes, constraints and plans on the fresh production candidate. Verify restart persistence. No browser acceptance is required under the latest instruction; record the exact HTTP/log evidence obtained.
6. Live AI requires a production secret and provider budget. Grocery acceptance requires a sandbox/fixtures and outbound-write prevention. Never dump passwords/cookies/provider tokens/prompts into logs.
7. Record release SHA/deployment IDs, domains, resource settings, DB journal and measured p50/p95. GitHub release.yml is manual, serialized and environment-scoped; production requires protected environment reviewers and exact SHA approval. The workflow uploads the schema-only image to schema-release and waits before uploading the web image, keeping database credentials and migrations inside Railway private networking. Configure RAILWAY_TOKEN, RAILWAY_ENVIRONMENT_ID, RAILWAY_SCHEMA_SERVICE_ID, RAILWAY_SERVICE_ID, SMOKE_BASE_URL and RELEASE_GATES_CONFIGURED in the protected GitHub environment. Configure these before enabling that workflow. No schema deployment occurs during builds or routine web restarts.

## Access findings requiring resolution before public acceptance

One-way sharing now reads incoming grants and returns only source family ID/name, excluding invite codes. Regression tests check that a sender cannot read the recipient's unshared plan. Discoverable-family subscriptions are deliberately existing product behavior: all families appear by name, and subscribing grants read-only plan access; membership checks still protect writes. Private families require a separately designed visibility feature.

Recipe metadata import now requires a session and live-integration mode. Public HTTPS only, port 443, no URL credentials/IP literals; DNS is resolved to public IPv4 and pinned for the HTTPS connection, each redirect is revalidated, requests timeout after 15s and HTML is capped at 2MB. IPv6-only and plain HTTP recipe sites are intentionally unsupported. AI tag generation also requires login. Same-origin POST middleware rejects foreign/missing origins; production requires HTTPS. Explicit I18nextProvider and synchronous initialization fix untranslated SSR labels.

## Cutover and recovery

- Verify the new release and clearly communicate the authorized empty-data reset. New accounts/families are required. Keep a list of old domains/deployment IDs and the new DB identity/journal.
- Configure the existing custom hostname on Railway, verify TLS and record required DNS changes/old records/TTL. Preserve same hostname/path cookie policy. Never switch DNS to an unhealthy or uninitialized candidate.
- Drain in-flight AI/cart work and inspect provider state before retrying non-idempotent writes. Flip DNS, verify HTTPS/auth/main routes/server functions/assets and monitor errors/latency/resources.
- Roll back the **Railway application** to the prior compatible SHA while retaining PostgreSQL writes. Returning DNS to old Vercel also returns users to the old, separate Turso dataset: new accounts/plans will be absent there. That is a separate continuity decision, not a transparent application rollback.
- Stop or roll back for auth/tenant failures, lost writes, credential exposure, health failures or repeated OOM/crashes. Suggested operational thresholds: >1% 5xx for 5min or p95 >2x the accepted baseline.
- Configure daily database backups plus an off-provider export policy and test restore. Proposed RPO<=24h/RTO<=1h are review targets, not agreed or verified guarantees. Once real PostgreSQL data exists, any restore requires reconciliation of post-backup writes.
- Retain Vercel/Turso through acceptance. Deletion/retirement requires separate approval after acceptance.

## Costs and validation evidence

[Railway pricing](https://docs.railway.com/pricing/plans): $10/GB-month RAM, $20/average-vCPU-month, $0.05/GB egress, $0.15/GB-month volume usage; Pro workspace minimum $20 includes $20 shared usage. Do not count the minimum once per product.

Unmeasured scenarios per environment: web idle 0.15GB/0.01vCPU/1GB egress ≈$1.75/month; web active 0.30GB/0.10vCPU/10GB ≈$5.50. PostgreSQL at assumed 0.25GB/0.02vCPU + 1GB used storage ≈$3.05, or 5GB charged storage ≈$3.65; verify actual volume billing and usage. Combined baseline ≈$4.80–$5.40/environment/month, before AI, backups/egress and shared allocation. These are assumptions, not measured spend. Only one production DB remains; staging services/volume were removed. GEMINI costs depend on input/output tokens, validation/retries and current preview-model rates; not measured. Configure AI/provider limits separately.

Passed: dependency-free migration target tests (3), changed-file formatting and git diff checks. PostgreSQL production and staging instances reached SUCCESS. Local dependency install remains incomplete because sandbox DNS is blocked; no local Docker/browser acceptance is claimed or required. Remote application build, schema job, HTTP checks, latency and backup/restore results are recorded as they become available. Existing source was verified at d4e1877 before publishing this release branch.

Official references: [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Nitro Node](https://nitro.build/deploy/runtimes/node), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [PostgreSQL schema types](https://orm.drizzle.team/docs/column-types/pg), [Railway IaC](https://docs.railway.com/infrastructure-as-code/reference), [Vercel branch deployment control](https://vercel.com/docs/project-configuration/git-configuration).

## Production-only update

Gunnar requested production only. Removed the unused staging web service, staging PostgreSQL service and its fresh volume. Only production is declared in IaC/release configuration. The empty staging environment metadata will be removed through the dashboard. No old Vercel/Turso records or resources were deleted. Production web commit 952b3519a26c98878f6a71f65edbe9031e820662 reached SUCCESS, including Node build, typecheck and release guard tests. HTTP /health, /login and /register return 200; /, /recipes and /settings redirect anonymous requests to /login. Generated candidate URL: https://web-production-production-c290.up.railway.app. Custom-domain cutover is still pending functional acceptance. PR: https://github.com/gunnartorfis/platepool/pull/10.

## Production validation observations

- Revision 5c6179320245cbfb366134df18365c21f4eb1092, deployment abd7e3ea-2459-41c9-8140-83c52989a5e2: SUCCESS. Replaced by later validated revisions as recorded in the release report.
- Synthetic HTTP registration/login/logout passed on the generated Railway HTTPS origin. Cookie is Secure/HttpOnly/SameSite=Lax, Max-Age 2592000. Old session redirects to login after logout; a new valid session survived a web-container restart and authenticated /recipes returned 200. No password hash appears in SSR.
- Foreign Origin plus Sec-Fetch-Site cross-site returns 403; Icelandic login SSR renders Innskrá rather than auth.login. Browser hydration testing is explicitly waived, not claimed.
- Ten authenticated /recipes requests from the operator connection: 63–163ms, p50 65ms/p95 163ms. This includes network, SSR and SQL; it is not an isolated SQL measurement or load test. Turso latency no longer applies.
- Railway last-hour metrics during deployment/testing: web current RAM 0.115GB, observed peak 0.199GB; Postgres current RAM 0.055GB/peak 0.061GB. Averages include startup/idle periods, so they cannot establish an active-user forecast.
- Backups UI: workspace must upgrade to Pro to create backups, automatic schedules or PITR. No backup or restore drill is configured/claimed. Pro purchase requires owner action/approval. Until then this is a release dependency, despite the persistent volume.
- GEMINI_API_KEY was recovered from Vercel without displaying/logging its value and staged on web-production. The single-change patch b02343fe-0ca6-45a8-b212-9a3913890a95 is not applied: automatic approval review requires explicit approval to deploy this secret-bearing change. Live AI acceptance and provider budget verification remain blocked. No real grocery account, cart or purchase was exercised.
- Custom-domain attachment was blocked by automatic approval review: explicit public production approval is required after validation. platepool.com remains on Vercel. Nothing was deleted from the old host/data providers.

PostgreSQL resource cap proposal (1vCPU/0.5GB) and ON_FAILURE/5 were not applied: automatic approval review requires approval for that live database change because it may interrupt operations. Current provider defaults remain.
