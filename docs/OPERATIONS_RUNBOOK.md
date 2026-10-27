# Operations runbook

## Local development

1. Open the repo in the project root.
2. Install dependencies for the frontend and backend if needed.
3. Start the frontend with `npm run dev`.
4. Start the backend from the `backend` folder with `npm run dev`.
5. Set local env vars in `backend/.env` for a local Postgres. Uploads remain disabled unless an authorized R2 test bucket is configured.

## Safe staging setup

1. Confirm the staging database is isolated from production.
2. Set `DATABASE_WRITES_ENABLED=false` until approval is granted.
3. Set `UPLOADS_ENABLED=false` until the storage configuration is verified.
4. Leave `UPLOAD_STORAGE_DRIVER=disabled` until the R2 endpoint, bucket, credentials, and staging DB isolation are verified; then use `r2` (or the compatible `s3` alias).
5. Keep `ENABLE_STAGING_CANDIDATE_CORS=false` unless testing the isolated candidate origin.

## Hostless staging backend build

- The backend has its own `backend/package.json` and `backend/package-lock.json`; the repository-root manifest is for the frontend. Check the backend dependency from the backend directory with `npm ls @aws-sdk/client-s3 --depth=0`, not from the monorepo root.
- Configure the staging Hostless app to build the migration branch with `working_directory: backend` and `build_context_directory: /`. The backend build steps are `npm ci && npx prisma generate`, followed by `npm run build`; the package start script is `node dist/main.js`.
- The repository does not currently contain a `hostless.yaml`, so the deployed branch and Hostless working/build directories must be confirmed in the staging app settings before release. Do not copy these settings to production.

## Build and test

Run the following from the repo root:

- `npm run typecheck`
- `npm --prefix backend run typecheck`
- `npm run build`
- `npm test`

Targeted backend verification:

- `npx vitest run backend/src/uploads/upload-storage.test.ts backend/src/staging-write-routes.test.ts`

## Verify health and CORS

- backend health endpoints: `/health/live` and `/health/ready`
- login: `/auth/login`
- upload route: `/uploads/files` (supported multipart route)
- presign route: `/uploads/presign` (intentionally returns `501`)
- private uploaded images: `/images/uploads/*`
- static route: `/images/...`

If CORS fails, confirm the exact origin in [backend/src/cors.ts](../backend/src/cors.ts) and verify `ENABLE_STAGING_CANDIDATE_CORS=true` only for the intended staging candidate.

## Upload test flow

1. confirm isolated staging DB
2. confirm all S3/R2 env values in the provider secret manager
3. set `UPLOAD_STORAGE_DRIVER=r2`
4. set `UPLOADS_ENABLED=true`
5. set `DATABASE_WRITES_ENABLED=true`
6. log in with an authorized staging admin account
7. upload a harmless test image
8. verify the object exists in the bucket via the private backend path and browser view
9. refresh and confirm persistence
10. restore the staging safety flags after the test, if required

## Backup and rollback

- do not restore production dumps into production without explicit approval
- keep a verified backup of the staging database before any write-based test
- use the smallest possible record for validation
- prefer no-op or read-only verifications when the environment is not isolated

## Common diagnosis

### CORS
- inspect `ENABLE_STAGING_CANDIDATE_CORS`
- confirm the request origin is exactly in the allowlist
- verify preflight requests are accepted

### Auth
- verify JWT secret configuration
- verify bearer token format and permissions
- check 401/403 handling and expired token behavior

### Storage
- verify `UPLOAD_STORAGE_DRIVER` and `OBJECT_STORAGE_*` values
- confirm bucket existence and permissions
- uploads fail closed when R2 is not configured; there is no local filesystem fallback
- from a backend runtime shell with the staging environment loaded, run `npm run build` then `npm run check:r2:read-only`
- the read-only check lists at most one key internally and reads at most one byte; it never prints keys or credentials
- the read-only check cannot prove write permission; its output explicitly keeps `writePermissionVerified` false
- the local inventory dry run is `npm run build` followed by `npm run migrate:images:r2 -- --batch-size 100`; it does not contact R2 or change the inventory
- read-only staging reconciliation is `npm run build` followed by `npm run reconcile:images:r2`; it requires the inventory file, a staging-only `DATABASE_URL`, and R2 list access
- when the inventory is not present in the backend runtime, after the reconciliation code is available there run `npm run reconcile:images:r2 -- --inventory-url https://raw.githubusercontent.com/mnaveedca888-lang/Big-Cities/bcd4ae73629b0a771758e16995090c9b878f17be/docs/R2_IMAGE_MIGRATION_INVENTORY.csv`
- reconciliation uses a PostgreSQL read-only transaction and R2 `ListObjectsV2` only; it does not read object bodies, upload/delete objects, or print URLs, identifiers, object keys, or credentials
- the reconciliation report distinguishes database references, local inventory source files, external URLs, present/missing objects, and ambiguous references; it does not verify object read or write permission
- if an approved migration is interrupted, rerun from the first batch; deterministic keys are checked by size and SHA-256 and conditional object creation prevents overwrites
- migration execution remains blocked until explicit approval, backup verification, and database-reference reconciliation

### Database
- verify `DATABASE_URL`
- confirm the database is staging-only and separate from production
- ensure the service can connect before enabling write routes

## Production protection

- do not deploy to production
- do not touch main
- do not alter traffic, database, or storage configuration in production
- maintain staging-only config and isolated validation flow
