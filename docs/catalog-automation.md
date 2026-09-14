# Catalog automation

## Deployed behavior

Vercel calls `/api/cron/catalog-sync` daily at 09:00 UTC, authenticated with `CRON_SECRET`. The worker starts a new full check every seven days; incomplete or failed checks resume daily. An optional Admin Check now action uses the same worker. No desktop or open browser is required.

The worker discovers the current undergraduate catalog from UDel's homepage, walks all course listing pages, verifies every course, and checks that all listed prefixes are present. Course identity, credit range, catalog year, duplicate codes, source origin, size, and large unexpected removals are checked before publication. Work checkpoints are resumable, with an expiring database lease to prevent overlapping workers from publishing stale results.

`catalog_sync` stores the job and active snapshot pointer. `catalog_versions` stores immutable full versions. Both tables and the lease function are restricted to the server service role, with RLS enabled. Publication changes a pointer only after a complete version is stored. Rollback restores the previous version and pauses the scheduler.

Admin and Plan Builder use a shared catalog provider. Published data is loaded in version-pinned pages, refreshed on focus and every five minutes. Useful Links follows the published course catalog year. Until a full import succeeds, the existing curated catalog remains available. Historical academic records and saved plan documents are never rewritten by this worker.

## Requirements

The assigned planning rules remain the reviewed 2026–2027 rules used by the shared evaluator everywhere. The worker separately fingerprints the official degree and Second Writing pages; when the current undergraduate year changes, it also searches the new program list for corresponding sources. Changed source documents create persistent Admin review alerts with the previous and current source text. Source-check failures are reported separately and are not considered unchanged requirements.

This is source monitoring, not automatic interpretation of arbitrary new academic rules. Applying changed rules or switching Marley's assigned catalog still requires a reviewed rule update. Notifications are in the Admin panel; no email provider or outgoing messages are configured.

## Initial deployment outcome, September 14, 2026

The production cron endpoint was deployed and invoked with its secret. UDel returned HTTP 202 automated-access challenges for course listing and requirement pages. The worker persisted this failure, released its lease, and kept the existing catalog. No full catalog snapshot was published. The Admin panel explicitly says the full catalog has not yet been imported.

A fetch service or official UDel feed accessible to the server is still required to complete unattended imports. Firecrawl CLI is installed locally but is not authenticated; no service has been purchased or connected. A user question is pending about an existing account or an approved feed. Do not describe the full catalog as synced until an actual complete production import succeeds.

## Verification

41 tests pass, including source parsing, empty/incomplete departments, duplicate identities, credit ranges, interrupted runs, resume, one complete publication, weekly due dates, source challenges preserving the active version, pause, overlapping workers, authenticated control routes, paginated immutable versions, and rollback. Existing academic record and plan reconciliation tests remain passing. Next.js production build passes. Existing lint has 13 unused-symbol warnings and no errors. Supabase advisors reported no findings for the added tables or function; existing unrelated warnings concern set_updated_at's search path and Auth leaked-password protection.

Browser QA used an isolated local database fixture to verify the failure/status panel, scheduler configuration indicator, progress fields, and unchanged academic editor. Live API verification confirmed the source-blocked status in the production database and public catalog fallback.
