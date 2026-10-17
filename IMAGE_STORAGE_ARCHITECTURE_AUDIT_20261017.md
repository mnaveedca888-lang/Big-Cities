# Image Storage Architecture Audit

**Audit date:** 2026-10-17  
**Project:** `C:\Users\LBG\Desktop\New folder\React router`  
**Scope:** Read-only inspection of frontend/backend image directories, Fastify/Vite handling, PostgreSQL image references, local file existence, and deployment risks. No image files, database records, application code, or configuration were changed.

## Executive summary

Not all images should be stored in the backend. The existing project has three distinct asset classes:

- Frontend design assets are imported into Vite or copied from the frontend `public` directory. They belong in the frontend build/deployment.
- Curated country, city, event, logo, and historical-event media currently lives under `backend/public/Images` and is served by Fastify at `/images/`. Keep it there for a deployment that packages the whole directory, or migrate it deliberately to a CDN/object store if backend artifact size and delivery become concerns.
- User uploads are written to the backend instance’s local filesystem, while PostgreSQL stores only metadata and URL/key strings. This is not durable across ephemeral redeploys or multiple instances; use persistent object storage or an explicitly persistent shared volume for production uploads.

The current database contains 1,606 `/images/...` references across country, city, event, and upload records; all 1,606 resolve to files under the backend static root with exact directory/file casing. There is one separate legacy upload row whose URL uses `/uploads/...`, has zero-byte metadata, and has no file at either its URL or file-key path. Of 576 external references in the audited country/city/event image fields, 161 are event URLs whose hosts are not accepted by the frontend `SafeImage` allowlist. One stored Pakistan hero URL points to `localhost`, but the backend currently replaces it with the local Pakistan image.

## Image-bearing directories

Paths below are relative to the project root. Counts and bytes include common image formats (`png`, `jpg`, `jpeg`, `webp`, `gif`, `svg`, `ico`, `avif`, `bmp`); they exclude dependency and generated `dist` trees. Review/rejected folders are audit material, not runtime image sources.

| Directory | Image files | Bytes | Use / status |
|---|---:|---:|---|
| `src/assets` | 2 | 3,307,015 | Vite-importable frontend assets; `Courses.png` is imported by `src/data/golfCourses.ts`. |
| `images` | 1 | 2,875,823 | Contains the URL-imported `Banner for Home page.html` plus a `Courses.png` identical by SHA-256 to `src/assets/Courses.png`; the duplicate PNG is not needed by the current direct imports. |
| `public` | 1 | 9,522 | Frontend public asset (`favicon.svg`), copied by Vite to the frontend build root. |
| `backend/public/Images` (root files) | 1 | 17,256 | Backend-served logo image. The directory also contains a historical-events DOCX that is not an image. |
| `backend/public/Images/Africa cities images` | 235 | 30,968,018 | Runtime city image collection. |
| `backend/public/Images/Asia cities images` | 226 | 55,651,194 | Runtime city and country image collection. |
| `backend/public/Images/Asia historical events` | 375 | 95,525,414 | Runtime historical-event assets. |
| `backend/public/Images/Australia cities images` | 54 | 2,304,876 | Runtime city image collection. |
| `backend/public/Images/Azerbaijan cities images` | 10 | 4,686,011 | Runtime city image collection. |
| `backend/public/Images/Azerbaijan events images` | 15 | 2,740,747 | Runtime event image collection. |
| `backend/public/Images/Country images` | 146 | 30,794,418 | Runtime country image collection. |
| `backend/public/Images/Downloaded event images` | 477 | 76,528,664 | Runtime static event-image collection. |
| `backend/public/Images/Europe cities images` | 903 | 152,298,201 | Runtime city image collection. Contains 39 `.part` files (1,403,344 bytes) in addition to the recognized image files; these are incomplete/non-image downloads, not database-linked image files found in this audit. |
| `backend/public/Images/Events in Pakistan` | 38 | 27,252,262 | Runtime event image collection. |
| `backend/public/Images/North America cities images` | 171 | 33,189,156 | Runtime city image collection. |
| `backend/public/Images/Pakistan cities images` | 10 | 1,542,756 | Runtime country/city image collection. |
| `backend/public/Images/South America cities images` | 136 | 35,671,618 | Runtime city image collection. |
| `backend/public/Images/uploads` | 1 | 649,117 | One file directly under the upload root; it is not one of the two upload records whose current URL and size both match. |
| `backend/public/Images/uploads/<user-id>` | 2 | 122,757 | Two current upload files; both referenced records resolve and match their recorded sizes. User-specific folder names are intentionally not reproduced here. |
| `backend/Azerbaijan cities images` | 9 | 2,937,285 | Legacy/collection folder outside the Fastify static root; not served at `/images/`. |
| `backend/Azerbaijan events images` | 15 | 2,740,747 | Legacy/collection folder outside the Fastify static root; not served at `/images/`. |
| `North_America_city_image_review` | 22 | 6,682,675 | Review material. |
| `North_America_city_image_review/replacement_assets` | 51 | 9,837,172 | Review candidates, not runtime assets. |
| `North_America_city_image_review/replacement_contact_sheets` | 11 | 1,940,875 | Contact sheets, not runtime assets. |
| `North_America_city_image_review/selected_candidates` | 29 | 3,902,777 | Review candidates, not runtime assets. |
| `North_America_city_image_review/selected_contact_sheets` | 3 | 708,153 | Contact sheets, not runtime assets. |
| `North_America_rejected_city_image_candidates` | 285 | 53,033,230 | Rejected candidates; do not include as production catalog assets. |
| `South_America_city_image_review` | 7 | 1,777,785 | Review material. |
| `South_America_rejected_city_image_candidates` | 35 | 7,458,626 | Rejected candidates; do not include as production catalog assets. |

