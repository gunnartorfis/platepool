# Platepool production operations

Updated 2026-11-10. Gunnar authorized production-only deployment, replacing Turso with fresh Railway PostgreSQL without importing data, public cutover and deletion of the old setup. He explicitly declined plan upgrades and backups. TanStack Start, React, TypeScript, Drizzle and custom authentication remain.

## Live infrastructure

[Production](https://platepool.com) · [www](https://www.platepool.com) · [Railway](https://railway.com/project/b0713a82-814e-4515-be0d-ecd84d036fda) · [migration PR #10](https://github.com/gunnartorfis/platepool/pull/10)

Company workspace: GA solutions, `c3eeb9c9-ecb1-4994-8ea1-4a94ea009093`. Project `b0713a82-814e-4515-be0d-ecd84d036fda`; production environment `631970a8-ffed-4889-8f1c-743572c39b1e`.

| Resource             | ID / configuration                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| web-production       | f8063140-16b1-4bf5-96c2-121472356ea1; Dockerfile; Amsterdam; one replica; 1 CPU/0.5GB; /health with 60s readiness timeout; ON_FAILURE/5; 10s overlap/130s drain; sleep disabled                      |
| Postgres             | 1ae45c5a-f899-439c-8fc2-28beb2265e46; Railway postgres-ssl:18 template; PostgreSQL 18.6; Amsterdam; private networking; 1 CPU/0.5GB resource cap; ON_FAILURE/5 configured for subsequent deployments |
| postgres-volume      | 3535c5a9-8d2b-4587-8f1a-dc2a8ba4fd5c; 5GB; mounted at /var/lib/postgresql/data; PGDATA belongs on this volume                                                                                        |
| schema-release       | 52aff950-6b51-4e58-8223-cf6bbf2e9a23; Dockerfile.migrate; one-off, restart NEVER; no public domain                                                                                                   |
| Generated web domain | https://web-production-production-c290.up.railway.app                                                                                                                                                |

There is no running nonproduction Railway stack. CI creates disposable PostgreSQL test containers on GitHub runners. PostgreSQL has no public TCP proxy. No application filesystem state is used; all durable application data/sessions are in PostgreSQL. Do not change DATABASE_URL to file:/SQLite or put database state in the web container.

## Domains and old resources

Vercel remains the registrar and authoritative DNS provider for platepool.com; keep the domain registration/renewal and nameservers ns1.vercel-dns.com / ns2.vercel-dns.com. This is separate from application hosting. The old share-plate Vercel project `prj_e21CEpvXZ47Q2cLrJtAFh1o4CGgd` was deleted: DELETE returned 204 and subsequent GET returned 404. Its old deployment/aliases are no longer application rollback targets.

| DNS name                          | Type                    | Value                                            | TTL |
| --------------------------------- | ----------------------- | ------------------------------------------------ | --- |
| platepool.com                     | ALIAS (apex flattening) | evpfeaul.up.railway.app                          | 60  |
| www.platepool.com                 | CNAME                   | itxlhn4n.up.railway.app                          | 60  |
| _railway-verify.platepool.com     | TXT                     | Railway-managed ownership value, retained in DNS | 60  |
| _railway-verify.www.platepool.com | TXT                     | Railway-managed ownership value, retained in DNS | 60  |

Railway verified both domains and issued valid TLS certificates. Direct HTTPS checks identify railway-hikari. Railway's CNAME status field can still show an unset CNAME for a flattened apex even when the certificate is valid and HTTPS routes correctly; check actual DNS/HTTPS and ownership together.

The empty migration-only Turso database platepool-railway-staging was deleted. The old share-plate database was deleted after public production and AI persistence checks passed; share-plate-dev was also deleted. The unrelated native-sugar-man database is outside this task. Original SQLite migrations under drizzle/ remain historical source evidence, never active deployment input.

**No old data was imported.** Existing users must register and create/join families again. Old cookies cannot restore old identities. Authentication remains PBKDF2 SHA-256 and database-backed sessions; no Clerk integration, password reset or ID mapping was introduced.

## Build and configuration

Use Node 24.21.0 and pnpm 10.29.2 with pnpm-lock.yaml and frozen installs. Existing TanStack Start 1.164.0, React 19.2.4, Vite 7.3.1 and Nitro 3.0.1-alpha.2 are retained. PostgreSQL driver pg is pinned to 8.23.1. No unrelated framework upgrade.

Dockerfile builds with the explicit Nitro node-server preset, verifies `.output/server/index.mjs`, typechecks and runs release guards. Runtime copies only .output and runs as the unprivileged node user. `pnpm start` uses the built Node server. Vite dev/preview are not production servers. No schema deployment, data sync or seed occurs in image builds or web startup.

The installed Nitro preset uses srvx: `SERVER_SHUTDOWN_TIMEOUT=120` and `SERVER_FORCE_SHUTDOWN_TIMEOUT=5` are seconds. NITRO_SHUTDOWN_TIMEOUT is not read by this preset. Railway's 130s drain allows the configured shutdown window. Per-call AI timeout is 90s and grocery HTTP timeout is 30s; multiple AI calls can extend a full request beyond one call's timeout, so inspect in-flight work before deploying.

Runtime variables: DATABASE_URL references `${{Postgres.DATABASE_URL}}`; GEMINI_API_KEY is a runtime secret copied from the existing Vercel configuration without displaying/logging its value; NODE_ENV=production, HOST=0.0.0.0, PORT=3000, INTEGRATION_MODE=live. Never prefix credentials with VITE_ or publish them to browser bundles. INTEGRATION_MODE=disabled blocks AI, recipe imports and grocery effects for local/CI work. No Turso credential is used.

Schema service only: DEPLOY_ENV=production, private DATABASE_URL reference, and DB_DEPLOY_TARGET composed from Postgres.PGHOST/PGPORT/PGDATABASE as host:port/database. The reviewed target does not duplicate the password.

## Controlled releases

Railway web sources are pinned to an exact Git commit on main; ordinary pushes do not deploy. GitHub CI validates frozen dependencies, production build, migration snapshot drift, types, lint, release guards, real PostgreSQL auth/family/recipe/sharing behavior and container lifecycle. No Vercel project or build path remains.

1. Commit/review changes on GitHub and require the exact commit's CI to pass. Keep a record of the previous deployed SHA.
2. If SQL changed, review the additive migration under drizzle-postgres/. Deploy schema-release once from the exact release commit using Dockerfile.migrate on Railway's private network; wait for successful completion. The runner validates the target, takes advisory lock 734927511, checks the migration journal and applies versioned migrations. Existing unjournaled schemas are rejected. Re-running an applied migration is a no-op. Never use production schema push.
3. Deploy web-production pinned to the approved commit. Wait for Railway terminal SUCCESS; inspect logs rather than treating queued/building as success.
4. Run `SMOKE_BASE_URL=https://platepool.com pnpm test:hosting` and validate affected authenticated features with synthetic inputs. Confirm both custom domains/TLS, redirects, static assets, server functions and persistence. Check Railway CPU/RAM/5xx/latency for regressions.
5. Record the final SHA, deployment IDs, schema version and acceptance evidence in the Notion inventory.

The optional manual GitHub release workflow is fail-closed until a production GitHub environment has RELEASE_GATES_CONFIGURED=true, RAILWAY_TOKEN, RAILWAY_ENVIRONMENT_ID, RAILWAY_SCHEMA_SERVICE_ID, RAILWAY_SERVICE_ID and SMOKE_BASE_URL, with the intended review gate. It serializes schema/web uploads and runs the schema job inside Railway, never against the private DB from the GitHub runner. Current releases use explicit pinned Railway operations; no new long-lived CI token was created during migration.

For development use a dedicated PostgreSQL database and the .env.example. For tests, TEST_DATABASE_URL must name a disposable database ending in _test; tests never fall back to application DATABASE_URL. `check` is read-only; `check:fix` rewrites files. The active PostgreSQL migration history is drizzle-postgres/; historical SQLite SQL is not compatible with it.

## Authentication and integrations

Cookie sp_session: Secure in production, HttpOnly, SameSite=Lax, path /, 30-day max-age. Sessions persist in PostgreSQL and slide after half-life; logout removes the DB session. Root SSR excludes password hashes. POST server-function middleware validates same-origin host and HTTPS, rejecting cross-site/missing origins; it does not trust arbitrary forwarded-host values. Explicit I18nextProvider/synchronous initialization preserve translated SSR.

Family writes require membership/role checks. One-way sharing follows incoming grants and exposes family ID/name rather than invite codes. Existing discovery/subscription behavior deliberately allows users to subscribe to discoverable families for read-only plans; private-family visibility is a separate product feature. Recipe imports require login and public HTTPS port 443, reject credentials/IP literals/private IPv4, pin the DNS result for the connection, revalidate up to three redirects, timeout each request and cap HTML at 2MB. Plain HTTP/IPv6-only recipe sources are intentionally unsupported.

AI uses the existing Gemini model alias gemini-3.1-flash-lite-preview. Key remains server-side; tag generation also requires login. Krónan credentials are stored per user in PostgreSQL. Cart/shopping-list operations change external accounts, so do not replay uncertain writes or test purchases with real credentials. No uploads, browser automation, cron, queues or background worker were found. Recipe images/links are external. English/Icelandic UI preference uses localStorage.

## Validation evidence

[CI run 42826691384](https://github.com/gunnartorfis/platepool/actions/runs/42826691384) passed for 4d359c23e17b8edb1a16c5d3a8f6c5155ccafbbf: build, migration drift, types, lint, three native guards, seven Vitest cases (including a real PostgreSQL end-to-end handler test), built container smoke, clean SIGTERM and restart. PR #10 merged as 2a7b370acb2f5e78c6748af5a7231c235d5f119d; Railway deployment bee5eeb9-7a10-436b-9860-94f1b0b6626c reached SUCCESS. Subsequent cleanup revisions are recorded in GitHub/Railway history.

Live synthetic registration/login/logout, secure cookies, old-session invalidation, anonymous redirects, direct authenticated routes, CSRF rejection, Icelandic SSR and session persistence after web restart passed. Eight routes and fifteen referenced static assets returned 200; SSR/assets did not expose password hashes or credential patterns. Public-domain login succeeded after TLS cutover. AI tagging returned Icelandic tags in ~1.3s; one-day AI meal generation completed in ~2.0s and its saved meal was read back through the public server function from PostgreSQL. A synthetic example.invalid account/family remains from validation. No real grocery account/cart/purchase was exercised. Local Docker/browser acceptance was explicitly waived; no browser hydration or load-test claim is made.

Ten authenticated SSR requests: p50 65ms/p95 163ms from the operator connection, including network and SQL, not isolated database latency. Initial web RAM current 0.115GB/peak 0.199GB; PostgreSQL 0.055GB/peak 0.061GB. These idle/startup observations are not an active-user capacity forecast.

## Monitoring, costs and recovery

Railway provides runtime logs, resource/HTTP metrics, readiness checks and bounded restart policy. Database pool errors use a fixed credential-free event. External uptime/error alert routing has not been configured; choose its destination before claiming on-call notification coverage. Suggested investigation thresholds: >1% 5xx for five minutes, p95 twice the accepted baseline, repeated restarts or memory near 0.5GB. Do not log provider tokens, passwords, session cookies or full provider response bodies.

Illustrative resource usage: idle web 0.15GB/0.01 average CPU/1GB egress ≈USD1.75/month; active web 0.30GB/0.10CPU/10GB ≈USD5.50. Assumed PostgreSQL 0.25GB/0.02CPU plus 1–5GB charged storage ≈USD3.05–3.65. Combined ≈USD4.80–5.40 idle or USD8.55–9.15 active, before AI, extra egress and shared plan fees. These are assumptions, not measured invoices. No plan upgrade was purchased.

Official Gemini 3.1 Flash-Lite family pricing currently lists USD0.25/M text input and USD1.50/M output including thinking. At illustrative 6,000 input + 1,500 output tokens, 1,000 calls ≈USD3.75; validation/multiple calls/retries multiply this. Preview-alias/account-specific billing and actual tokens must be reconciled with provider usage. Railway does not cap the AI provider bill.

**Backups are intentionally not configured, per Gunnar's instruction.** The persistent volume survives web/container redeployment, but no backup/restore guarantee or agreed RPO/RTO is claimed. Database/volume loss has no configured data recovery path.

For an application regression, pin/redeploy the last compatible Railway SHA while retaining PostgreSQL. Stop rollout for auth/tenant leaks, lost writes, credential exposure, health failures or repeated OOM/crashes. Do not automatically replay in-flight AI/cart work. Database recovery and application rollback are separate operations. The deleted Vercel/Turso setup is not a rollback target. New recovery arrangements or destructive schema changes require an explicit plan for existing PostgreSQL writes.

References: [TanStack hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Nitro Node](https://nitro.build/deploy/runtimes/node), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [Railway IaC](https://docs.railway.com/infrastructure-as-code/reference), [Railway pricing](https://docs.railway.com/pricing/plans), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
