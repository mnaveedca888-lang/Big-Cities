# Deployment map

## Current verified state

- Production frontend: `https://rough-darkness-07cc.mnaveedca888.workers.dev`
- Candidate frontend: `https://015a9521-rough-darkness-07cc.mnaveedca888.workers.dev`
- Staging backend: `https://big-cities-backend-staging.hostless.app`
- Production API: **not currently identified or approved for source configuration**
- Observed live mapping: production frontend currently calls the staging backend above
- Git branches: `main`, `audit/dashboard-data-managers-20261024`
- Dashboard branch commit verified locally: see the current branch `HEAD`; it remains separate from `main`

## Service map

- Frontend hosting: Cloudflare Workers Static Assets
- Backend hosting: Hostless
- Database: Postgres via Prisma, configuration loaded from `DATABASE_URL`
- Image storage: local static assets and optional S3-compatible object storage

## Git flow

- The main worktree remains dirty and was preserved.
- The dashboard worktree was pushed to `origin/audit/dashboard-data-managers-20261024`.
- No production traffic, main-branch merge, or production env changes were made during this work.

## What is provider-side and still requires verification

The following remain unverified because live provider access was not available in this session:

- deployed Hostless backend revision
- actual staging database identity and isolation status
- specific R2 bucket credentials and permissions
- Hostless environment variable values, including the actual `DATABASE_URL` target
- actual Cloudflare Worker deployment configuration for the candidate build
- production Worker currently requests the staging backend and requires an approved API separation before any production redeploy

These should be checked in the provider UI or secure environment settings before enabling staging writes or uploads.

## Production safety boundaries

- do not alter production frontend env vars
- do not alter production backend env vars
- do not merge to `main`
- do not push unrelated branches to production
- do not enable public R2 access
- do not change production traffic configuration
- do not enable `DATABASE_WRITES_ENABLED` or `UPLOADS_ENABLED` until staging database isolation is confirmed
- do not run `npm run build:production` without an approved dedicated production API URL

## Candidate-only testing boundary

The candidate origin is intentionally gated by `ENABLE_STAGING_CANDIDATE_CORS`. This is a staging and testing control, not a production setting.

The candidate workflow must stay isolated and should be disabled again once validation is complete.

Use `npm run build:candidate` for the candidate Worker. It writes the static bundle to the directory referenced by the candidate Wrangler configuration and forces the staging API origin. Use `npm run build:production` only after `VITE_API_BASE_URL` has been approved as a dedicated production API origin; the command fails closed for staging, preview, candidate, or missing URLs.
