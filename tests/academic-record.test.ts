import test from "node:test";
import assert from "node:assert/strict";
import {
  creditTotals,
  reconcilePlan,
  validateCourses,
  courseKey,
  type AcademicCourse,
} from "../src/lib/academic-record";
import type { Plan } from "../src/lib/types";
const course = (changes: Partial<AcademicCourse> = {}): AcademicCourse => ({
  id: "academic-1",
  courseCode: "CGSC 170",
  title: "Cognitive Science",
  credits: 3,
  school: "udel",
  status: "in_progress",
  term: "Spring",
  year: 2026,
  fulfillsRequirements: ["major-core-cgsc170"],
  legacyKeys: [],
  ...changes,
});
const plan = (): Plan => ({
  id: "p",
  name: "Plan",
  slug: "plan",
  targetGraduation: "Spring 2028",
  isEarlyGraduation: false,
  createdAt: "",
  updatedAt: "",
  semesters: [
    {
      id: "s",
      planId: "p",
      term: "Spring",
      year: 2026,
      school: "udel",
      sortOrder: 0,
      courses: [
        {
          id: "old",
          planSemesterId: "s",
          courseCode: "CGSC 170",
          title: "Old title",
          school: "udel",
          credits: 3,
          status: "in_progress",
        },
        {
          id: "future",
          planSemesterId: "s",
          courseCode: "LING 101",
          title: "Linguistics",
          school: "udel",
          credits: 3,
          status: "planned",
        },
      ],
    },
  ],
});
test("completion moves credits from in progress to earned, counting a multi-requirement course once", () => {
  const c = course({
    status: "completed",
    fulfillsRequirements: ["major-core-cgsc170", "breadth-c"],
  });
  assert.deepEqual(creditTotals([c]), {
    completed: 3,
    inProgress: 0,
    planned: 0,
    remaining: 121,
  });
});
test("saved plans replace stale academic copies while retaining unrelated future courses", () => {
  const result = reconcilePlan(plan(), [
    course({ status: "completed", credits: 4 }),
  ]);
  const all = result.semesters.flatMap((s) => s.courses);
  assert.equal(all.length, 2);
  assert.equal(
    all.find((c) => c.courseCode === "CGSC 170")?.status,
    "completed",
  );
  assert.equal(creditTotals(all).completed, 4);
  assert.equal(all.find((c) => c.id === "future")?.status, "planned");
});
test("archived and renamed coursework cannot reappear from a legacy plan", () => {
  const oldKey = courseKey(course());
  assert.equal(
    reconcilePlan(plan(), [
      course({ archived: true, legacyKeys: [oldKey] }),
    ]).semesters.flatMap((s) => s.courses).length,
    1,
  );
  const result = reconcilePlan(plan(), [
    course({ courseCode: "CGSC 171", legacyKeys: [oldKey] }),
  ]);
  assert.deepEqual(
    result.semesters
      .flatMap((s) => s.courses)
      .map((c) => c.courseCode)
      .sort(),
    ["CGSC 171", "LING 101"],
  );
});
test("actual coursework replaces matching hypothetical future entries without double counting", () => {
  const p = plan();
  p.semesters.push({
    ...p.semesters[0],
    id: "f",
    year: 2027,
    courses: [
      { ...p.semesters[0].courses[0], id: "duplicate", status: "planned" },
    ],
  });
  assert.equal(
    reconcilePlan(p, [course()])
      .semesters.flatMap((s) => s.courses)
      .filter((c) => c.courseCode === "CGSC 170").length,
    1,
  );
});
test("reconciliation is idempotent and does not mutate the saved plan", () => {
  const p = plan();
  const before = JSON.stringify(p);
  const once = reconcilePlan(p, [course()]);
  assert.deepEqual(reconcilePlan(once, [course()]), once);
  assert.equal(JSON.stringify(p), before);
});
test("course validation rejects negative credits, duplicate courses and unknown requirements", () => {
  assert.throws(() => validateCourses([course({ credits: -1 })]));
  assert.throws(() => validateCourses([course(), course({ id: "second" })]));
  assert.throws(() =>
    validateCourses([course({ fulfillsRequirements: ["bogus"] })]),
  );
  assert.doesNotThrow(() => validateCourses([course({ credits: 0 })]));
});

test("accepted Brookdale coursework replaces a plan for its specific UDel equivalent", () => {
  const p = plan();
  p.semesters[0].courses = [
    { ...p.semesters[0].courses[0], courseCode: "ANTH 102", status: "planned" },
  ];
  const result = reconcilePlan(p, [
    course({ school: "brookdale", courseCode: "ANTH 116", status: "transfer" }),
  ]);
  assert.equal(result.semesters.flatMap((s) => s.courses).length, 1);
});
