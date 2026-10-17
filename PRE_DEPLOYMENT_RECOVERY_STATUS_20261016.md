# Pre-Deployment Recovery Status Addendum

**Date:** 2026-10-16  
**Disposition:** **HOLD DEPLOYMENT**. The event-route regression is verified fixed, but image-byte recovery, durable upload storage, production configuration, and source/restore provenance remain unresolved.

This addendum records fresh checks against the current workspace and database. It supplements, and does not replace, the read-only manifests in `C:\Users\LBG\AppData\Local\Temp\ReactRouterBackupCompletenessAudit_20261016` and `C:\Users\LBG\AppData\Local\Temp\ReactRouterRemoteImageRecoveryAudit_20261016`.

## Verified Complete

- The retained original dump remains 1,517,486 bytes with SHA-256 `53566FF5D652478D3BD54BE3A92409AC2B968C3B86664FF8DDAD911D794992F5`; `pg_restore --list` succeeds. The list contains 81 numbered TOC object lines. The existing archive and restore-test database were not overwritten.
- A **new** current-state database archive was made and restored to a **new, separate** test database. The archive is 1,539,397 bytes, SHA-256 `1B2EE6EE215F068F72F385B79DACDA03028FB70D2E2784CF79ABFBD2F48834B1`; `pg_restore --list` and restore completed successfully. All 18 Prisma model-table counts match between the source and this new restore.
- New archive: `C:\Users\LBG\AppData\Local\ReactRouterDbBackups\react_router_dev_recovery_20261016_161024\react_router_dev.dump`.
- New verification database: `react_router_dev_verify_20261016_161024`. The original `react_router_dev` and prior `react_router_dev_restoretest_20261016_114601500` were not changed.
- A new project snapshot was copied under the existing restricted ACL, excluding only `node_modules`, `dist`, `backend/dist`, `__pycache__`, `.git`, and `.vite`. All 3,961 copied files (680,717,297 bytes) SHA-256 matched their source at copy verification. The snapshot ACL is restricted to SYSTEM, local Administrators, and the current user.
- New snapshot: `C:\Users\LBG\AppData\Local\ReactRouterProjectSnapshots\before_predeployment_recovery_20261016_161058`.
- The named upload binary `1785761146853-avatar.png` remains absent from the project and both checked snapshots. The metadata is still zero bytes. The separate Arequipa upload remains present (649,117 bytes; SHA-256 `66ECF7FE6505744EC9BB40743153C2D75F6038CF96433821A89F0637EE565117`) and was not repurposed.

## Implemented and Tested

- **Long event slugs:** The existing code in `backend/src/main.ts` and `backend/src/events/event.controller.ts` configures a 200-character Fastify parameter limit and validates event slugs. The focused controller suite passed **9/9** tests. A read-only sweep of all **117** prior failure rows returned HTTP 200 with the exact expected ID and slug for **117/117**.
- Unknown valid event slugs retain the intended 404; malformed slugs are rejected; over-limit parameters do not reach the database lookup.
- **Saved events:** Both user route registrars check event existence before upsert. The existing test suite confirms a nonexistent event returns 404 without insertion and existing saved-event listing preserves the stale row. The one orphan was not changed.
- Full Vitest suite: **123 tests passed across 29 files**.
- Frontend production build passed. Backend TypeScript production build passed into a new temporary output directory.
- Frontend source lint passed with `npx eslint src`.
- Browser checks against a local production bundle and local API returned HTTP 200 for `/countries`, `/countries/AF`, `/countries/AZ`, `/cities/af-kabul`, and the 165-character event detail route. Representative names, descriptions, dates, historical-event section, and local images rendered; no JavaScript page errors or horizontal overflow at 390px were observed.
- No app source changes were made in this recovery pass. The event and saved-event fixes were already in the workspace before this pass.

## Current Database and Sync Incident

A read-only count comparison found that the source database differed from the retained restore-test database. The source state was still moving during the investigation:

