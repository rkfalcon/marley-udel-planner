import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRequirements,
  suggestedRequirements,
} from "../src/lib/requirement-evaluation";
import { COURSES } from "../src/lib/data/courses";
import { REQUIREMENTS } from "../src/lib/data/requirements";
import type { CompletedCourse } from "../src/lib/types";
const course = (
  courseCode: string,
  credits = 3,
  status: CompletedCourse["status"] = "completed",
): CompletedCourse => ({
  courseCode,
  credits,
  status,
  school: "udel",
  term: "Fall",
  year: 2026,
  title: courseCode,
});
const result = (courses: CompletedCourse[], id: string) =>
  evaluateRequirements(courses).requirementsWithStatus.find(
    (r) => r.id === id,
  )!;
test("2026 SLP requires CGSC 350, with eight concentration requirements", () => {
  assert.equal(REQUIREMENTS.filter((r) => r.category === "ppslp").length, 8);
  assert.equal(
    result([course("CGSC 350")], "ppslp-cgsc350").status,
    "completed",
  );
  assert.equal(
    result([course("CGSC 375")], "ppslp-cgsc350").status,
    "not_started",
  );
});
test("biology requires a complete matching lecture/lab option", () => {
  assert.notEqual(
    result([course("BISC 207")], "major-core-bio").status,
    "completed",
  );
  assert.equal(
    result([course("BISC 207"), course("BISC 217", 1)], "major-core-bio")
      .status,
    "completed",
  );
  assert.notEqual(
    result([course("BISC 207"), course("BISC 113", 1)], "major-core-bio")
      .status,
    "completed",
  );
  assert.equal(
    result([course("BISC 104", 4)], "major-core-bio").status,
    "completed",
  );
  const pending = result(
    [course("BISC 103"), course("BISC 113", 1, "in_progress")],
    "major-core-bio",
  );
  assert.equal(pending.status, "in_progress");
  assert.equal(pending.projectedFulfilled, true);
});
test("new core options and retired statistics options follow the new catalog", () => {
  assert.ok(
    suggestedRequirements(course("NSCI 100")).includes("major-core-psyc100"),
  );
  assert.ok(
    suggestedRequirements(course("CGSC 402")).includes("major-core-advanced"),
  );
  assert.ok(
    suggestedRequirements(course("CGSC 353")).includes("ppslp-ling353"),
  );
  for (const code of ["MATH 202", "MATH 205", "SOCI 301"])
    assert.equal(
      result([course(code)], "major-core-stats").status,
      "not_started",
    );
  assert.equal(
    result([course("STAT 200")], "major-core-stats").status,
    "completed",
  );
});
test("new course options exist with verified credits", () => {
  assert.equal(
    COURSES.filter(
      (c) => c.school === "udel" && c.courseCode.startsWith("CGSC "),
    ).length,
    48,
  );
  assert.equal(COURSES.find((c) => c.courseCode === "BISC 207")?.credits, 3);
  for (const code of [
    "CGSC 350",
    "CGSC 353",
    "CGSC 302",
    "CGSC 416",
    "BISC 217",
    "NSCI 100",
  ])
    assert.ok(COURSES.some((c) => c.courseCode === code));
});
test("legacy plan assignments cannot keep retired statistics options satisfied", () => {
  const old = {
    ...course("MATH 202"),
    fulfillsRequirements: ["major-core-stats"],
  };
  assert.equal(result([old], "major-core-stats").status, "not_started");
  const slp = {
    ...course("CGSC 350"),
    fulfillsRequirements: ["ppslp-cgsc375"],
  };
  assert.equal(result([slp], "ppslp-cgsc350").status, "completed");
  assert.equal(
    result(
      [{ ...course("CGSC 350"), fulfillsRequirements: [] }],
      "ppslp-cgsc350",
    ).status,
    "not_started",
  );
});
test("a variable-credit course must meet the requirement credit minimum", () => {
  const c = course("CGSC 310", 1);
  assert.equal(result([c], "dle").projectedFulfilled, false);
  assert.equal(result([{ ...c, credits: 3 }], "dle").status, "completed");
});

test("second writing retains courses listed without catalog hyperlinks", async () => {
  const { SECOND_WRITING_ALL_CODES } =
    await import("../src/lib/data/second-writing-courses");
  for (const code of [
    "BISC 615",
    "BISC 625",
    "BISC 639",
    "MATH 512",
    "PHYS 626",
    "PHYS 650",
    "COMM 422",
    "DANC 420",
  ])
    assert.ok(SECOND_WRITING_ALL_CODES.includes(code));
  assert.equal(SECOND_WRITING_ALL_CODES.includes("COMM 311"), false);
});

test("Disability Studies is searchable with verified credits and requirement matches", async () => {
  const { searchCourses } = await import("../src/lib/data/courses");
  const matches = searchCourses("DIS", "udel").filter((c) =>
    c.courseCode.startsWith("DIST "),
  );
  assert.equal(matches.length, 17);
  assert.equal(matches.find((c) => c.courseCode === "DIST 150")?.credits, 0);
  assert.equal(matches.find((c) => c.courseCode === "DIST 250")?.credits, 3);
  assert.ok(
    suggestedRequirements(course("DIST 250")).includes("univ-breadth-history"),
  );
  assert.ok(
    suggestedRequirements(course("DIST 250")).includes("multicultural"),
  );
  assert.equal(result([course("DIST 345")], "dle").status, "completed");
  assert.equal(
    result([course("DIST 200", 1)], "dle").projectedFulfilled,
    false,
  );
  assert.equal(
    result([course("DIST 250")], "ppslp-cgsc350").status,
    "not_started",
  );
});
