# Image storage

## Storage sources in this repo

Image metadata and binaries are stored separately:

- `/images/...` references identify catalog or upload objects in a private S3-compatible bucket
- the backend fetches those objects and serves them through its `/images/*` routes
- `backend/src/images/catalog-image-keys.json` contains catalog object-key metadata, not image binaries
- essential frontend assets remain bundled with the frontend
- DB-backed metadata references stored in Prisma upload and content records

Catalog binaries are not served from the backend filesystem. The catalog image index lets country, city, and event logic preserve existing object paths without requiring local copies.

## Known implementation

The current upload route in [backend/src/uploads/uploads.controller.ts](../backend/src/uploads/uploads.controller.ts) validates file type and size, then writes files via the storage abstraction in [backend/src/uploads/upload-storage.ts](../backend/src/uploads/upload-storage.ts).

The storage adapter supports:

- `local`: writes under `backend/public/Images/uploads` for local development only
- `s3`: writes to a private S3/R2-compatible bucket
- `disabled`: blocks uploads safely

The staging and deployed application must use `UPLOAD_STORAGE_DRIVER=r2` (normalized internally to `s3`). The catalog route has no local-filesystem fallback.

The frontend uses [src/utils/imageValidation.ts](../src/utils/imageValidation.ts) to normalize image URLs and reject unsafe or malformed paths. The browser then renders safe images via [src/components/ui/safe-image.tsx](../src/components/ui/safe-image.tsx).

## Required private-bucket behavior

When the staging configuration is approved and isolated, the bucket should remain private:

- browser should not fetch object storage directly
- backend should read from the object store and return the object bytes with the correct MIME type
- object keys should be sanitized and collision-resistant
- failed uploads should not leave misleading database records
- missing objects should return clear no-file errors without exposing credentials or internal paths

## Verified local status

The local implementation is verified to:

- keep uploads blocked while staging safety remains off
- reject empty and oversized files
- reject unsupported MIME types
- use sanitized object keys and prevent path traversal

Hostless staging has been verified to read representative catalog objects from the private object store. The bucket remains private; public image access is mediated by the backend.

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