| Table | Current source | Existing restore-test | Difference |
|---|---:|---:|---:|
| Country | 195 | 195 | 0 |
| City | 1,331 | 1,331 | 0 |
| Event | 1,136 | 1,135 | +1 |
| Category | 19 | 19 | 0 |
| Continent | 6 | 6 | 0 |
| Upload | 3 | 3 | 0 |
| User | 19 | 19 | 0 |
| Role | 1 | 1 | 0 |
| Permission | 0 | 0 | 0 |
| RolePermission | 0 | 0 | 0 |
| Session | 71 | 71 | 0 |
| SavedEvent | 1 | 1 | 0 |
| Notification | 0 | 0 | 0 |
| Activity | 0 | 0 | 0 |
| AuditLog | 0 | 0 | 0 |
| EventDiscoveryState | 15 | 15 | 0 |
| EventDiscoveryRun | 657 | 643 | +14 |
| EventDiscoveryBudget | 52 | 51 | +1 |

The extra event is “England squad arrives in Pakistan for ODI tri-series” (created `2026-10-16T11:04:07.986Z`). Source-only discovery runs are dated 2026-10-16 and concern Pakistan. At the first detailed comparison, a run had no `finishedAt`; after the approved server stop, the final read found **zero unfinished runs** in the checked window.

A separate, pre-existing Node server was listening on port 4001 and its discovery-run count increased during the audit. My isolated browser-test server used port 4401, explicitly set `EVENT_SYNC_ENABLED=false` and `EVENT_SYNC_RUN_ON_START=false`, logged “Event sync scheduler is disabled,” and issued only GET requests. The pre-existing server was stopped only after user approval; port 4001 is now closed. The exact initiator of the source-only records cannot be established from current evidence. The new backup captures the current source state; no row was deleted or corrected.

## Issue Register

| ID | Severity / status | Affected surface and evidence | Smallest safe next step | Approval |
|---|---|---|---|---|
| EVT-01 | High / implemented and tested | Event detail API rejected 117 long slugs before the existing fix. Current 200-character bound and slug schema pass all 117 live-handler checks and regression tests. | Retain the current fix; repeat the sweep against the eventual deployed API. | No further approval for verification. |
| DB-01 | High / confirmed, unresolved provenance | Current source exceeds the retained restore-test by 1 Event, 14 EventDiscoveryRun rows, and 1 EventDiscoveryBudget row. One new event is present in the current backup and its isolated restore. | Preserve all rows; review discovery provenance and decide whether the retained restore-test should remain a historical baseline. Do not delete or reconcile records during this audit. | Approval required before any record correction or restore over an existing database. |
| SYNC-01 | High / confirmed operational risk | A pre-existing local server on port 4001 ran event discovery while the audit was underway. Source `.env` has sync and run-on-start enabled; source code disables sync only when the environment value is exactly `false`. The server was stopped with approval. | Keep sync disabled during recovery and define explicit production ownership/schedule before restart. | Approval required before changing production sync policy or restarting sync. |
| IMG-01 | High / unresolved | Existing manifests cover 806 external-reference rows / 488 distinct URLs. The prior check was HEAD-only: 209 URLs claimed HTTP 200 with image media type, 278 returned 403, and 1 returned 404. Zero response bodies, actual image formats, dimensions, hashes, licenses, or visual equivalence were verified. The 107 same-entity local mappings do not establish equivalence. | Review source terms, attribution, and image identity; stage only permitted originals and keep unresolved references unchanged. | Approval required before changing live mappings or replacing assets. |
| IMG-02 | Medium / partially verified | Azerbaijan’s current country page rendered a snapshot-backed local hero, despite the prior report describing the 404 URL as effective. The original remote reference remains stored and unresolved. | Keep the existing local resolver behavior; inspect the raw reference separately before any mapping change. | Approval required before changing the stored mapping. |
| UPLOAD-01 | High / unresolved | Upload audit ID `67be82b3-6c50-4e88-9f95-79a913594035` has zero-byte metadata and no matching binary in the project or snapshots. Its user-specific path is intentionally omitted here. The unrelated Arequipa file is preserved. | Seek a legitimate owner-provided original or deployment backup; otherwise keep the record and rely on graceful fallback. | Approval required before metadata edits, reassignment, deletion, or replacement. |
| STORE-01 | High / deployment blocker | `/uploads/files` writes to local `backend/public/Images/uploads`; the upload controller has a 20 MiB multipart limit but no explicit MIME allowlist. Local runtime storage may be ephemeral or differ across instances. | Select persistent volume/object storage; test migration, reads, restart persistence, access control, and restore in non-production. | Approval required for provider, paid service, credentials, and production migration. |
| DEPLOY-01 | High / unverified | No deployment descriptor was found. Frontend API base defaults to `http://localhost:4001`; production API/static-asset configuration is unverified. | Define and test production `VITE_API_BASE_URL`, backend origin, and static image packaging. | Approval required before production configuration/deployment. |
| SEC-01 | Medium / policy decision | Fastify CORS is configured with `origin: true`. Admin routes inspected require an admin role; event sync is not public. | Define allowed production origins and test auth/upload routes against that policy. | Approval required before changing public access policy. |
| DATA-01 | Low / preserved | One `SavedEvent.eventId` remains unmatched. Current create behavior rejects nonexistent IDs; list behavior leaves the existing stale row intact. | Preserve the row and keep the regression tests. | Approval required before any data repair or constraint change. |
| HASH-01 | Medium / partially explained | Existing hash manifest is stale for current files. Current source hash deviations from that manifest include `backend/.env`, `backend/src/main.ts`, `backend/src/events/event.controller.ts`, `backend/src/events/event.controller.test.ts`, and `backend/src/users/user.controller.test.ts`; the old snapshot’s `.env` hash also differs. Event code differences match the existing long-slug implementation; the source-only user test belongs to the saved-event fix. Variable names/lines in the two `.env` files compared equal, but the byte-hash difference remains unexplained. | Use the new verified snapshot and preserve the old snapshot; investigate `.env` byte differences without printing values. | Approval required before restoring or overwriting any file. |
| LINT-01 | Low / confirmed tooling issue | `npm run lint` fails with 304 errors across the broad workspace, chiefly temporary/audit scripts. `npx eslint src` passes. Root ESLint warns that `.eslintignore` is deprecated; backend TypeScript is not covered by this ESLint config. | Scope lint to maintained code and separately decide whether to clean or exclude temporary scripts. | No approval needed for a later scoped tooling change. |

