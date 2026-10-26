# Environment Variables

This project uses environment variables to control runtime behavior and staging safety. Do not commit real secrets or connection strings to the repository.

## Required variables

### `DATABASE_URL`
- Purpose: Prisma/Postgres connection string.
- Used by: backend
- Required: yes for all database-backed runtime behavior
- Example: `postgresql://user:password@host:5432/big_cities?schema=public`
- Accepted values: Postgres connection string
- Effect: if missing or invalid, Prisma startup and protected routes will fail
- Scope: staging and production, but must be different for each environment

### `JWT_ACCESS_TOKEN_SECRET`
- Purpose: JWT signing key for access tokens
- Used by: backend auth
- Required: yes for login and authenticated routes
- Example: `replace-with-long-random-secret`
- Accepted values: long random string
- Effect: invalid or missing secret breaks auth
- Scope: staging and production

### `JWT_REFRESH_TOKEN_SECRET`
- Purpose: JWT signing key for refresh tokens
- Used by: backend auth
- Required: yes for refresh sessions
- Example: `replace-with-long-random-secret`
- Accepted values: long random string
- Effect: refresh flow fails when missing or mismatched
- Scope: staging and production

## Staging safety variables

### `DATABASE_WRITES_ENABLED`
- Purpose: enable writes in staging only after isolation is confirmed
- Used by: backend staging write guard
- Required: no
- Accepted values: `true` or `false`
- Effect: `true` allows write routes; `false` blocks them except explicit login/read-only exceptions
- Scope: staging-only default; never set to `true` in production without explicit approval

### `UPLOADS_ENABLED`
- Purpose: enable multipart uploads
- Used by: backend upload routes
- Required: no
- Accepted values: `true` or `false`
- Effect: `true` allows uploads only when the backend sees an authenticated admin and a configured storage driver; `false` blocks uploads
- Scope: staging primarily; keep false until safe verification

### `ENABLE_STAGING_CANDIDATE_CORS`
- Purpose: allow the isolated candidate frontend origin for staging-only browser testing
- Used by: backend CORS configuration
- Required: no
- Accepted values: `true` or `false`
- Effect: when `true`, the exact candidate origin is added to the allowlist; when false, it is denied
- Scope: staging candidate only; must be disabled once the test window ends

### `EVENT_DISCOVERY_ENABLED`
- Purpose: allow remote event discovery
- Used by: backend event discovery routes
- Required: no
- Accepted values: `true` or `false`
- Effect: when false, discovery routes remain blocked
- Scope: staging safety gate

### `EVENT_SYNC_ENABLED`
- Purpose: enable scheduled event sync
- Used by: backend scheduler
- Required: no
- Accepted values: `true` or `false`
- Effect: when true, the scheduler runs only if database writes are enabled
- Scope: staging safety gate

## Object storage variables

### `UPLOAD_STORAGE_DRIVER`
- Purpose: choose the upload backend driver
- Used by: backend upload storage logic
- Required: no
- Accepted values: `r2`, `s3` (S3-compatible alias), `object-storage` (alias), `disabled`
- Effect: `r2` writes to the configured private R2 bucket; `disabled` rejects uploads. The default is `disabled`, and local filesystem storage is not supported.
- Scope: staging or production only after provider permissions and database isolation are verified

### `OBJECT_STORAGE_BUCKET`
- Purpose: object storage bucket name
- Used by: backend upload storage abstraction
- Required: yes when `UPLOAD_STORAGE_DRIVER=r2` or an alias is selected
- Example: `big-cities-staging-images`
- Accepted values: bucket name only
- Effect: if missing, the S3/R2 configuration fails early and safely
- Scope: staging or production depending on deployment

### `OBJECT_STORAGE_ENDPOINT`
- Purpose: object-store endpoint URL
- Used by: backend upload storage abstraction
- Required: yes when S3/R2 is enabled
- Example: `https://<account>.r2.cloudflarestorage.com`
- Accepted values: HTTPS endpoint
- Effect: without this, the backend cannot talk to the bucket
- Scope: staging or production depending on deployment

### `OBJECT_STORAGE_REGION`
- Purpose: bucket region identifier
- Used by: backend upload storage abstraction
- Required: no for R2, but recommended to set to `auto`
- Accepted values: `auto` or a region code
- Effect: missing values may still be accepted by providers that use auto region behavior
- Scope: staging or production

### `OBJECT_STORAGE_ACCESS_KEY_ID`
- Purpose: access key for object store
- Used by: backend upload storage abstraction
- Required: yes when S3/R2 storage is used
- Example: `replace-with-r2-access-key`
- Accepted values: provider access key
- Effect: missing or wrong values cause upload operations to fail safely
- Scope: staging or production

### `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- Purpose: secret key for object store
- Used by: backend upload storage abstraction
- Required: yes when S3/R2 storage is used
- Example: `replace-with-r2-secret`
- Accepted values: provider secret key
- Effect: wrong or missing values prevent object-store writes and reads
- Scope: staging or production

## Frontend variable

### `VITE_API_BASE_URL`
- Purpose: API origin for the browser build
- Used by: frontend runtime and API client
- Required: yes for production and candidate builds
- Example: `https://big-cities-backend-staging.hostless.app`
- Accepted values: absolute API origin URL
- Effect: missing or incorrect value causes the frontend to call the wrong backend or default to a local value in development
- Scope: frontend build-time only

### `VITE_DEPLOYMENT_TARGET`
- Purpose: identify the frontend build boundary
- Used by: frontend runtime guard and build scripts
- Required: yes for candidate and production builds
- Accepted values: `candidate`, `production`, or unset for local development
- Effect: candidate builds are forced to the staging API; production builds fail unless they receive a dedicated non-staging API origin
- Scope: frontend build-time only

## Local development variable notes

- The upload driver defaults to `disabled`; there is no filesystem upload fallback.
- Static legacy assets remain in the repository during migration, but they are not the durable upload store.
- Real secret values must be stored only in the host provider's secure secret settings.

## Runtime route notes

- `POST /uploads/files` is the supported multipart upload route.
- `POST /uploads/presign` intentionally returns `501`; it does not create placeholder upload metadata.
- `GET /images/uploads/*` is served by the backend and keeps the bucket private.
