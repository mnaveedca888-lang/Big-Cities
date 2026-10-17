# Database Deployment Preparation Report

**Audit date:** 2026-10-17  
**Disposition:** Local backup and isolated restore verified. No hosting destination was selected or contacted, and no live migration was performed.

## Scope and safety

The source database is `react_router_dev` on local PostgreSQL. The original database and both pre-existing backup archives were left unchanged. This audit created one new deployment archive, one uniquely named local verification database, and this report. No application source, production configuration, migrations, seeds, event synchronization, or discovery jobs were changed or run.

## Source database

- Connection target from `backend/.env`: `localhost:5432`, database `react_router_dev`, schema `public`, configured role `postgres`. Credentials are intentionally omitted.
- Server: PostgreSQL 18.4, 64-bit Windows. Installed `psql`, `pg_dump`, and `pg_restore` are also version 18.4.
- Database owner: `postgres`; encoding `UTF8`; collation/ctype `English_United States.1252`; connection limit is unlimited (`-1`).
- Only installed extension: `plpgsql` 1.0. No user-defined enums or sequences were found.
- The schema contains 34 indexes, 19 primary-key constraints, 9 foreign keys, and 98 not-null constraints.
- All 15 migration directories in `backend/prisma/migrations` have successful entries in `_prisma_migrations`. That table has 16 rows because `20260918100500_add_discovery_run_persistence_counts` has one rolled-back attempt followed by a successful attempt. No migration command was run during this audit.

### Exact table counts

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
| _prisma_migrations | 16 | | |

The database has foreign keys for `Country.continentId`, `User.roleId`, `Session.userId`, `SavedEvent.userId`, `Notification.userId`, `Activity.userId`, `Upload.userId`, and both `RolePermission` references. `City.countryCode`, `Event.categoryId/countryCode/citySlug`, and `SavedEvent.eventId` are scalar references without database foreign keys. A restore preserves this current schema; it does not repair or normalize those references.

## Backup and restore verification

**New deployment archive**

- Path: `C:\Users\LBG\AppData\Local\ReactRouterDeploymentBackups\react_router_dev_deployment_20261017_111945_421\react_router_dev.dump`
- Format: PostgreSQL custom archive, made with PostgreSQL 18.4 `pg_dump`.
- Size: 1,539,397 bytes.
- SHA-256: `94D74E2D707D45FD76E7F2CD9C54867AAFE45E6DF95E7002423E68C1714C6F56`
- Validation: PostgreSQL 18.4 `pg_restore --list` succeeded and read 81 TOC entries.

Both older archives were also rechecked without modification; each still has 81 TOC entries:

- `C:\Users\LBG\AppData\Local\ReactRouterDbBackups\react_router_dev_20261016_114601500\react_router_dev.dump` — 1,517,486 bytes; SHA-256 `53566FF5D652478D3BD54BE3A92409AC2B968C3B86664FF8DDAD911D794992F5`.
- `C:\Users\LBG\AppData\Local\ReactRouterDbBackups\react_router_dev_recovery_20261016_161024\react_router_dev.dump` — 1,539,397 bytes; SHA-256 `1B2EE6EE215F068F72F385B79DACDA03028FB70D2E2784CF79ABFBD2F48834B1`.

**Isolated restore test:** The new archive restored successfully into the newly created database `react_router_dev_deploy_verify_20261017_112200`. The original source and prior verification databases were not used as restore targets. All 19 tables had matching counts and matching deterministic full-row JSONB fingerprints between source and restored database; there were zero table or row-content differences. This included all country, city, event, upload, user, and migration rows.

Representative data checks found country codes `AF`, `AZ`, and `PK`, and city `az-baku` / Baku. Counts and row fingerprints covered all 1,136 event rows and all 195 countries / 1,331 cities, not just those samples.

## Roles, migrations, and hosted dependencies

- Current non-system roles include `postgres` (login, superuser, createdb, createrole) and `odoo` (login, not superuser, createdb). No role memberships or default ACL entries were found. The purpose of `odoo` was not established in this audit.
- The application’s local URL uses the `postgres` superuser. Do not reuse that credential for a hosted application runtime.
- The database archive does not create cluster-wide login roles or transfer their password hashes. No globals/password-hash dump was created. The destination’s provider-managed roles and grants must be configured separately; preserve only the minimum required permissions.
- The hosted server should use PostgreSQL 18 for the closest compatibility. A different major version requires a separate compatibility restore test; do not assume a PostgreSQL 18 archive can be restored safely to an older server. Match UTF8 and test collation-dependent ordering because the source uses a Windows collation.
- The Prisma schema uses PostgreSQL and `DATABASE_URL`; there is no `directUrl` declaration. Use a direct, TLS-enabled database endpoint for restore and Prisma migration checks, not a transaction-pooled endpoint unless the provider documents compatibility.
- No deployment descriptor (Docker/Compose, Render, Railway, Fly, Vercel, Netlify, or Procfile) was found. `src/config/runtime.ts` defaults the frontend API base to `http://localhost:4001`; `VITE_API_BASE_URL` must be set at frontend build time. Backend port defaults to `4001`.

## Image and upload references

