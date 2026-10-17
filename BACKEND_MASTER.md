# BACKEND_MASTER

## Table of contents
- Overview
- Technology stack
- Architecture summary
- Folder layout
- Database design and entities
- Relationships and constraints
- Authentication & authorization
- API architecture and conventions
- Endpoints inventory (summary)
- Business rules & validation strategy
- Security
- Logging & monitoring
- Caching & performance
- Queue & background jobs
- Deployment & environment variables
- Roadmap & phases
- Operational notes & runbooks
- Appendix: OpenAPI and archived docs

---

## Overview
This document consolidates backend architecture, API contracts, database design, and operational guidance for the Global AI Event Monitoring Platform. It is a design-only artifact and must be used as the single source of truth for backend planning and handoff.

---

## Technology stack
- Language: TypeScript (Node 20+)
- Framework: NestJS (Fastify) recommended
- DB: PostgreSQL
- ORM: Prisma (recommended)
- Cache/queue: Redis + BullMQ
- Search: Meilisearch (or Elasticsearch if advanced features required)
- Storage: S3-compatible object store
- Observability: OpenTelemetry, Prometheus, Grafana
- Logging: Pino/Winston aggregated to ELK/Opensearch or SaaS
- CI/CD: GitHub Actions or similar

---

## Architecture summary
- Modular domain-driven layout: `auth`, `users`, `events`, `catalog`, `search`, `dashboard`, `analytics`, `notifications`, `admin`, `uploads`, `jobs`, `common`, `infra`.
- Stateless HTTP servers; Redis for caches and job queues; background workers for indexing and emails.
- OpenAPI-driven API definitions and contract testing.

---

## Folder layout (opinionated)
See `backend/` structure in original doc (archived). Key folders: `src/auth`, `src/users`, `src/events`, `src/catalog`, `src/search`, `src/dashboard`, `src/analytics`, `src/notifications`, `src/admin`, `src/uploads`, `src/jobs`, `src/db` (Prisma), `infra`, `docker`.

---

## Database design and entities
Primary entities (use `uuid` for PKs where appropriate):
- `users` (id, email, name, password_hash, role_id, avatar_url, is_email_verified, createdAt, updatedAt)
- `roles` (id, name, description)
- `permissions` (id, permission, description)
- `role_permissions` (role_id, permission_id)
- `sessions` (refresh token storage hashed)
- `events` (id, slug, title, description, category, country, city, tags JSONB or normalized, featured, start/end timestamps)
- `categories`, `countries`, `cities`
- `saved_events` / `watchlist`
- `notifications`
- `activities` (recentActivity)
- `uploads`
- `analytics_events` / aggregates
- `audit_logs`

Indexes & constraints: unique email, slug unique, GIN index for tags JSONB if used; foreign keys and created_at/updated_at timestamps on all rows.

---

## Relationships and constraints
- `users.role_id` → `roles.id`
- `events.category_id` → `categories.id`
- `events.country_code` → `countries.code`
- `cities.country_code` → `countries.code`
- `saved_events.user_id` + `event_id` unique
- `role_permissions` composite PK (role_id, permission_id)

---

## Authentication & Authorization
- JWT access tokens (short TTL) + refresh tokens persisted (hashed) with rotation and revocation
- Passwords hashed with Argon2id or bcrypt
- RBAC: `roles` + `permissions`, `can(user, permission)` helper, cache role->permission mapping in Redis
- Email verification and password reset use time-limited tokens

---

## API architecture and conventions
- Base path: `/api/v1`
- Response envelope: `success/data/meta` pattern
- Errors: structured `success:false, error:{code,message,details}`
- Validation: DTOs validated with `zod`/`class-validator`, return 400 with structured errors
- Pagination: support offset (`page`, `perPage`) and cursor (`cursor`, `limit`) where appropriate
- Filtering/sorting: query params like `?category=ai&country=US&page=1&sort=startAt:asc`
- Rate limiting: Redis-backed per-IP, per-user rules; stricter limits for auth endpoints
- OpenAPI: `openapi.yaml` exists at project root for contract testing and Swagger UI

---

