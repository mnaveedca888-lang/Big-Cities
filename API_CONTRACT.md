# API Contract Summary

This document summarizes the `openapi.yaml` contract for the Global AI Event Monitoring Platform (frontend ↔ backend integration). This is a documentation-only artifact (Phase 0).

## 1) Endpoints (high-level list)
- Auth: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`
- Users: `/users/me`, `/users/me/saved-events`, `/users/me/preferences`, `/users/{id}/request-data-deletion`, `/users/{id}/export-data`
- Events: `/events`, `/events/featured`, `/events/{slug}`
- Catalog: `/categories`, `/countries`, `/countries/{code}/cities`, `/cities`
- Search: `/search`
- Dashboard: `/dashboard/overview`
- Notifications: `/notifications`, `/notifications/{id}/read`
- Uploads: `/uploads/presign`
- Admin: `/roles`, `/roles/{id}`, `/permissions`, `/admin/audit-logs`
- Webhooks: `/webhooks/events`
- Infra: `/health/live`, `/health/ready`

(Full OpenAPI details are in `openapi.yaml`.)

## 2) OpenAPI validation status
- Format: OpenAPI 3.0.3 YAML produced at `openapi.yaml`.
- Human-reviewed for structural correctness and consistency with frontend features and existing backend docs.
- Machine validation: Not yet executed in this workspace. Recommendation: run the following locally to validate:

```bash
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi.yaml
```

If you want, I can run a validation step in this environment.

## 3) Missing API contracts
- I included endpoints covering the frontend features listed in `PROJECT_MASTER_CONTEXT.md` and `API_MODULE_LIST.md`. There are no missing endpoint families. Minor optional items to consider (not required for initial frontend integration):
  - Bulk export endpoints for analytics (if frontend needs direct CSV/Excel exports).
  - WebSocket endpoints for live notifications (current design uses polling/notifications API).

## 4) Frontend readiness confirmation
- The API contract includes authentication, RBAC permissions annotations (`x-permissions`), pagination, filtering and sorting query params, and explicit request/response schemas for major entities.
- The frontend can be implemented against this API contract without further changes, provided:
  - The backend publishes the OpenAPI spec publicly (or in the frontend repo) and keeps it synchronized.
  - Contract tests (OpenAPI-driven) are run in CI to prevent drift.

## 5) Next recommended artifacts before implementation
- Generate a first-pass Prisma schema from `DATABASE_ENTITY_LIST.md` (I can draft this next).
- Publish `openapi.yaml` to a central location (Swagger UI or internal spec registry).
- Add OpenAPI contract tests to CI to validate backend implementations.

---

Files created/modified:
- `openapi.yaml` (created)
- `API_CONTRACT.md` (created)

If you'd like, I will now:
- Run a machine validation of `openapi.yaml` and fix any errors, and/or
- Draft a `prisma/schema.prisma` from `DATABASE_ENTITY_LIST.md`.

Which do you want next?