The backend static tree has 2,800 recognized image files totaling 549,942,465 bytes. It has 2,841 files overall because it also contains 39 `.part` files, one ZIP, and one DOCX. This inventory excludes `node_modules` and generated `dist` folders. No `src/Images` directory exists, although some image-validation tests use old `/src/Images/...` example paths.

## Where image data lives

| Content | Current storage and behavior |
|---|---|
| Country hero images | `Country.profile` JSON can store `heroImageUrl`. The catalog API also resolves files by country code from `backend/public/Images/Country images` or `Asia cities images`; Pakistan has a fixed local image. There are 150 nonempty stored hero values: 134 local paths, 15 non-local HTTP URLs, and one `localhost` URL. The Pakistan `localhost` value is sanitized/overridden by the API’s local Pakistan resolver. |
| Country flags | `Country.profile.flagImageUrl` stores optional path/URL metadata; 16 current values are external Wikimedia URLs. For Asian countries the API generates `https://flagcdn.com/w80/<country-code>.png` at request time, rather than reading a local flag file. |
| City images | `City.profile` JSON stores image fields. The API dynamically resolves local files for Pakistan, Azerbaijan, Asia, South America, North America, and Australia, then falls back to the profile hero URL. Current profile data has 758 hero values (518 local, 240 external) and 132 external thumbnails. |
| Event and historical-event images | `Event.image` is a nullable text/URL field in PostgreSQL. The `Event` model is also the event source used for historical event cards; there is no separate `HistoricalEvent` model/table. Country `importantHistoricalEvents` is profile text, not a media table. The current 1,124 nonempty `Event.image` values comprise 952 local `/images/...` paths and 172 external URLs. |
| Avatar images | `User.avatarUrl` stores a URL/path, but all 19 current values are empty. User endpoints expose that field as the avatar value. |
| Uploads | `Upload` stores `fileKey`, `url`, MIME type, byte size, and optional user ID. It does not store file bytes. Current upload writes go to `backend/public/Images/uploads/<user-id>/...`. Two of three rows resolve to a local file and have exact size matches; one legacy row is zero bytes with a `/uploads/...` URL and no file. |
| Frontend assets | `src/assets/Courses.png` is imported by frontend source and becomes a Vite build asset. `public/favicon.svg` is copied to the frontend build root. `images/Banner for Home page.html` is imported with `?url` and embedded in an iframe; its HTML references remote Pexels MP4 video URLs, so that video depends on third-party availability. |

