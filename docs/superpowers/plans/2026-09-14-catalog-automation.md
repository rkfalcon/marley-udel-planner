# Automated catalog maintenance

User approved weekly full undergraduate catalog imports, validation, automatic publication, review alerts for requirement changes, and preserving the assigned planning catalog.

1. Add a server-only source adapter that discovers the newest undergraduate catalog and follows all course-index pages. Parse each course's credits, title, prerequisites, descriptions, designations and source URL. Reject HTTP challenges, missing fields, wrong years, duplicates and missing prefixes.
2. Store resumable jobs, immutable catalog snapshots and an active snapshot pointer in Supabase with RLS and service-only access. Acquire expiring leases so overlapping workers cannot publish stale data. Preserve the last good snapshot on errors.
3. Run a protected Vercel cron daily: begin checks weekly and resume unfinished checks daily. Limit work to the function budget, checkpoint batches and retry failed source requests on subsequent runs.
4. Monitor the pinned program and Second Writing source separately from course publication. Discover equivalent source pages for new catalog years and raise persistent in-app review alerts. Never automatically switch the student's planning requirements.
5. Add a shared client catalog provider to Admin and the plan picker; show latest course links in Useful Links. Keep historical academic records and saved plans immutable; they retain canonical record reconciliation and assigned requirement rules.
6. Add Admin status, manual retry (optional recovery), source-change review, and rollback. Test parser, completeness, authentication, scheduling, source failure and concurrent execution paths; deploy, trigger a production run and verify actual outcome.

The existing conversation approved implementation and publication; no additional design approval needed. No email service is configured, so actionable notifications are persistent Admin alerts, not outgoing email. Source challenge handling must be explicit; a blocked run is never described as a successful full import.
