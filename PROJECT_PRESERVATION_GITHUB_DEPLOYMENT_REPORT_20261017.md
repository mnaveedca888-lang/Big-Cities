# Project Preservation, GitHub Upload, and Deployment Report

**Audit date:** 2026-10-17  
**Project:** Big Cities (`C:\Users\LBG\Desktop\New folder\React router`)  
**Status:** Source and public assets uploaded and verified. Production hosting, database, and durable upload storage are not selected; no website deployment or production data migration was performed.

## Executive result

- The project directory was not a Git repository and had no local history. The requested GitHub repository was confirmed **public and empty** before upload. Authenticated GitHub identity matched `mnaveedca888-lang`.
- A complete protected project snapshot, fresh PostgreSQL backup, image manifest, database-reference manifest, and Git exclusion manifest were created under `%LOCALAPPDATA%\ReactRouterMissionBackups\project_preservation_20261017_114949_979`.
- The verified source commit was pushed to `main`: `d1278722524aac9e70b2c1def143a55ecc1d5c30`. GitHub's recursive tree contains the same 3,961 file paths and blob IDs as the local commit. The worktree is clean and tracks `origin/main`.
- No production host or public website URL exists yet. Choosing the provider, billing plan, production database destination, and persistent upload storage requires the owner’s decision.

## Recovery protection

**Project snapshot**

- Snapshot: `%LOCALAPPDATA%\ReactRouterMissionBackups\project_preservation_20261017_114949_979\ProjectSnapshot`
- Original project content copied before the `.gitignore` safety update and Git initialization: 37,417 files, 1,312,425,952 bytes.
- Source and snapshot had identical relative-path and byte-size inventories: 0 missing paths, 0 extra paths, 0 size differences. All image-asset SHA-256 values were also compared against the snapshot: 3,298 checked, 0 missing, 0 mismatched.
- Snapshot root ACL is restricted to the current user, SYSTEM, and local Administrators.
- Full file inventory: `complete_project_file_inventory.csv` (SHA-256 `980E5CA5D4DE2D49E7CFDF269376CA0A550E9D71BB9190B1D4C5643625B6FCD8`).

**Database backup**

- Source identity confirmed from `backend/.env`: `localhost:5432`, database `react_router_dev`, schema `public`, role `postgres`; PostgreSQL 18.4, 64-bit Windows. Credentials are not included here.
- Fresh custom-format archive: `%LOCALAPPDATA%\ReactRouterMissionBackups\project_preservation_20261017_114949_979\react_router_dev_deployment_20261017_115710_380.dump`
- Size: 1,539,397 bytes. SHA-256: `B2D1CBFEBEA06DD2E897FEAE5BBAAAF5F7FA991A4E057BAC92147CC62CB05586`.
- PostgreSQL 18.4 `pg_restore --list` succeeded with 81 TOC entries.
- Restore test passed in the separate database `react_router_dev_mission_verify_20261017_121000`. All 19 source tables had identical counts and deterministic full-row fingerprints; 0 differences. The original database and previous backup files were not restore targets.
- No seeds, migrations, event discovery, synchronization, or database repairs were run.

## Database inventory

PostgreSQL has one installed extension (`plpgsql` 1.0), no user-defined enums, no sequences, 34 indexes, 19 primary keys, 9 foreign keys, and 98 not-null constraints. Fifteen migration directories are represented by successful entries; `_prisma_migrations` has 16 rows because one migration has a rolled-back attempt and a later successful attempt.

| Table | Rows | Table | Rows |
|---|---:|---|---:|
| Activity | 0 | AuditLog | 0 |
| Category | 19 | City | 1,331 |
| Continent | 6 | Country | 195 |
| Event | 1,136 | EventDiscoveryBudget | 52 |
| EventDiscoveryRun | 657 | EventDiscoveryState | 15 |
| Notification | 0 | Permission | 0 |
| Role | 1 | RolePermission | 0 |
| SavedEvent | 1 | Session | 71 |
| Upload | 3 | User | 19 |
| _prisma_migrations | 16 | | |

The database archive contains metadata and references, not image bytes. Existing foreign keys do not cover `City.countryCode`, `Event.categoryId/countryCode/citySlug`, or `SavedEvent.eventId`; preserve these current scalar values as-is during migration.

