# Updating Marley's coursework

Open `/admin` and sign in with the approved admin account.

1. Choose **Add course**, or **Edit** next to an existing class.
2. Set the school, term, year, course code, title, credits, status and optional grade. Catalog courses fill in suggested details; custom courses are supported.
3. Review **Requirements this course fulfills**. These selections are authoritative; leave all unchecked for elective-only credit. Combined transfer equivalencies and advisor substitutions require manual confirmation.
4. Choose **Save course** to publish the update throughout the site. The form closes only after the save succeeds.
5. To complete several courses, select their checkboxes, choose **Complete selected**. This saves immediately. Brookdale courses become accepted transfer credit; use this only after approval.

Completed and accepted transfer credits count as earned. In-progress and planned credits remain separate. Grades are informational and do not automatically recalculate GPA or change credit status. The profile GPA remains the previously entered figure.

**Remove** archives a course immediately after confirmation. Its old copies disappear from plans and credit calculations. Before saving a course, **Reload record** discards its unsaved form edits. To re-add a previously removed course after saving, add it again. Multiple attempts of the same course at the same school are not supported; enter the final credited outcome rather than counting both attempts.

All plans combine the current academic record with their hypothetical future coursework. Academic courses are edited through Admin; unrelated future plan choices are preserved. Open views refresh on navigation, returning to the tab, and every 30 seconds. An admin save updates the shared record immediately and notifies other open tabs to refresh. A conflicting edit from another session is rejected; reload before editing again.

Winter retains this project's existing convention: winter break following Fall 2026 is labeled Winter 2026.

## Deployment configuration

The server needs:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `ADMIN_EMAIL`, the exact email of the approved Supabase Auth user

Create the approved account in Supabase Authentication with a password and a confirmed email. Public sign-up does not grant admin access. No service-role key or admin password goes into browser code. Authentication uses a secure HttpOnly cookie in production, and each mutation checks the current Supabase user, confirmed email, configured allowlist and request origin. Sessions expire at the access token's expiration; sign in again to save a preserved course edits.

Apply `supabase/migrations/20260914173247_admin_academic_record.sql` to the same Supabase project as the existing plans. It creates a protected singleton table and seeds the original 17 records without overwriting later edits. The migration has been applied to project `ouzxguwgxwilqozzeahd` on September 14, 2026; verified revision 0, 17 courses, 32 earned credits.

The table denies direct anonymous/authenticated access; public reads and authorized writes go through the server API. Saves use revision compare-and-swap. Database errors remain visible; no static fallback can silently conceal newer academic data.

Run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Browser verification used a local Supabase-shaped backend so completion/removal tests did not mutate Marley's real data.

## Verification status

September 14, 2026: 25 automated checks pass; TypeScript and production build pass. Lint reports no errors (13 unused-variable warnings remain). Desktop/mobile browser checks covered sign-in, adding a Fall course, moving it to Summer, editing credits/grade/status, bulk completion, archive propagation, shared dashboard/requirements totals, saved-plan reconciliation and print totals. A local fixture was used for writes.

Preview: https://marley-udel-planner-fnf85qmyf-9i9e.vercel.app

Production is live at https://marley-udel-planner.vercel.app/admin. The approved admin account is provisioned, and ADMIN_EMAIL is configured in production and development. Live sign-in, secure session cookies, authenticated session validation and sign-out were verified. The initial deployment seeded revision 0 with the original 17 courses. Generated login details are stored only in a private, git-ignored local file.

September 14 save-flow correction: replaced the two-stage draft/publish workflow with immediate **Save course**, **Complete selected**, and confirmed removal. Failed saves preserve form edits without changing published totals. BroadcastChannel refreshes other open tabs after successful saves; navigation, focus and polling remain fallbacks. Regression tests cover editor persistence, failed saves, existing plan reconciliation and cross-tab updates. The five Spring 2026 courses were saved as completed at revision 1: 47 earned credits, 0 in progress. Grades and other coursework were preserved.