PostgreSQL stores image references as ordinary strings and JSON, not image binaries. Database backup/restore therefore does not transfer the contents of any image directory.

## Serving and URL construction

- `backend/src/main.ts` registers `@fastify/static` with root `path.join(__dirname, '..', 'public', 'Images')` and prefix `/images/`. A path such as `/images/Asia%20cities%20images/az-baku.webp` is served from `backend/public/Images/Asia cities images/az-baku.webp`.
- `backend/src/catalog/catalog.controller.ts` resolves fixed or filename-matched country/city images from the same capitalized `public/Images` tree. Most of its city resolver branches check that the target file exists before returning a URL.
- Frontend `apiBaseUrl` is `VITE_API_BASE_URL` or the development fallback `http://localhost:4001`. `normalizeImageUrl()` prefixes `/images/...` values with `apiBaseUrl`, e.g. `https://api.example.com/images/Country%20images/US-us.webp`. Configure `VITE_API_BASE_URL` at frontend build time; otherwise a deployed frontend may request its developer’s `localhost`.
- `SafeImage` accepts `/images/...` paths and absolute URLs only when the host is in its allowlist (`images.unsplash.com`, `images.pexels.com`, `pixabay.com`, `upload.wikimedia.org`, `flagcdn.com`) or matches the configured API origin, and the URL path looks like a direct image. It does not accept arbitrary third-party image domains. Its fallback is an “Image unavailable” state unless a fallback is explicitly passed.
- The upload controller’s `/uploads/files` POST endpoint writes multipart data to local disk and returns `/images/uploads/...`, which the static plugin can serve. The filesystem is therefore tied to the API instance unless persistent storage is mounted.
- `/uploads/presign` is not a cloud/object-store presigned upload: it inserts zero-byte metadata and returns fields, but the code does not generate a signed object-store URL or implement a corresponding object-storage upload. It should not be treated as durable storage.
- Backend build script is `tsc -p tsconfig.json`; TypeScript compilation does not copy `backend/public/Images`. A deployment artifact/container must include that directory explicitly. No deployment descriptor was found in the project. The Vite build handles imported `src/assets`, root frontend `public`, and the imported HTML URL separately from backend static files.

### Linux path-case issue

The actual static directory is `backend/public/Images` (capital `I`). `backend/src/events/event-image.ts` builds filesystem paths using `backend/public/images/...` (lowercase `i`) for the Pakistan and Azerbaijan event image directories. Windows treats these as the same path, but a case-sensitive Linux filesystem does not. A code search found no callers of the `resolveImageUrlForEvent`, `resolveImageUrlForTitle`, or `resolveImageUrlForAzerbaijanEvent` helpers, so this is a latent portability defect rather than a currently used resolver. Do not rely on that helper in a Linux deployment until its path casing is corrected and tested.

The existing catalog helpers’ hard-coded city file names were checked against the actual Pakistan/Azerbaijan asset directories; all listed Pakistan and Azerbaijan city files were present. The static root casing used by database `/images/...` paths also matched exactly.

## PostgreSQL path and external-reference checks

The live database was queried read-only. Every local `/images/...` reference was decoded and tested segment-by-segment against the exact-cased `backend/public/Images` filesystem path.

| Field | Nonempty references | Local `/images` | External HTTP(S) | Local file result |
|---|---:|---:|---:|---|
| Country hero | 150 | 134 | 16 | 134/134 present |
| Country flag profile | 16 | 0 | 16 | External references |
| City hero | 758 | 518 | 240 | 518/518 present |
| City thumbnail | 132 | 0 | 132 | External references |
| Event image | 1,124 | 952 | 172 | 952/952 present |
| Upload URL | 3 | 2 | 0 | 2/2 present; 1 legacy non-`/images` URL is broken |

Totals: 1,606 local `/images` references found; zero missing local files and zero case mismatches. There are 576 external HTTP(S) references in the country/city/event image fields. Current host totals are `upload.wikimedia.org` 409, `images.unsplash.com` 5, `www.lums.edu.pk` 151, `img.evbuc.com` 8, `hiccuphq.com` 1, `images.aitinkerers.org` 1, and `localhost` 1. The 161 references to the four non-allowlisted public event hosts are all `Event.image` values and are rejected by the frontend host allowlist. The one `localhost` URL is the stored Pakistan country hero; the API currently replaces it with the fixed local Pakistan image.