## Image and asset inventory

The project image manifest covers 3,298 project-owned image files, totaling 652,969,871 bytes. Counts include frontend assets, backend runtime media, data/legacy folders, and review/rejected candidates; dependencies and generated `dist` output are excluded. The manifest includes relative path, byte size, SHA-256, detected format, width, height, and dimension-readability flag.

| Format | Files | Bytes |
|---|---:|---:|
| WebP | 2,263 | 426,668,662 |
| JPG | 1,003 | 210,710,335 |
| PNG | 24 | 14,639,060 |
| JPEG | 7 | 942,292 |
| SVG | 1 | 9,522 |
| **Total** | **3,298** | **652,969,871** |

Pillow read dimensions for 3,296 files. `public/favicon.svg` is a vector and was not dimension-readable by Pillow. `backend/public/Images/Events in Pakistan/Independence Day.jpg` contains SVG XML bytes despite its `.jpg` suffix; the exact file path is not referenced by the current database. It may be served with the wrong MIME type and should be reviewed before use, but was preserved unchanged. The backend static tree also contains 39 incomplete `.part` files totaling 1,403,344 bytes; all remain preserved and were included in the GitHub commit.

| Image directory | Files | Bytes |
|---|---:|---:|
| `Data/Azerbaijan` | 1 | 121,041 |
| `Data/Azerbaijan/Azerbaijan Cities Images` | 9 | 2,937,285 |
| `Data/Azerbaijan/Azerbaijan events images` | 15 | 2,740,747 |
| `North_America_city_image_review` | 22 | 6,682,675 |
| `North_America_city_image_review/replacement_assets` | 51 | 9,837,172 |
| `North_America_city_image_review/replacement_contact_sheets` | 11 | 1,940,875 |
| `North_America_city_image_review/selected_candidates` | 29 | 3,902,777 |
| `North_America_city_image_review/selected_contact_sheets` | 3 | 708,153 |
| `North_America_rejected_city_image_candidates` | 285 | 53,033,230 |
| `South_America_city_image_review` | 7 | 1,777,785 |
| `South_America_rejected_city_image_candidates` | 35 | 7,458,626 |
| `backend/Azerbaijan cities images` | 9 | 2,937,285 |
| `backend/Azerbaijan events images` | 15 | 2,740,747 |
| `backend/public/Images` (root) | 1 | 17,256 |
| `backend/public/Images/Africa cities images` | 235 | 30,968,018 |
| `backend/public/Images/Asia cities images` | 226 | 55,651,194 |
| `backend/public/Images/Asia historical events` | 375 | 95,525,414 |
| `backend/public/Images/Australia cities images` | 54 | 2,304,876 |
| `backend/public/Images/Azerbaijan cities images` | 10 | 4,686,011 |
| `backend/public/Images/Azerbaijan events images` | 15 | 2,740,747 |
| `backend/public/Images/Country images` | 146 | 30,794,418 |
| `backend/public/Images/Downloaded event images` | 477 | 76,528,664 |
| `backend/public/Images/Europe cities images` | 903 | 152,298,201 |
| `backend/public/Images/Events in Pakistan` | 38 | 27,252,262 |
| `backend/public/Images/North America cities images` | 171 | 33,189,156 |
| `backend/public/Images/Pakistan cities images` | 10 | 1,542,756 |
| `backend/public/Images/South America cities images` | 136 | 35,671,618 |
| `backend/public/Images/uploads` | 1 | 649,117 |
| `backend/public/Images/uploads/<user-id>` | 2 | 122,757 |
| `images` | 1 | 2,875,823 |
| `public` | 1 | 9,522 |
| `src/assets` | 2 | 3,307,015 |
| `tmp_afg_docx_extracted/docProps` | 1 | 8,324 |
| `tmp_docx_extracted/docProps` | 1 | 8,324 |

The two `Courses.png` files under `src/assets` and root `images` are identical by SHA-256; both were preserved and uploaded. Frontend assets are imported/copied by Vite. Fastify serves `backend/public/Images` at `/images/`. The backend TypeScript build does not copy that static directory, so a future API artifact must explicitly include it or migrate it to a reviewed object-store/CDN mapping.

