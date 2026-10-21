# Big-Cities staging deployment handoff

**Prepared:** 2026-10-20
**Scope:** Preparation only. No hosting service/database was created or changed; no database connection, restore, migration, commit, push, or deployment was performed.

## Backend Render service settings

No Render descriptor or service settings were present in this directory. Proposed settings for a Render **Web Service** rooted at this project:

| Setting | Value |
|---|---|
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health/live` |
| Instance | single instance during initial staging |

`backend/package.json` compiles TypeScript to `dist/main.js`; the app listens on `0.0.0.0` using Render's `PORT`. `backend/public/Images` must be included in the runtime artifact beside `dist` because Fastify serves that directory. With the proposed backend root, it is already in the repository tree; confirm the platform build artifact retains it. Do not use disk-local uploads as durable storage.

Required secret/environment settings (enter secrets directly in Render's secret environment UI; do not put credentials in this file):

| Variable | Initial staging value / rule |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | TLS-enabled direct URL for the separately provisioned empty staging DB, using the staging-only least-privilege application role |
| `JWT_ACCESS_TOKEN_SECRET` | New strong random secret, unique to staging |
| `JWT_REFRESH_TOKEN_SECRET` | Separate new strong random secret, unique to staging |
| `DATABASE_WRITES_ENABLED` | `false` |
| `UPLOADS_ENABLED` | `false` |
| `EVENT_DISCOVERY_ENABLED` | `false` |
| `EVENT_SYNC_ENABLED` | `false` |
| `EVENT_SYNC_RUN_ON_START` | `false` |
| `PORT` | Set by Render; application consumes it |

The frontend's production build also needs `VITE_API_BASE_URL` set to the eventual backend origin before that frontend is built/deployed. CORS currently permits the configured Cloudflare Workers frontend origin and permits localhost only outside production (`backend/src/cors.ts`); verify the final frontend origin before enabling traffic. Current auth throttling is in-memory and per process, so it is not shared between multiple instances.

## Lint, TypeScript, and security review

- Existing prep checkout already has uncommitted CORS hardening in `backend/src/cors.ts`, `backend/src/cors.test.ts`, and changes in `backend/src/main.ts` and `backend/tsconfig.json`. These were preserved without edits.
- Backend TypeScript/ESLint gap: ESLint flat config only selects `**/*.{js,jsx}` and has no TypeScript parser/plugin, so TypeScript sources and tests are not linted. `backend/tsconfig.json` now excludes `src/**/*.test.ts`, which prevents test-only TypeScript compilation errors from breaking production builds while preserving the test files.
- The reported 304 ESLint errors were not reproduced. `npm run lint -- --format json` could not start because this checkout has no `node_modules/.bin` shims. Invoking `node node_modules/eslint/bin/eslint.js . --format json` directly exited successfully with no findings (only the `.eslintignore` deprecation warning). Do not disable rules to suppress the unverified count. Next diagnostic should be a clean install in an isolated copy/worktree followed by lint with the lockfile, then classify actual findings before fixing.
- `npm run build` in `backend` passed. `backend/package.json` has no test script, so no backend tests were run. The existing test files remain untouched.
- Advisory refresh: `npm audit --package-lock-only --json` could not reach npm's advisory endpoint. No current advisory report could be verified; no `npm audit fix` or upgrades were run. The lockfile includes `xlsx@0.18.5`; review its known security advisories and whether the package is runtime-required before choosing a targeted remediation. `npm ls --depth=0` also reports local `date-fns` invalid despite lockfile pinning 4.4.0; this is an installed-tree inconsistency, not a confirmed lockfile vulnerability. Re-run audit and clean-install checks when npm registry access is available.

## Staging database and restore procedure (proposed; not executed)

1. Provision a **new, empty PostgreSQL 18** staging database, separate from local and production data. Use a dedicated staging owner/admin credential only for provisioning and a separate least-privilege staging application login for `DATABASE_URL`. Do not reuse local `postgres` credentials. Match UTF8; check collation implications because source Windows collation was `English_United States.1252`.
2. Before restore, obtain the provider's database name, host, port, database/user identity, and TLS connection details. Open the provider console and confirm the target database is newly created and empty; independently connect with PostgreSQL 18 `psql` using the staging admin account and verify `current_database()`, `current_user`, server version 18.x, and that `public` has no application tables. Stop if any identity differs or any application objects/data exist. Keep credentials out of shell history and logs. This target confirmation must be repeated immediately before `pg_restore`.
3. Verify the copied source immediately before use: `C:\Users\LBG\Desktop\Big-Cities-CORS-Prep\staging-prep\react_router_dev_deployment_20261017_115710_380.dump`; expected 1,539,397 bytes and SHA-256 `B2D1CBFEBEA06DD2E897FEAE5BBAAAF5F7FA991A4E057BAC92147CC62CB05586`. PostgreSQL 18 `pg_restore --list` already succeeded with exit code 0 and 85 TOC entries.
4. After separate explicit approval and target confirmation, restore only to the confirmed empty staging database with PostgreSQL 18 client tools and the staging admin connection, using `pg_restore --verbose --no-owner --no-privileges --dbname <confirmed-staging-URL> <verified-copy>`. Do not use `--clean` or `--create`; do not run Prisma migrations, seed scripts, or event ingestion as part of restore. Provision required grants/roles separately. Keep the command/URL secret-safe.
5. Verify the restore with read-only PostgreSQL queries: compare counts for every table listed below with the preservation report; calculate a deterministic fingerprint for every table by ordering rows by primary key and hashing canonical, consistently encoded complete-row JSON values. Compare against trusted source fingerprints if available. The original audit reports all 19 table counts matched and deterministic full-row JSONB fingerprints matched on a prior isolated verification restore; obtain/use its recorded per-table fingerprints or independently compare with an authorized source snapshot before claiming this new target matches. Record row counts, fingerprints, PostgreSQL version, and target identity. Verify key country/city/event samples and `_prisma_migrations` status without executing migrations.

Baseline table counts from `DATABASE_DEPLOYMENT_PREPARATION_REPORT_20261017.md`:

| Table | Rows | Table | Rows |
|---|---:|---|---:|
| Activity | 0 | AuditLog | 0 |
| Category | 19 | City | 1,331 |
| Continent | 6 | Country | 195 |
| Event | 1,136 | EventDiscoveryBudget | 52 |
| EventDiscoveryRun | 657 | EventDiscoveryState | 15 |
| Notification | 0 | Permission | 0 |
| Role | 1 | RolePermission | 0 |
| SavedEvent | 1 | Session | 71 |
| Upload | 3 | User | 19 |
| `_prisma_migrations` | 16 | | |

## Preservation and approval boundary

The verified dump is a copy under `staging-prep`; the original backup and project assets remain untouched. The database dump contains upload metadata/references, not uploaded image bytes. Keep all upload routes disabled and preserve the project upload/media files. Keep write guard, discovery, sync, and run-on-start flags false until staging checks and separate operational approval are complete.

**Single next action requiring approval:** authorize provisioning one empty PostgreSQL 18 staging database with separate staging-only credentials. No Render resource creation, restore, migrations, or deployment is included in that action; each remains gated on later explicit approval.
