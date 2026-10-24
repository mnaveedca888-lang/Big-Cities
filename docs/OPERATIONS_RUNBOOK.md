# Operations runbook

## Local development

1. Open the repo in the project root.
2. Install dependencies for the frontend and backend if needed.
3. Start the frontend with `npm run dev`.
4. Start the backend from the `backend` folder with `npm run dev`.
5. Set local env vars in `backend/.env` for a local Postgres and any Safe local storage configuration.

## Safe staging setup

1. Confirm the staging database is isolated from production.
2. Set `DATABASE_WRITES_ENABLED=false` until approval is granted.
3. Set `UPLOADS_ENABLED=false` until the storage configuration is verified.
4. Set `UPLOAD_STORAGE_DRIVER=local` or `s3` only after provider validation.
5. Keep `ENABLE_STAGING_CANDIDATE_CORS=false` unless testing the isolated candidate origin.

## Build and test

Run the following from the repo root:

- `npm run typecheck`
- `npm run build`
- `npm test`

Targeted backend verification:

- `npx vitest run backend/src/uploads/upload-storage.test.ts backend/src/staging-write-routes.test.ts`

## Verify health and CORS

- backend health endpoints: `/health/live` and `/health/ready`
- login: `/auth/login`
- upload routes: `/uploads/files`, `/uploads/presign`
- static route: `/images/...`

If CORS fails, confirm the exact origin in [backend/src/cors.ts](../backend/src/cors.ts) and verify `ENABLE_STAGING_CANDIDATE_CORS=true` only for the intended staging candidate.

## Upload test flow

1. confirm isolated staging DB
2. confirm all S3/R2 env values in the provider secret manager
3. set `UPLOAD_STORAGE_DRIVER=s3`
4. set `UPLOADS_ENABLED=true`
5. set `DATABASE_WRITES_ENABLED=true`
6. log in with an authorized staging account
7. upload a harmless test image
8. verify the object exists in the bucket via the backend path and browser view
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
- check local fallback paths when the driver is `local`

### Database
- verify `DATABASE_URL`
- confirm the database is staging-only and separate from production
- ensure the service can connect before enabling write routes

## Production protection

- do not deploy to production
- do not touch main
- do not alter traffic, database, or storage configuration in production
- maintain staging-only config and isolated validation flow
