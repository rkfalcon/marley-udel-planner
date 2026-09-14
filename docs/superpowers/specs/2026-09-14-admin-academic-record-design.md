# Admin academic record

Approved in conversation on September 14, 2026.

Provide an Admin page with email/password sign-in restricted on the server to a configured, confirmed Supabase Auth account. Public viewers retain read access. Admins can add/edit/archive courses, assign semester, school, credits, grade and requirement matches, and complete selected courses. No academic outcomes are inferred during migration.

Store one versioned academic record in Supabase, seeded from the current static coursework. Atomic compare-and-swap saves prevent two editing sessions from silently overwriting each other. Archived courses and historical identities are retained for reconciliation with old plans. Errors are visible; database failures never masquerade as empty records or successful saves.

All views consume a shared provider and a pure requirement evaluator. Completed and accepted-transfer credits count as earned; in-progress and planned credits remain distinct. Total credits count each course once even when it meets several requirements. Public views refresh on navigation, focus and periodically; an admin save updates the local provider immediately.

Plans are projections of authoritative coursework plus hypothetical future courses. Strip stale academic copies and replace matching planned coursework with the latest academic entries, preserving unrelated future courses. Protect academic rows from plan edits; edit them through Admin. Reconcile old saved plans on read and before saves, including print views. Stable academic IDs and historical keys prevent edited or archived records reappearing from a saved plan.

Validate course data and requirement IDs server-side. Only single-course transfer mappings are automatic; combined equivalencies require explicit admin assignment. Grades are descriptive; the admin selects whether credits were earned. Multiple attempts of the same school/course are outside this first version; reject duplicate entries rather than overcounting them.

Verification covers authorization, invalid and conflicting saves, archive/rename reconciliation, completion transitions, unique credit counts, requirement thresholds, and browser flows. Document deployment configuration and account setup. The feature must not claim to be live until its database migration and deployed behavior are verified.
