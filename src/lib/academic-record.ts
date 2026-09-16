import { extendAcceleratedSlpPlan } from "./accelerated-slp";
import type { CompletedCourse, Plan, PlanCourse, Term } from "./types";
import { REQUIREMENTS } from "./data/requirements";
import { TRANSFER_MAPPINGS } from "./data/transfer-mappings";
import { MARLEY_PROFILE } from "./data/marley-progress";

export interface AcademicCourse extends CompletedCourse {
  id: string;
  archived?: boolean;
  /** All previous school/code identities, retained when editing or archiving. */
  legacyKeys: string[];
}
export interface AcademicRecord {
  courses: AcademicCourse[];
  revision: number;
  updatedAt: string;
}
export const courseKey = (c: Pick<CompletedCourse, "school" | "courseCode">) =>
  `${c.school}:${c.courseCode.trim().toUpperCase().replace(/\s+/g, " ")}`;
export const activeCourses = (courses: AcademicCourse[]) =>
  courses.filter((c) => !c.archived);
export function creditTotals(
  courses: Array<
    Pick<CompletedCourse, "credits" | "status"> & { archived?: boolean }
  >,
) {
  const totals = { completed: 0, inProgress: 0, planned: 0, remaining: 0 };
  for (const c of courses) {
    if (c.archived) continue;
    if (c.status === "completed" || c.status === "transfer")
      totals.completed += c.credits;
    if (c.status === "in_progress") totals.inProgress += c.credits;
    if (c.status === "planned") totals.planned += c.credits;
  }
  totals.remaining = Math.max(
    0,
    MARLEY_PROFILE.totalCreditsRequired - totals.completed - totals.inProgress,
  );
  return totals;
}
export function validateCourses(value: unknown): AcademicCourse[] {
  if (!Array.isArray(value) || value.length > 500)
    throw new Error("The record must contain at most 500 courses.");
  const ids = new Set<string>();
  const keys = new Set<string>();
  const requirements = new Set(REQUIREMENTS.map((r) => r.id));
  return value.map((raw): AcademicCourse => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid course.");
    const c = raw as Record<string, unknown>;
    const str = (key: string, max: number, required = true) => {
      const v = c[key];
      if (v === undefined && !required) return undefined;
      if (typeof v !== "string" || (required && !v.trim()) || v.length > max)
        throw new Error(`Invalid ${key}.`);
      return v.trim();
    };
    const id = str("id", 80)!;
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id))
      throw new Error("Invalid or duplicate course ID.");
    ids.add(id);
    if (!["udel", "brookdale"].includes(String(c.school)))
      throw new Error("Choose UDel or Brookdale.");
    if (!["Fall", "Winter", "Spring", "Summer"].includes(String(c.term)))
      throw new Error("Choose a valid semester.");
    if (
      !Number.isInteger(c.year) ||
      Number(c.year) < 2000 ||
      Number(c.year) > 2100
    )
      throw new Error("Year must be between 2000 and 2100.");
    if (
      typeof c.credits !== "number" ||
      !Number.isFinite(c.credits) ||
      c.credits < 0 ||
      c.credits > 30 ||
      Math.abs(c.credits * 10 - Math.round(c.credits * 10)) > 1e-8
    )
      throw new Error(
        "Credits must be between 0 and 30, with at most one decimal place.",
      );
    if (
      !["completed", "in_progress", "planned", "transfer"].includes(
        String(c.status),
      )
    )
      throw new Error("Choose a valid status.");
    if (c.archived !== undefined && typeof c.archived !== "boolean")
      throw new Error("Invalid archive status.");
    if (
      c.fulfillsRequirements !== undefined &&
      (!Array.isArray(c.fulfillsRequirements) ||
        c.fulfillsRequirements.some(
          (r) =>
            typeof r !== "string" ||
            (!requirements.has(r) &&
              !["ppslp-cgsc375", "ppslp-cgsc376"].includes(r)),
        ))
    )
      throw new Error("Unknown requirement.");
    const course: AcademicCourse = {
      id,
      courseCode: str("courseCode", 40)!.toUpperCase().replace(/\s+/g, " "),
      title: str("title", 200)!,
      credits: c.credits,
      grade: str("grade", 12, false),
      school: c.school as AcademicCourse["school"],
      term: c.term as Term,
      year: c.year as number,
      status: c.status as AcademicCourse["status"],
      archived: c.archived === true,
      fulfillsRequirements: [
        ...new Set((c.fulfillsRequirements as string[]) ?? []),
      ],
      legacyKeys: [],
    };
    if (!course.archived) {
      const key = courseKey(course);
      if (keys.has(key))
        throw new Error(
          `${course.courseCode} is already in the academic record. Edit its existing entry instead.`,
        );
      keys.add(key);
    }
    return course;
  });
}
/** Derive historical identities on the server; callers cannot forge cleanup rules. */
export function prepareCourses(value: unknown, previous: AcademicCourse[]) {
  const courses = validateCourses(value);
  const ids = new Set(courses.map((c) => c.id));
  if (previous.some((c) => !ids.has(c.id)))
    throw new Error("Archive courses instead of deleting their history.");
  return courses.map((c) => {
    const old = previous.find((p) => p.id === c.id);
    return {
      ...c,
      legacyKeys: [
        ...new Set([
          ...(old?.legacyKeys ?? []),
          ...(old ? [courseKey(old)] : []),
          courseKey(c),
        ]),
      ],
    };
  });
}
const termPosition: Record<Term, number> = {
  Fall: 9,
  Winter: 13,
  Spring: 3,
  Summer: 6,
};
export function semesterPosition(s: { term: Term; year: number }) {
  return s.year * 12 + termPosition[s.term];
}
function courseIdentities(
  c: Pick<CompletedCourse, "school" | "courseCode">,
): string[] {
  const keys = [courseKey(c)];
  if (c.school === "brookdale") {
    const mapping = TRANSFER_MAPPINGS.find(
      (m) =>
        m.brookdaleCourses.length === 1 &&
        m.brookdaleCourses[0] === c.courseCode,
    );
    // Generic departmental electives can represent several distinct courses.
    if (
      mapping &&
      /^[A-Z]+ \d{3}$/.test(mapping.udelCourseCode) &&
      !mapping.udelCourseCode.endsWith("166")
    )
      keys.push(`udel:${mapping.udelCourseCode}`);
  }
  return keys;
}
export function reconcilePlan(plan: Plan, records: AcademicCourse[]): Plan {
  plan = extendAcceleratedSlpPlan(plan);
  const academicKeys = new Set(
    records.flatMap((c) => [
      ...courseIdentities(c),
      ...c.legacyKeys.flatMap((key) => {
        const [school, courseCode] = key.split(":");
        return school === "udel" || school === "brookdale"
          ? courseIdentities({ school, courseCode })
          : [key];
      }),
    ]),
  );
  const semesters = plan.semesters.map((s) => ({
    ...s,
    courses: s.courses.filter(
      (c) =>
        !c.academicCourseId &&
        !c.id.startsWith("academic-") &&
        !(plan.pathway && c.program === 'graduate'
          ? records.some(r => r.term === s.term && r.year === s.year && courseIdentities(r).some(key => courseIdentities(c).includes(key)))
          : courseIdentities(c).some((key) => academicKeys.has(key))),
    ),
  }));
  for (const c of activeCourses(records)) {
    let semester = semesters.find(
      (s) => s.term === c.term && s.year === c.year && s.school === c.school,
    );
    if (!semester) {
      semester = {
        id: `academic-semester-${c.term}-${c.year}-${c.school}`,
        planId: plan.id,
        term: c.term,
        year: c.year,
        school: c.school,
        sortOrder: semesters.length,
        courses: [],
      };
      semesters.push(semester);
    }
    const allocation = plan.pathway ? plan.semesters.flatMap(s => s.courses
      .filter(p => p.academicCourseId === c.id || (s.term === c.term && s.year === c.year && courseIdentities(p).some(k => courseIdentities(c).includes(k)))))
      [0] : undefined;
    const entry: PlanCourse = {
      ...allocation,
      id: `academic-${c.id}`,
      academicCourseId: c.id,
      planSemesterId: semester.id,
      courseCode: c.courseCode,
      title: c.title,
      school: c.school,
      credits: c.credits,
      status: c.status,
      grade: c.grade,
      fulfillsRequirements: c.fulfillsRequirements,
    };
    semester.courses.push(entry);
  }
  semesters.sort((a, b) => semesterPosition(a) - semesterPosition(b));
  return {
    ...plan,
    semesters: semesters.map((s, i) => ({ ...s, sortOrder: i })),
  };
}
