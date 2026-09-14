# Catalog automation

## Deployed behavior

Vercel calls `/api/cron/catalog-sync` every ten minutes, authenticated with `CRON_SECRET`. The existing Vercel team is on Pro, which supports this schedule. No browser launches when a check is not due or is paused. The worker starts a new full check every calendar month; incomplete or failed checks resume on the next ten-minute tick. An optional Admin Check now action uses the same worker. No desktop or open browser is required.

The worker discovers the current undergraduate catalog from UDel's homepage, walks all course listing pages, verifies every course, and checks that all listed prefixes are present. Course identity, credit range, catalog year, duplicate codes, source origin, size, and large unexpected removals are checked before publication. Work checkpoints are resumable, with an expiring database lease to prevent overlapping workers from publishing stale results.

`catalog_sync` stores the job and active snapshot pointer. `catalog_versions` stores immutable full versions. Both tables and the lease function are restricted to the server service role, with RLS enabled. Publication changes a pointer only after a complete version is stored. Rollback restores the previous version and pauses the scheduler.

Admin and Plan Builder use a shared catalog provider. Published data is loaded in version-pinned pages, refreshed on focus and every five minutes. Useful Links follows the published course catalog year. Until a full import succeeds, the existing curated catalog remains available. Historical academic records and saved plan documents are never rewritten by this worker.

## Requirements

The assigned planning rules remain the reviewed 2026–2027 rules used by the shared evaluator everywhere. The worker separately fingerprints the official degree and Second Writing pages; when the current undergraduate year changes, it also searches the new program list for corresponding sources. Changed source documents create persistent Admin review alerts with the previous and current source text. Source-check failures are reported separately and are not considered unchanged requirements.

This is source monitoring, not automatic interpretation of arbitrary new academic rules. Applying changed rules or switching Marley's assigned catalog still requires a reviewed rule update. Notifications are in the Admin panel; no email provider or outgoing messages are configured.

## Browser transport, September 14, 2026

Direct HTTP requests originally received HTTP 202 challenges. The worker now opens an isolated server-side Chromium session, discovers and selects the newest non-archived Undergraduate Catalog option, waits for the catalog selection's own navigation, and clicks Courses. This runs on Vercel without a desktop, saved personal browser profile, third-party scraping account, or manual dropdown selection.

After initialization, HTML requests share that browser session's cookies; pages needing JavaScript fall back to browser navigation. Concurrent course reads share initialization but use separate pages. Responses and pages are disposed after use, and the browser closes at the end of each worker invocation. The same validation and immutable publication rules apply. Print-friendly links are excluded from index pagination because they duplicate listings. Once the index is complete, the worker deliberately requests each listing’s expanded print view, validates its catalog year and course codes against the index, and imports the full details in batches of up to 100. Any details absent from expanded views are fetched individually. Expanded-page progress is checkpointed too, with at most four concurrent source requests.

The browser packages and Chromium binaries are explicitly included in the two worker routes' deployment traces. Browser code loads only when a check is requested, so status reads do not launch or load the browser runtime.

A course whose official entry omits credits is imported with `creditsUnspecified`; the numeric zero is only a placeholder, and Admin and Plan Builder require enrolled credits before adding it. Explicit zero-credit courses remain distinct.

Production publication succeeded on September 14, 2026 at 22:08:38 UTC: **5,200 courses across all 121 advertised subject prefixes**, including all 17 DIST courses and 48 CGSC courses. Snapshot: `30ce2b48-b580-43dc-9e44-0d40fbf7a3e6`. All eleven public API pages were fetched and verified to contain exactly 5,200 unique course codes from that same immutable snapshot. Both requirement documents were checked successfully; the error fields and worker lease are clear. The next full check is due October 14, 2026. A repeat authenticated cron call returns `not_due`.

Two official entries do not provide numeric credits: GBUS 364 omits the field, and HDFS 278 puts “Group Dynamics” in it. Both remain searchable and require enrolled credits when added. The importer does not infer credits from the unrelated Allowed Units field. Publication stops if more than 5% of courses have unspecified credits, guarding against a broad source-format/parser regression.

The ten-minute production scheduler was observed resuming the import without a desktop trigger. Source timeouts preserved completed pages, and concurrent invocations returned `busy`.

## Verification

50 tests pass, including source parsing, empty/incomplete departments, duplicate identities, credit ranges, interrupted runs, resume, one complete publication, monthly due dates, source challenges preserving the active version, pause, overlapping workers, authenticated control routes, paginated immutable versions, and rollback. Existing academic record and plan reconciliation tests remain passing. Next.js production build passes. Existing lint has 13 unused-symbol warnings and no errors. Supabase advisors reported no findings for the added tables or function; existing unrelated warnings concern set_updated_at's search path and Auth leaked-password protection.

Browser QA used an isolated local database fixture to verify the failure/status panel, scheduler configuration indicator, progress fields, and unchanged academic editor. Live API verification confirmed the source-blocked status in the production database and public catalog fallback.

The monthly interval was requested on September 14, 2026. Existing weekly due dates are recalculated from the last successful publication; short months clamp to their last day. Unfinished imports retain ten-minute retries.
