# Deployment map

## Current verified state

- Production frontend: `https://rough-darkness-07cc.mnaveedca888.workers.dev`
- Candidate frontend: `https://015a9521-rough-darkness-07cc.mnaveedca888.workers.dev`
- Staging backend: `https://big-cities-backend-staging.hostless.app`
- Git branches: `main`, `audit/dashboard-data-managers-20261024`
- Dashboard branch commit verified locally: `27603d9e248922d5a74aa69d0f2b93a0dd4bb095`

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
- actual Cloudflare Worker deployment configuration for the candidate build

These should be checked in the provider UI or secure environment settings before enabling staging writes or uploads.

## Production safety boundaries

- do not alter production frontend env vars
- do not alter production backend env vars
- do not merge to `main`
- do not push unrelated branches to production
- do not enable public R2 access
- do not change production traffic configuration

## Candidate-only testing boundary

The candidate origin is intentionally gated by `ENABLE_STAGING_CANDIDATE_CORS`. This is a staging and testing control, not a production setting.

The candidate workflow must stay isolated and should be disabled again once validation is complete.