## Endpoints inventory (summary)
Auth
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`

Users
- `GET /users/me`, `PATCH /users/me`
- `GET /users/me/saved-events`, `POST /users/me/saved-events`, `DELETE /users/me/saved-events/:eventId`
- `GET /users/me/preferences`, `PATCH /users/me/preferences`
- `POST /users/:id/request-data-deletion`, `GET /users/:id/export-data`

Events
- `GET /events`, `POST /events` (admin), `GET /events/featured`, `GET /events/{slug}`, `PATCH /events/{slug}`, `DELETE /events/{slug}`

Catalog
- `GET /categories`, `GET /countries`, `GET /countries/{code}/cities`, `GET /cities`

Search
- `GET /search` (query, filters, pagination)

Dashboard
- `GET /dashboard/overview`

Notifications
- `GET /notifications`, `POST /notifications` (admin/event-driven), `PATCH /notifications/{id}/read`

Uploads
- `POST /uploads/presign`

Admin
- `GET /roles`, `POST /roles`, `PATCH /roles/{id}`, `GET /permissions`, `GET /admin/audit-logs`

Webhooks
- `POST /webhooks/events` (HMAC validated)

Infra
- `GET /health/live`, `GET /health/ready`

(Full OpenAPI spec available in `openapi.yaml`)

---

## Business rules & validation strategy
- Validation performed at DTO boundary using `zod`/`class-validator` and returned as structured errors.
- Business rules enforced in service layer with unit tests.
- Idempotency for write endpoints where necessary (uploads, webhooks).
- Audit-critical actions log to `audit_logs` with user, ip, action, and metadata.

---

## Security
- Input validation and sanitization at DTO layer
- Use parameterized queries (Prisma) to prevent SQL injection
- Short-lived JWTs and hashed refresh tokens with rotation
- Rate limiting and WAF at API gateway
- Secrets stored in KMS / Secret Manager; local `.env` only for development
- Audit logging and monitoring for suspicious activity

---

## Logging & monitoring
- Structured logs (JSON) using Pino/Winston
- Tracing with OpenTelemetry, metrics to Prometheus, dashboards in Grafana
- Alerting for SLO breaches, high error-rates, queue backlog, DB replication lag

---

## Caching & performance
- Redis caches for read-heavy endpoints and permissions cache
- CDN for static assets
- Background indexing for search
- DB indexes as specified, read replicas for analytics workloads

---

## Queue & background jobs
- BullMQ workers for email, search indexing, analytics aggregation, webhook retries
- Dead-letter queue strategy and observability for failed jobs

---

## Deployment & environment variables
Representative env vars (see archived docs):
- `DATABASE_URL`, `REDIS_URL`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, `EMAIL_PROVIDER_*`, `MEILISEARCH_URL`, `OTEL_EXPORTER_URL`, `NODE_ENV`.

Deploy via Docker/Kubernetes; provide `docker-compose` for local dev with Postgres, Redis, Meilisearch/Elasticsearch, MinIO.

---

## Roadmap & phases
See `BACKEND_DEVELOPMENT_ROADMAP.md` archived in `docs/archived/` for phased plan (Phase 0..7). Key: complete foundation (Prisma, migrations, CI) then Auth/Users, Events/Catalog, Search, Dashboard/Notifications, Analytics/Admin, then Hardening.

---

## Operational notes & runbooks (summary)
- Backup schedule: daily snapshots + weekly full backups, retention policy to be defined.
- Restore runbook: documented steps for restoring from snapshot to staging, verify data integrity.
- Secrets rotation cadence: quarterly or on compromise.
- Incident response playbook: alerting channels, on-call runbook, token/key rotation steps.

---

## Appendix: OpenAPI & archived docs
- `openapi.yaml` contains the complete, machine-readable API contract (created). Use it to generate server/client stubs and run contract tests.
- Original documentation files archived in `docs/archived/`.

---

## Location Data
- **Data source:** `Data/Big City Info (1).xlsx` (Excel). Do not modify the source file; scripts read it as input.
- **Continents:** 6 (Asia, Africa, North America, South America, Europe, Australia)
- **Countries imported:** 195
- **Seed script:** `backend/scripts/seed_locations.js` — reusable script that reads the Excel, upserts `Continent` records, and upserts `Country` records assigning each country to the continent sheet where it appears. The script does not hardcode country lists; it derives them from the sheet headers.
- **Verification script:** `backend/scripts/verify_locations.js` — runs integrity checks (counts, null `continentId`, duplicate codes/names, foreign key existence) against PostgreSQL.

Use `npm run seed` to import location data and `npm run verify:locations` to run verification checks.

This `BACKEND_MASTER.md` is the consolidated authoritative backend document. For implementation, generate `prisma/schema.prisma` from the entity list and publish `openapi.yaml` to a spec registry for contract testing.