## Database image-reference audit

The protected reference manifest has 2,183 nonempty rows. It records entity, key, field, stored reference, upload key, external host, and exact local path resolution.

| Reference class | Rows / result |
|---|---|
| Local `/images/...` references | 1,606; all resolve to exact-cased local files |
| External HTTP(S) references | 575; availability, license, and visual identity not verified in this pass |
| Stored `localhost` URL | 1; Pakistan country hero, currently overridden by the backend’s local Pakistan resolver |
| Legacy `/uploads/...` URL | 1; unserved prefix, zero-byte metadata, no file at URL or file-key location |
| Upload rows | 3; two file-backed rows resolve and match byte sizes; one linked file is missing |
| Avatar URLs | 0 nonempty across 19 users |

External hosts include Wikimedia, LUMS, Eventbrite image CDN, Unsplash, Hiccuphq, and AITinkerers. 161 event-image references use hosts rejected by the frontend `SafeImage` allowlist. An earlier report’s HEAD-only checks found 209 of 488 distinct external URLs returning an image media type, 278 returning 403, and 1 returning 404; no response bodies or licenses were verified. Keep these URLs unchanged until reviewed.

The database stores image URLs/paths and upload metadata only. Country historical-event profile data is not a separate table; there is no `HistoricalEvent` Prisma model. The backend upload route writes to local disk and is not durable across ephemeral redeploys or multiple instances. `/uploads/presign` does not implement real object-store signing.

## GitHub upload and exclusions

