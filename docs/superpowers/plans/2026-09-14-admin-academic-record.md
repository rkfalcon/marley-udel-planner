# Admin Academic Record Implementation Plan

> Execute inline in this session using executing-plans, respecting the repository's sequential agent instruction.

**Goal:** Let an approved admin manage Marley's coursework once and see it reflected throughout the site.
**Architecture:** Versioned Supabase record, server-verified admin session, shared React provider, pure course reconciliation and requirement evaluation.
**Tech Stack:** Next.js 16.2.1, React 19, Supabase JS, TypeScript, Node test runner and browser verification.
**Spec:** ../specs/2026-09-14-admin-academic-record-design.md

## Global constraints
- Preserve existing academic outcomes during seed migration.
- Never expose the service-role key or authorize from user-editable metadata.
- Keep actual, in-progress and hypothetical coursework distinct.
- Use optimistic concurrency and visible errors; never overwrite on a stale revision.

## Task 1: Record domain and database
- [x] Add failing tests in tests/academic-record.test.ts for completion, duplicate credit protection, validation, archive/rename and saved-plan reconciliation.
- [x] Implement src/lib/academic-record.ts: AcademicRecord, AcademicCourse, creditTotals, validateCourses and reconcilePlan.
- [x] Create Supabase SQL migration with singleton record and RLS denying direct client writes; seed existing coursework idempotently.
- [x] Run `npm test` and confirm domain behavior.

## Task 2: Secure persistence and shared state
- [x] Implement server auth helpers and /api/admin/session; verify Supabase user and configured email for every write.
- [x] Implement GET/PUT /api/academic-record with validation, maximum body size and revision compare-and-swap.
- [x] Add provider with visible read errors, refresh on focus/navigation/timer and immediate updates after saves.
- [x] Test unauthenticated, non-admin, stale-write and invalid-input behavior.

## Task 3: Admin editor
- [x] Add /admin with sign-in, semester groups, course catalog suggestions, custom courses, requirement selection, edit/archive and selected completion.
- [x] Save one draft atomically, warn on unsaved navigation and keep drafts after failed saves.
- [x] Add Admin navigation and accessible form labels/status messages.

## Task 4: Site integration
- [x] Replace static consumers in dashboard, requirements, picker and transfer page.
- [x] Reconcile saved and new plans in usePlan, protect academic rows and use the same evaluator in graduation tracking and printing.
- [x] Correct unique credits and distinguish projected from earned requirement fulfillment.

## Task 5: Verify and deliver
- [x] Run tests, TypeScript, lint and production build. Fix new failures and distinguish existing issues.
- [x] Exercise admin add/edit/complete/archive and dashboard/requirements/planner/print in a browser.
- [x] Configure ADMIN_EMAIL and provision the approved account; publish to production and verify live authentication and unchanged academic records.
- [x] Document migration and provisioning; deployed preview and verified real database reads (17 courses, revision 0).
