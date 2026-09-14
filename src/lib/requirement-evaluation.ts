import { REQUIREMENTS, REQUIREMENT_GROUPS } from "./data/requirements";
import { SECOND_WRITING_ALL_CODES } from "./data/second-writing-courses";
import { TRANSFER_MAPPINGS } from "./data/transfer-mappings";
import { MARLEY_PROFILE } from "./data/marley-progress";
import type {
  CompletedCourse,
  PlanCourse,
  Requirement,
  RequirementWithStatus,
} from "./types";

type Coursework = CompletedCourse | PlanCourse;
const secondWriting = new Set(SECOND_WRITING_ALL_CODES);
export function equivalentCode(
  course: Pick<Coursework, "school" | "courseCode">,
) {
  if (course.school !== "brookdale") return course.courseCode;
  return (
    TRANSFER_MAPPINGS.find(
      (m) =>
        m.brookdaleCourses.length === 1 &&
        m.brookdaleCourses[0] === course.courseCode,
    )?.udelCourseCode ?? course.courseCode
  );
}
export function matchesRequirement(
  course: Pick<Coursework, "school" | "courseCode" | "fulfillsRequirements">,
  req: Requirement,
) {
  const code = equivalentCode(course);
  // Retired catalog options must not keep satisfying changed requirements through old saved assignments.
  if (
    req.id === "major-core-stats" &&
    ["MATH 202", "MATH 205", "SOCI 301"].includes(code)
  )
    return false;
  if (
    req.id === "major-core-advanced" &&
    ["CGSC 410", "PSYC 350"].includes(code)
  )
    return false;
  if (
    req.id === "ppslp-cgsc350" &&
    code === "CGSC 350" &&
    course.fulfillsRequirements?.includes("ppslp-cgsc375")
  )
    return true;
  // Explicit assignments are authoritative, including an empty array (elective only).
  if (course.fulfillsRequirements !== undefined)
    return course.fulfillsRequirements.includes(req.id);
  return !!(
    req.courseOptions?.includes(code) ||
    (req.id === "second-writing" && secondWriting.has(code))
  );
}
export function suggestedRequirements(
  course: Pick<Coursework, "school" | "courseCode">,
) {
  return REQUIREMENTS.filter(
    (r) => r.id !== "free-elective" && matchesRequirement(course, r),
  ).map((r) => r.id);
}
export function evaluateRequirements(
  academic: CompletedCourse[],
  planned: PlanCourse[] = [],
) {
  const all: Coursework[] = [...academic, ...planned];
  const isEarned = (c: Coursework) =>
    c.status === "completed" || c.status === "transfer";
  const earned = all.filter(isEarned).reduce((s, c) => s + c.credits, 0);
  const total = all.reduce((s, c) => s + c.credits, 0);
  const requirementsWithStatus: RequirementWithStatus[] = REQUIREMENTS.map(
    (req) => {
      const matching = all.filter((c) => matchesRequirement(c, req));
      const done = matching.filter(isEarned);
      const underway = matching.filter((c) => c.status === "in_progress");
      let status: RequirementWithStatus["status"] = "not_started";
      let projectedFulfilled = false;
      if (req.id === "free-elective") {
        status =
          earned >= MARLEY_PROFILE.totalCreditsRequired
            ? "completed"
            : total > 0
              ? "in_progress"
              : "not_started";
        projectedFulfilled = total >= MARLEY_PROFILE.totalCreditsRequired;
        return {
          ...req,
          status,
          projectedFulfilled,
          description: `${Math.max(0, MARLEY_PROFILE.totalCreditsRequired - earned)} credits still to earn toward ${MARLEY_PROFILE.totalCreditsRequired}; ${Math.max(0, MARLEY_PROFILE.totalCreditsRequired - total)} not yet covered by this record or plan.`,
        };
      }
      if (req.courseOptionGroups) {
        const satisfies = (rows: Coursework[]) =>
          req.courseOptionGroups!.some(
            (group) =>
              group.every((code) =>
                rows.some((c) => equivalentCode(c) === code),
              ) &&
              rows
                .filter((c) => group.includes(equivalentCode(c)))
                .reduce((sum, c) => sum + c.credits, 0) >= req.creditsRequired,
          );
        status = satisfies(done)
          ? "completed"
          : matching.length
            ? "in_progress"
            : "not_started";
        projectedFulfilled = satisfies(matching);
      } else {
        status =
          done.length &&
          done.reduce((sum, c) => sum + c.credits, 0) >= req.creditsRequired
            ? "completed"
            : matching.length
              ? "in_progress"
              : "not_started";
        projectedFulfilled =
          matching.length > 0 &&
          matching.reduce((sum, c) => sum + c.credits, 0) >=
            req.creditsRequired;
      }
      return {
        ...req,
        status,
        projectedFulfilled,
        fulfilledBy: done[0] ?? underway[0] ?? matching[0],
      };
    },
  );
  const groups = REQUIREMENT_GROUPS.map((group) => {
    const requirements = requirementsWithStatus
      .filter((r) => r.category === group.category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      ...group,
      requirements,
      completedCount: requirements.filter((r) => r.status === "completed")
        .length,
      fulfilledCount: requirements.filter((r) => r.projectedFulfilled).length,
      totalCount: requirements.length,
      completedCredits: requirements
        .filter((r) => r.status === "completed")
        .reduce((s, r) => s + r.creditsRequired, 0),
      fulfilledCredits: requirements
        .filter((r) => r.projectedFulfilled)
        .reduce((s, r) => s + r.creditsRequired, 0),
      totalCredits: requirements.reduce((s, r) => s + r.creditsRequired, 0),
    };
  });
  return {
    groups,
    requirementsWithStatus,
    totalCompleted: requirementsWithStatus.filter(
      (r) => r.status === "completed",
    ).length,
    totalFulfilled: requirementsWithStatus.filter((r) => r.projectedFulfilled)
      .length,
    totalInProgress: requirementsWithStatus.filter(
      (r) => r.status === "in_progress",
    ).length,
    totalNotStarted: requirementsWithStatus.filter(
      (r) => r.status === "not_started",
    ).length,
    totalRequirements: requirementsWithStatus.length,
  };
}
