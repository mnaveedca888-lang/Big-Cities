# Image storage

## Storage sources in this repo

The migration is not complete. The project currently has multiple image sources:

- static assets from `backend/public/Images` and related frontend asset directories
- `/images/...` URLs served by the backend static plugin
- DB-backed metadata references stored in Prisma upload and content records
- optional private bucket storage via S3-compatible R2 config

This repository still contains local image files and static app assets that work without provider-side credentials.

## Known implementation

The current upload route in [backend/src/uploads/uploads.controller.ts](../backend/src/uploads/uploads.controller.ts) validates file type and size, then writes files via the storage abstraction in [backend/src/uploads/upload-storage.ts](../backend/src/uploads/upload-storage.ts).

The upload storage adapter supports:

- `r2` (or S3-compatible aliases): writes to the configured private R2 bucket
- `disabled` (the default): blocks uploads safely

Filesystem upload storage has been removed. Existing static image assets and their routes are deliberately retained until every required object is present and verified in R2.

The frontend uses [src/utils/imageValidation.ts](../src/utils/imageValidation.ts) to normalize image URLs and reject unsafe or malformed paths. The browser then renders safe images via [src/components/ui/safe-image.tsx](../src/components/ui/safe-image.tsx).

## Required private-bucket behavior

When the staging configuration is approved and isolated, the bucket should remain private:

- browser should not fetch object storage directly
- backend should read from the object store and return the object bytes with the correct MIME type
- uploaded objects are read through `GET /images/uploads/*`; the route does not expose an R2 URL or credentials
- object keys should be sanitized and collision-resistant
- failed uploads should not leave misleading database records
- missing objects should return clear no-file errors without exposing credentials or internal paths

## Verified local status

The local implementation is verified to:

- keep uploads blocked by default when R2 is not configured
- reject empty and oversized files
- reject unsupported MIME types
- validate image signatures and filename extensions before storage
- use sanitized object keys and prevent path traversal
- remove stored bytes when database metadata creation fails

The live provider-side object-store connection remains unverified because the local workspace has no R2 credentials and the shared bucket dashboard request returned 403.

## Staging-only image workflow

The safe workflow is:

1. confirm the isolated staging database and create a verified database backup
2. enumerate all local image files and database references, including user/upload rows
3. copy each required file to the private bucket without deleting source files
4. verify object keys, byte sizes, and SHA-256 checksums before changing references
5. take a reversible snapshot of the affected database image fields
6. update only references whose replacement objects have been verified
7. verify API/browser retrieval and roll back affected values if any check fails
8. enable staging uploads only after the credentialed upload and retrieval tests pass

Never expose the bucket publicly or enable production traffic during this flow.

The presign endpoint is intentionally unsupported until a complete direct-upload protocol is designed and tested. Use the authenticated multipart route instead.

## Recovery point and current migration status

The isolated worktree started clean at commit `3d3e578ed9ae8d70734444e159422dee68cb9f6b` on `feat/r2-image-storage-20261026`. All source image files remain in the worktree; no database references or bucket objects have been changed. To roll back code, restore only the migration commit after preserving any subsequent edits. For a data rollback, restore only the backed-up image-reference columns/rows after confirming the snapshot matches the staging database; never restore a production dump or delete bucket objects as part of rollback.

On 2026-10-26, the workspace inventory found 3,295 image files (652,197,997 bytes) across backend, data, review, rejected-candidate, and frontend directories: 1,002 `.jpg`, 7 `.jpeg`, 2,261 `.webp`, 24 `.png`, and 1 `.svg`. SHA-256 identified 554 duplicate groups (675 copies beyond the first). These are repository-level file facts, not a validated set of images required by the live database.

Read-only staging API checks exposed 195 countries, 1,299 cities, and 952 events. Their 2,918 nonempty image-valued fields all resolve to existing local source files; no external or missing source references were found in those public records. The API does not expose private user/upload rows. R2 inventory, object checksums, private user/upload references, and a database backup are still unverified; do not remove local assets or switch static image serving until these steps are complete.

The per-file source-path, size, checksum, and duplicate inventory is in [R2_IMAGE_MIGRATION_INVENTORY.csv](./R2_IMAGE_MIGRATION_INVENTORY.csv). Every row is currently marked `not_copied`.
