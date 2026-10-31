# Image storage

## Storage sources in this repo

The project currently uses multiple image sources:

- static assets from `backend/public/Images` and related frontend asset directories
- `/images/...` URLs served by the backend static plugin
- DB-backed metadata references stored in Prisma upload and content records
- optional private bucket storage via S3-compatible R2 config

This repository still contains local image files and static app assets that work without provider-side credentials.

## Known implementation

The current upload route in [backend/src/uploads/uploads.controller.ts](../backend/src/uploads/uploads.controller.ts) validates file type and size, then writes files via the storage abstraction in [backend/src/uploads/upload-storage.ts](../backend/src/uploads/upload-storage.ts).

Raster uploads are decoded with Sharp after MIME, extension, and signature checks, with a 20-megapixel input limit to reject truncated or malformed content and reduce decompression-bomb exposure.

Country hero and flag replacements use `POST /countries/:code/images`. The dashboard keeps selected files local until Save, uploads both requested fields independently, reads each object back from the active S3/R2 driver, then saves the `Country.profile.heroImageUrl` and `Country.profile.flagImageUrl` references together with Upload metadata in a Prisma transaction. A failed storage or database operation leaves the previous country references intact and removes, or queues cleanup for, newly uploaded objects.

City and event uploads continue to use `POST /uploads/files`; their returned `/images/uploads/...` references are stored in the city profile or event image field. The backend accepts these persistent references only while the S3/R2 driver is active and serves object bytes through `GET /images/uploads/*`.

The storage adapter supports:

- `local`: writes under `backend/public/Images/uploads`
- `s3`: writes to a private S3/R2-compatible bucket
- `disabled`: blocks uploads safely

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

- keep uploads blocked while staging safety remains off
- reject empty and oversized files
- reject unsupported MIME types
- validate image signatures and filename extensions before storage
- use sanitized object keys and prevent path traversal
- remove stored bytes when database metadata creation fails
- keep country hero and flag updates in one database transaction and verify stored bytes before success
- preserve safe private-object references when country, city, and event records are read or updated

These are code-level guarantees and mocked regression tests. The live provider-side bucket, Neon destination, object keys, checksums, and browser rendering remain unverified until the staging backend's provider configuration can be independently tied to the staging Neon project and the `big-cities-staging-images` bucket.

## Staging-only image workflow

The safe workflow is:

1. confirm isolated staging database
2. set approved staging env vars for the bucket and backend
3. enable uploads only in staging
4. upload a harmless test image
5. confirm metadata persists in Prisma
6. fetch the image via the private backend route
7. confirm the browser renders it with refresh persistence

Never expose the bucket publicly or enable production traffic during this flow.

The presign endpoint is intentionally unsupported until a complete direct-upload protocol is designed and tested. Use the authenticated multipart route instead.

## Image lifecycle and cleanup

The Prisma migration `20261031120000_add_image_cleanup_outbox` installs image-reference triggers and an `ImageCleanupJob` outbox. Triggers serialize image-reference changes and cleanup decisions with one transaction-scoped PostgreSQL advisory lock. They cover recursive image-like fields in country and city profiles, event images, and user avatars. When a managed image reference is replaced or its record is deleted, the old object key is queued in the same database transaction. Upload metadata is used to establish that the object is application-managed; it is not treated as an indefinite live reference.

The cleanup worker checks all live database references while holding the same lock, then marks an object as deleting before calling the configured object-storage driver. Database triggers reject new references while deletion is in progress. This avoids a check-then-delete race; if R2 deletion or recording its completion fails, the job remains retryable and the object remains blocked from new references until deletion is confirmed. R2 deletes are idempotent.
Enqueue paths never reset a job already marked `deleting`, so an upload-expiry scan or concurrent database trigger cannot reopen a reference while an object-store deletion is in flight.

Generic `/uploads/files` records receive an `expiresAt` based on `UNATTACHED_UPLOAD_GRACE_HOURS` (default 24 hours, allowed range 1–720). The worker only queues expired, unattached metadata; it never queues a directly referenced image. The default `IMAGE_CLEANUP_ENABLED=false` is deliberately fail-closed. Cleanup runs only after that switch is explicitly enabled in an approved environment with the migration applied. This implementation does not execute the migration, inspect or delete live R2 objects, or change deployment settings.

Every cleanup entry point additionally requires `UPLOAD_STORAGE_DRIVER=s3` (the `r2` alias resolves to `s3`); local or unrecognized drivers are refused. If the R2 delete succeeds but recording completion fails, or if retry state cannot be persisted, the process temporarily skips that key for 60 seconds to prevent tight retry loops. The durable `deleting` job remains eligible after restart and is safe to retry because object deletion is idempotent.

Older objects without corresponding `Upload` metadata are deliberately not auto-deleted. They require a separate read-only inventory and human-approved cleanup plan. Uploaded images with external references outside the application's Neon database cannot be detected automatically.

The PostgreSQL migration integration test requires `IMAGE_LIFECYCLE_TEST_DATABASE_URL` to point only to a loopback PostgreSQL database named `big_cities_image_lifecycle_test`; it drops and recreates that database's `public` schema before applying the migration. It uses mocked storage and never accesses R2. Run it only against a disposable local database.