## Image and Upload Recovery Manifest

The existing complete row/URL crosswalk remains at:

- `C:\Users\LBG\AppData\Local\Temp\ReactRouterRemoteImageRecoveryAudit_20261016\remote_image_http_verification.csv` — one row per distinct external URL, with status/headers and explicit `bodyRead=NO`.
- `C:\Users\LBG\AppData\Local\Temp\ReactRouterRemoteImageRecoveryAudit_20261016\local_resolution_mapping_evidence.csv` — all 806 external reference rows and local-path evidence, explicitly not asserting visual equivalence.
- `C:\Users\LBG\AppData\Local\Temp\ReactRouterRemoteImageRecoveryAudit_20261016\upload_recovery_manifest.csv` — missing upload and preserved unrelated binary.
- `C:\Users\LBG\AppData\Local\Temp\ReactRouterRemoteImageRecoveryAudit_20261016\asset_recovery_summary.json` — aggregate results and limitations.

**Fresh recoveries in this pass: 0 remote image bytes.** No staging file, format/dimensions, checksum, licensing, or visual verification can be claimed. These manifests are a complete reference inventory, not a completed image recovery manifest. Existing local image decode results (3,298 decoded in the prior audit) were not repeated; the new project snapshot did hash-match all copied files.

## Verification Limits and Next Steps

- `npm run lint` remains failing at the repository-wide level (304 errors); frontend source-only lint passes. The production builds pass, with a large-chunk warning in the frontend build.
- Browser checks used a local production build and local API; no deployed host, production browser session, or authenticated dashboard/upload workflow was tested. External video requests aborted during page navigation, and some external image requests were blocked by the browser origin policy.
- No remote image response body was downloaded; third-party permissions and licensing remain unknown.
- No migrations, seeds, cleanup, event sync, upload modification, image replacement, deployment configuration change, deployment, or database row correction was performed by this recovery pass.
- Before deployment: review the source-only discovery records, choose explicit sync/CORS/storage policy, verify the production API/static asset configuration, recover or explicitly accept missing media, and repeat route, upload-persistence, backup/restore, and browser checks against the deployment candidate.
