# Accelerated SLP planning

New plans offer a 3+2 checkbox. Existing plans offer an optional pathway view.
The optional `Plan.acceleratedSlp` settings are stored in the existing plan JSON,
so save, reload, copy and print retain them without a database migration.
The ordinary 124-credit BS audit remains unchanged.

The pathway evaluator receives the reconciled plan and checks coursework through
Spring of entry year + 3. Winter N follows Fall N. Courses after the cutoff do
not count toward the junior-year projection. Completed/transfer credits are earned;
in-progress/planned credits count only toward projections. Major and concentration
checks use the same requirement evaluator as the rest of the app.

Default entry is Fall 2025. Overall and major GPAs start unknown and require verified
user entries. Checklists are user confirmations, not automatic eligibility decisions.
Users must refresh GPAs after grades change. The MA phase is a timeline only;
no graduate courses or shared credit are invented or automatically credited.

Sources checked September 14, 2026:
- https://www.udel.edu/academics/colleges/cas/units/departments/linguistics-cognitive-science/undergraduate-programs/accelerated-program/
- https://www.udel.edu/academics/colleges/chs/departments/cscd/graduate-programs/masters-program/

Published admissions-cycle rules currently cover 2026–2027. Marley’s anticipated
application cycle is later; the UI calls out the need to verify it. These department
webpages are not part of the monthly catalog course importer. Future policy changes
require review before changing the 109-credit / 3.6 GPA rules.

## Semester range (September 15, 2026)

Accelerated plans automatically retain/add UDel terms from Summer of entry year + 3
through Winter of entry year + 5. For Marley this includes every term in 2029 and
2030. Winter 2030 means January 2031 under the existing academic-year convention.
The extension is additive, uses stable semester IDs and leaves existing courses,
Brookdale semesters and the Spring 2028 junior-year deadline unchanged. It applies
when opening existing plans, creating new plans, editing courses and printing.
