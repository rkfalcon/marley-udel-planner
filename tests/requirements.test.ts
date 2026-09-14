import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRequirements } from "../src/lib/requirement-evaluation";
import type { CompletedCourse } from "../src/lib/types";
const course: CompletedCourse = {
  courseCode: "CGSC 170",
  title: "Cognitive Science",
  credits: 3,
  school: "udel",
  term: "Spring",
  year: 2026,
  status: "in_progress",
  fulfillsRequirements: ["major-core-cgsc170"],
};
test("a course completion marks its requirement complete", () => {
  const before = evaluateRequirements([course]);
  const after = evaluateRequirements([{ ...course, status: "completed" }]);
  assert.equal(
    before.requirementsWithStatus.find((r) => r.id === "major-core-cgsc170")
      ?.status,
    "in_progress",
  );
  assert.equal(
    after.requirementsWithStatus.find((r) => r.id === "major-core-cgsc170")
      ?.status,
    "completed",
  );
});
test("partially completed credit requirements are not complete", () => {
  const result = evaluateRequirements([
    {
      ...course,
      status: "completed",
      courseCode: "CUSTOM",
      fulfillsRequirements: ["breadth-a"],
    },
  ]);
  assert.notEqual(
    result.requirementsWithStatus.find((r) => r.id === "breadth-a")?.status,
    "completed",
  );
});
test("planned credits cannot mark the degree total complete", () => {
  const result = evaluateRequirements(
    [],
    [
      {
        ...course,
        id: "p",
        planSemesterId: "s",
        credits: 124,
        status: "planned",
      },
    ],
  );
  assert.notEqual(
    result.requirementsWithStatus.find((r) => r.id === "free-elective")?.status,
    "completed",
  );
});