- Repository: [mnaveedca888-lang/Big-Cities](https://github.com/mnaveedca888-lang/Big-Cities), confirmed public, initially empty, default branch `main`.
- Commit: `d1278722524aac9e70b2c1def143a55ecc1d5c30`; branch is clean and tracks `origin/main`.
- GitHub recursive tree verification: 3,961 blobs, 0 path/blob-ID differences from local commit, 3,295 expected media files present, 0 forbidden paths present. The remote is verified to match the reviewed commit.
- Eligible repository content: 3,961 files, 679,989,583 source bytes. This includes all non-private image folders, manifests, audit/rejected candidates, and `.part` files.
- Git LFS 3.7.1 is installed but was not needed: no candidate file exceeds 100 MB. No `.gitattributes`/LFS rules are configured. Repository payload is large; total source assets are approximately 680 MB before Git compression.
- `.gitignore` was updated to exclude env secrets, key files, database backups, private uploads, Python caches, and generated build output. `.env.example` remains allowed and contains placeholders only. A redacted high-confidence secret scan found no provider keys or private-key blocks in staged files.

| Excluded path | Files | Bytes | Reason; preservation |
|---|---:|---:|---|
| `node_modules/` | 28,189 | 336,759,095 | Reinstallable dependencies; retained in protected project snapshot |
| `backend/node_modules/` | 5,216 | 290,631,201 | Reinstallable dependencies; retained in snapshot |
| `dist/` | 6 | 3,878,083 | Generated frontend build; retained in snapshot |
| `backend/dist/` | 36 | 273,485 | Generated backend build; retained in snapshot |
| `__pycache__/` | 5 | 122,468 | Generated Python bytecode; retained in snapshot |
| `backend/.env` | 1 | 433 | Local credentials/configuration; retained in restricted snapshot, never uploaded |
| `backend/public/Images/uploads/` | 3 | 771,874 | User-upload data; retained in restricted snapshot, never uploaded |
| **Total excluded** | **33,456** | **632,436,639** | All accounted for in the protected snapshot and exclusion manifest |

The upload command emitted a missing `credential-manager-core` helper warning, but the normal push succeeded and GitHub verified the commit. No force push was used.

## Build and test results

- Frontend Vite production build: passed; output written outside the workspace. Existing warning remains: the main JavaScript chunk is about 880 kB, above the 600 kB warning threshold.
- Backend TypeScript build: passed to a separate protected output directory.
- Full Vitest suite: 123/123 passed across 29 files with a 15-second per-test timeout. The first default-timeout run had one transient 5-second timeout; that test passed alone in 4.63 seconds, and the complete suite then passed.
- No production API, database, upload workflow, browser deployment, or public website was tested because no hosting destination has been selected.

## Deployment readiness and remaining blockers

1. **Choose hosting and billing.** A suitable split is static frontend hosting; a long-running Node/Fastify service; managed PostgreSQL 18 with TLS/direct connection; and S3-compatible object storage/CDN for persistent uploads and optionally the 550 MB backend static image tree. Examples can be evaluated after the owner chooses region, budget, and provider. No provider account or remote service was created.
2. **Provision production secrets directly with the selected provider.** Set backend `DATABASE_URL`, strong JWT secrets, port, and `NODE_ENV`; build frontend with production `VITE_API_BASE_URL`. Do not reuse the local `postgres` superuser credential. Define restrictive production CORS origins; current Fastify config allows `origin: true`.
3. **Restore to an empty staging database first.** Use PostgreSQL 18 client tools and the verified custom archive; do not use `--clean` or `--create`. Provision roles/grants separately because the dump does not create cluster-wide logins. Verify migration status; no seed/reset is needed for the restored data.
4. **Choose durable upload handling.** Move existing upload bytes with checksums to approved object storage or a documented persistent shared volume. Preserve both valid upload files and the unrelated 649,117-byte file; the third database upload is already missing and must not be silently replaced or removed.
5. **Review external image availability and licensing.** 575 URLs remain external/unverified, including the 161 event URLs the frontend currently rejects. No mappings or files were altered. Review owners/permissions before changing URLs or copying media.
6. **Resolve Linux/static packaging details.** Package `backend/public/Images` explicitly or use a reviewed storage migration. `backend/src/events/event-image.ts` contains lowercase `public/images` paths while the actual directory is `public/Images`; Windows masks the mismatch, but Linux would not. Search found no callers today, so the helper is latent, not a verified active route failure.
7. **Disable background ingestion during staging.** The local environment enables event synchronization and run-on-start. Set `EVENT_SYNC_ENABLED=false` and `EVENT_SYNC_RUN_ON_START=false` for restore/rehearsal; decide and approve any production schedule separately.

There is no public website URL or API URL yet. No production migrations, source database writes, row corrections, image replacements, or live deployment took place.

## Owner next actions

1. Choose the frontend/API/PostgreSQL/storage providers, region, and acceptable billing plan.
2. Provision a PostgreSQL 18 staging destination and obtain its TLS connection details directly in the provider console; do not send credentials in chat.
3. Choose persistent object storage or shared-volume policy for the 2 valid uploads and future uploads, and decide how to retain the existing unreferenced upload binary.
4. Approve the production CORS origin, frontend/API domains, and whether event synchronization remains disabled or receives an explicitly owned schedule.
5. Review external image host permissions and the 161 frontend-blocked event references before any content/mapping changes.
6. After those choices, authorize staging restore and deployment verification. Only after staging passes should production restore/cutover be considered.

## Protected local artifacts

All recovery artifacts are in `%LOCALAPPDATA%\ReactRouterMissionBackups\project_preservation_20261017_114949_979` with ACL limited to the current user, SYSTEM, and Administrators.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `react_router_dev_deployment_20261017_115710_380.dump` | 1,539,397 | `B2D1CBFEBEA06DD2E897FEAE5BBAAAF5F7FA991A4E057BAC92147CC62CB05586` |
| `complete_project_file_inventory.csv` | 2,404,694 | `980E5CA5D4DE2D49E7CFDF269376CA0A550E9D71BB9190B1D4C5643625B6FCD8` |
| `project_image_asset_manifest.csv` | 546,227 | `A76A796D4F97FB2DE71686A6618DB511F34A65AE7D9D037EAE7974BDA4C5E7D2` |
| `database_image_reference_manifest.csv` | 396,251 | `A3E3DD3A2DFE60E780475D8228D480F162E99ED9B8BDB14A176DCB85C6FD5971` |
| `github_exclusion_manifest.csv` | 1,390 | `DE078D99EF2FBA08DDA093B647A997E60066E18A7E9974082523433C48BB0F51` |

The database reference manifest records `local_exists`, `external_unverified`, `localhost_url`, and `unserved_prefix` status per row. The complete file inventory covers the full pre-Git snapshot; the image manifest separately SHA-256-verifies every project-owned image asset.