- Fastify serves `backend/public/Images` at `/images/`. This tree currently contains 2,841 files totaling 555,796,105 bytes. These files are separate from the PostgreSQL archive and must be packaged or migrated to durable object storage / a persistent volume with paths preserved.
- Country image references come from country profile JSON and backend static-file resolution. 150 country profiles have a `heroImageUrl`; 16 have a `flagImageUrl`. The `importantHistoricalEvents` profile key is present on 183 country rows, but is JSON null on 182 and a string on one. There is no dedicated `HistoricalEvent` table/model; the general `Event` table contains 1,136 rows.
- City profiles contain 758 `heroImageUrl` values and 132 `thumbnail` values. The `City.countryCode` association is not enforced by a foreign key.
- `Event.image` is a scalar URL/path: 1,124 values are nonempty, of which 952 begin with `/images/` and 172 are external HTTP URLs. The external URLs still depend on third-party availability and permissions.
- All 19 `User.avatarUrl` values are empty.
- `Upload` stores metadata (`fileKey`, `url`, type, size, user reference), not file bytes. Upload writes go to `backend/public/Images/uploads/<userId>/...`; that is local filesystem storage and may be ephemeral or instance-local on hosting. Only 2 of 3 upload URLs currently resolve to local files, and both present files match the stored sizes. One row has zero-byte metadata and no corresponding file, as noted in the prior recovery report. It was not changed.

## Destination-neutral migration plan

1. **Approve the host and target first.** Confirm provider, PostgreSQL major version, region, networking, TLS, persistent/object storage, and the target database name. No remote database has been created.
2. **Provision an empty UTF8 database and least-privilege roles.** Use a provider administrator for provisioning/restore, a migration/owner role for schema changes, and a non-superuser runtime role for application DML. Set `CONNECT`, `USAGE` on `public`, and required table/sequence privileges. Do not copy local superuser credentials. This source currently has no sequences, but grant sequence privileges for future Prisma migrations.
3. **Check the archive before restore and use an empty destination.** Keep the original archive immutable and confirm its checksum on the transfer destination. With PostgreSQL 18 client tools, restore without source ownership/ACLs so managed-host role names do not need to match:

   ```sh
   pg_restore --list "$BACKUP"
   pg_restore --no-owner --no-acl --exit-on-error --verbose \
     --dbname="$TARGET_DATABASE_URL" "$BACKUP"
   ```

   Do not use `--clean` or `--create`; if the target is not empty, provision a new empty database instead of overwriting it. Supply the target URL from the hosting secret manager with provider-required TLS options; never put credentials in source control or command history.
4. **Check Prisma state, do not blindly migrate.** The restored archive already contains schema, records, and migration history. Against a non-production clone, inspect with `npx prisma migrate status` from `backend`. Do not run `migrate reset`, seed scripts, event synchronization, or discovery. Run `prisma migrate deploy` only if a separately reviewed migration is intentionally required and after taking a target backup.
5. **Move media independently.** Copy all required files from `backend/public/Images` preserving relative paths, or migrate them to approved durable object storage and ensure URLs resolve through the production API/CDN. Test every stored local image path and upload access after restart and across instances. Decide how to handle the already-missing upload without deleting or rewriting its database row during this migration.
6. **Configure runtime secrets and origins.** Set the backend `DATABASE_URL` to the hosted direct connection URL, rotate/set JWT secrets in the provider’s secret manager, set `NODE_ENV=production` and the hosting port, and build the frontend with the production `VITE_API_BASE_URL`. Define allowed CORS origins. Keep `EVENT_SYNC_ENABLED=false` and `EVENT_SYNC_RUN_ON_START=false` for restore/rehearsal; the previous recovery report found local event sync enabled, so assign any future sync schedule explicitly before enabling it.
7. **Validate a staging restore before cutover.** Compare table counts and full-row checksums, migration status, key country/city/event and upload metadata, foreign keys, image requests, authentication, and upload reads. Verify durable storage after restart. Retain the source database and old deployment until sign-off.
8. **Rollback without overwriting data.** Before cutover, take a separate target backup and record its hash. Keep the previous deployment/configuration available. If validation fails, route traffic back to the prior API/frontend and database endpoint; preserve the failed target for diagnosis. Correct by restoring to a new database rather than dropping or cleaning an existing one.

## Remaining risks / go-live blockers

- Hosting provider, destination, credentials, TLS/network policy, and database region are undecided and require approval.
- One of three uploaded binaries is missing; uploaded files are not in the PostgreSQL dump and local runtime storage is not durable by default.
- 172 event image values reference external HTTP URLs; their future availability and licensing are not verified. Local image path presence/visual identity was not exhaustively revalidated in this audit.
- Country historical-event profile data is largely null and is not normalized into a dedicated table. Preserve as-is; no data repair was performed.
- Event sync/discovery ownership and production policy remain unresolved. The prior report also identifies a source-only event and discovery-run provenance difference from an older restore baseline; this backup captures the current source and does not reconcile those rows.
- Provider collation may differ from the source Windows collation. Test sorting/search behavior and index compatibility on the chosen target before launch.

## Commands used for this local backup

The actual archive was created with PostgreSQL 18.4 `pg_dump` in custom format and validated with `pg_restore --list`. To recheck the recorded artifact on Windows:

```powershell
$backup = 'C:\Users\LBG\AppData\Local\ReactRouterDeploymentBackups\react_router_dev_deployment_20261017_111945_421\react_router_dev.dump'
Get-FileHash $backup -Algorithm SHA256
& 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' --list $backup
```

No command in this report creates or connects to a hosted destination.
*** End Patch