The upload row with the broken URL has size `0`, starts with `/uploads/` instead of `/images/uploads/`, and has no file at its URL-derived or file-key-derived local path. Fastify has no GET image route at `/uploads/`; `@fastify/static` serves only `/images/`. This is a confirmed broken reference, independent of deployment.

The previous recovery report records a HEAD-only audit of 488 distinct external URLs: 209 returned HTTP 200 with an image media type, 278 returned 403, and 1 returned 404. That audit did not download response bodies, verify image decoding/dimensions, or establish visual equivalence. Those external results were not re-fetched in this pass; treat them as prior evidence, not a current availability guarantee.

## Deployment recommendation

1. **Keep frontend-owned assets in the frontend.** Keep imported UI assets in `src/assets` and static frontend files in root `public`. Vite should bundle/copy them. The root `images/Courses.png` is byte-identical to the imported `src/assets/Courses.png`; do not ship the extra copy unless some other runtime references it. Do not move the HTML hero file without updating its Vite import; its external video dependencies remain external.
2. **For the current catalog, either package the backend static tree or migrate it as a deliberate storage project.** The least disruptive deployment is to include the entire case-preserved `backend/public/Images` tree in the API artifact and continue serving `/images/*` from Fastify. At about 550 MB of recognized images, an object store/CDN can be a better long-term delivery layer, but migrate files and URLs in a staged, checksum-verified process rather than assuming database backup contains them.
3. **Put new uploads in durable shared storage.** Prefer provider-approved object storage with private write credentials, server-generated object keys, presigned uploads, and a stable CDN/API URL. Alternatively use a persistent shared volume only if the host guarantees persistence, backups, and access from every API instance. Do not rely on an ephemeral container filesystem. Keep PostgreSQL as metadata/key storage, not a binary store.
4. **Resolve current broken/fragile references in a reviewed staging pass.** Specifically test the legacy `/uploads/...` row, the 161 event URLs on hosts blocked by `SafeImage`, and the `localhost` profile value. The Pakistan hero currently masks the latter. Preserve original rows/files until any replacement URL has passed host-policy, HTTP, image decode, and visual checks. Check license/attribution before copying external assets into owned storage.
5. **Fix and test path portability before Linux deployment.** Align `event-image.ts` casing with the real `Images` directory if the helper is intended to be used. Confirm the deployment package contains `backend/public/Images` and issue GET checks for representative country, city, historical-event, and upload URLs on the actual Linux image.
6. **Configure the production frontend/API boundary.** Set `VITE_API_BASE_URL` to the public API origin at frontend build time. Confirm reverse-proxy host/protocol behavior for absolute image URLs generated by the catalog API. Test `/images/...` from the deployed frontend origin, API origin, and after API restart.
7. **Cut over without deleting the local source.** Keep the current image tree and database backup unchanged until a staging copy has matching file counts/checksums, successful URL checks, external reference review, upload persistence across restart, and rollback approval. If moving files to object storage, maintain a reversible mapping from old relative paths to new object keys/URLs.

## Safe migration test checklist

- Record a checksum manifest and file count for `backend/public/Images`; exclude `.part`, ZIP, and DOCX artifacts from the image manifest.
- Copy to a new staging location/provider bucket without changing the source; verify destination checksums and case-sensitive object keys.
- Restore the database into a separate staging database and compare the image-reference inventory against the staged file/object manifest.
- Test a representative local country path, city path, event/historical-event path, logo, flag CDN path, and each current upload record. Check response status, MIME type, actual image decode, and browser rendering.
- Verify the staged upload persists after restart and is readable from every API instance. Test authorization for private uploads before making any bucket public.
- Exercise frontend `SafeImage` against allowed and blocked hosts, then approve any allowlist or URL changes separately.
- Retain the original database and image directories until all checks pass and the rollback window closes.