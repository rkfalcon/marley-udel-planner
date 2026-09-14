"use client";
import { useEffect, useMemo, useState } from "react";
import { useAcademicRecord } from "./academic-record-provider";
import {
  activeCourses,
  creditTotals,
  semesterPosition,
  type AcademicCourse,
  type AcademicRecord,
} from "@/lib/academic-record";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { REQUIREMENTS } from "@/lib/data/requirements";
import { suggestedRequirements } from "@/lib/requirement-evaluation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourseStatus, School, Term } from "@/lib/types";

const statusLabels: Record<CourseStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  planned: "Planned",
  transfer: "Transfer accepted",
};
const selectClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";

export function AcademicEditor({
  initialRecord,
  canSave,
  onSessionExpired,
}: {
  initialRecord: AcademicRecord;
  canSave: boolean;
  onSessionExpired: () => void;
}) {
  const { record: latest, acceptRecord, refresh } = useAcademicRecord();
  const base = latest ?? initialRecord;
  const draft = base.courses;
  const [editingRevision, setEditingRevision] = useState(base.revision);
  const [editing, setEditing] = useState<AcademicCourse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = editing !== null || busy;
  const conflict = editing !== null && base.revision !== editingRevision;
  const totals = creditTotals(draft);
  const semesters = useMemo(() => {
    const groups = new Map<string, AcademicCourse[]>();
    for (const c of activeCourses(draft)) {
      const key = `${c.term} ${c.year}`;
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    return [...groups.entries()].sort(
      (a, b) => semesterPosition(b[1][0]) - semesterPosition(a[1][0]),
    );
  }, [draft]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const navigate = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (
        a &&
        !window.confirm("Leave this page without finishing your course update?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  async function save(
    courses: AcademicCourse[],
    revision = base.revision,
  ): Promise<boolean> {
    if (busy || !canSave) return false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/academic-record", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses, revision }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) onSessionExpired();
        throw new Error(data.error);
      }
      acceptRecord(data);
      setSelected([]);
      setMessage(
        "Saved to the site. Credit Progress, Requirements Overview, existing plans, and Graduation Progress are updated.",
      );
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save. Your changes are still in the form.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      dirty &&
      !window.confirm(
        "Discard your unsaved changes and reload the latest academic record?",
      )
    )
      return;
    const data = await refresh();
    if (data) {
      setEditing(null);
      setSelected([]);
      setError("");
      setMessage("Latest record loaded.");
    }
  }
  function add() {
    setEditingRevision(base.revision);
    setEditing({
      id: crypto.randomUUID(),
      school: "udel",
      courseCode: "",
      title: "",
      credits: 3,
      term: "Fall",
      year: new Date().getFullYear(),
      status: "in_progress",
      fulfillsRequirements: [],
      legacyKeys: [],
    });
    setMessage("");
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Earned", totals.completed],
          ["In progress", totals.inProgress],
          ["Planned", totals.planned],
          ["Still to earn", Math.max(0, 124 - totals.completed)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">
              {value}
              <span className="ml-1 text-xs font-normal text-slate-500">
                credits
              </span>
            </p>
          </div>
        ))}
      </div>
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 shadow-sm print:hidden">
        <Button onClick={add} disabled={busy || !!editing}>
          Add course
        </Button>
        <Button
          variant="outline"
          disabled={busy || !!editing || !selected.length || !canSave}
          onClick={() => {
            void save(
              draft.map((c) =>
                selected.includes(c.id)
                  ? {
                      ...c,
                      status:
                        c.school === "brookdale" ? "transfer" : "completed",
                    }
                  : c,
              ),
            );
          }}
        >
          Complete selected{selected.length > 0 ? ` (${selected.length})` : ""}
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-slate-500" role="status">
          {busy
            ? "Saving to the site…"
            : editing
              ? "Editing — save this course below"
              : "Showing saved coursework"}
        </span>
        <Button variant="ghost" onClick={() => void reload()} disabled={busy}>
          Reload record
        </Button>
      </div>
      {!canSave && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          Sign in above to save. Your course edits are still here.
        </p>
      )}
      {conflict && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          Someone saved a newer version of this record. Reload the record before
          making further changes.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-blue-50 p-3 text-blue-900">
          {message}
        </p>
      )}
      {editing && (
        <CourseForm
          key={editing.id}
          course={editing}
          onCancel={() => setEditing(null)}
          disabled={busy || !canSave || conflict}
          saving={busy}
          onApply={async (course) => {
            const duplicate = draft.some(
              (c) =>
                !c.archived &&
                c.id !== course.id &&
                c.school === course.school &&
                c.courseCode.toUpperCase() === course.courseCode.toUpperCase(),
            );
            if (duplicate)
              return "This course already exists. Edit its existing entry instead.";
            const courses = draft.some((c) => c.id === course.id)
              ? draft.map((c) => (c.id === course.id ? course : c))
              : [...draft, course];
            if (!(await save(courses, editingRevision)))
              return "Course not saved. Review the message above and try again.";
            setEditing(null);
            return null;
          }}
        />
      )}
      {semesters.map(([semester, courses]) => (
        <section
          key={semester}
          className="overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
            <h2 className="font-semibold text-slate-800">{semester}</h2>
            <span className="text-sm text-slate-500">
              {courses.reduce((s, c) => s + c.credits, 0)} credits
            </span>
          </div>
          <ul className="divide-y">
            {courses.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4"
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${c.courseCode}`}
                  className="size-4"
                  disabled={
                    busy ||
                    !!editing ||
                    c.status === "completed" ||
                    c.status === "transfer"
                  }
                  checked={selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, c.id]
                        : selected.filter((id) => id !== c.id),
                    )
                  }
                />
                <div className="min-w-48 flex-1">
                  <p className="font-semibold text-slate-800">
                    {c.courseCode}{" "}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {c.school === "udel" ? "UDel" : "Brookdale"}
                    </span>
                  </p>
                  <p className="text-sm text-slate-500">{c.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.fulfillsRequirements?.length
                      ? c.fulfillsRequirements
                          .map(
                            (id) => REQUIREMENTS.find((r) => r.id === id)?.name,
                          )
                          .filter(Boolean)
                          .join(" · ")
                      : "Elective credits"}
                  </p>
                </div>
                <span className="text-sm">
                  {c.credits} cr{c.grade ? ` · ${c.grade}` : ""}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === "completed" || c.status === "transfer" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                >
                  {statusLabels[c.status]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || !!editing}
                  onClick={() => {
                    setEditingRevision(base.revision);
                    setEditing(c);
                    setMessage("");
                  }}
                  aria-label={`Edit ${c.courseCode}`}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy || !!editing}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${c.courseCode} from the academic record, all plans, and all progress calculations?`,
                      )
                    ) {
                      void save(
                        draft.map((row) =>
                          row.id === c.id ? { ...row, archived: true } : row,
                        ),
                      );
                    }
                  }}
                  aria-label={`Remove ${c.courseCode}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!semesters.length && (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
          No courses yet. Add a course to start tracking progress.
        </p>
      )}
      <p className="text-xs text-slate-500">
        Completed and accepted transfer courses count as earned. Only mark
        transfer credit accepted after UDel has approved it. Grades are recorded
        for reference; status determines whether credits count.
      </p>
    </div>
  );
}

function CourseForm({
  course,
  onApply,
  onCancel,
  disabled,
  saving,
}: {
  disabled: boolean;
  saving: boolean;
  course: AcademicCourse;
  onApply: (course: AcademicCourse) => Promise<string | null>;
  onCancel: () => void;
}) {
  const { courses: COURSES } = useCatalog();
  const [value, setValue] = useState(() => ({
    ...course,
    fulfillsRequirements:
      course.courseCode === "CGSC 350"
        ? course.fulfillsRequirements?.map((id) =>
            id === "ppslp-cgsc375" ? "ppslp-cgsc350" : id,
          )
        : course.fulfillsRequirements,
  }));
  const [error, setError] = useState("");
  const update = <K extends keyof AcademicCourse>(
    key: K,
    next: AcademicCourse[K],
  ) => setValue((prev) => ({ ...prev, [key]: next }));
  const [creditsConfirmed, setCreditsConfirmed] = useState(true);
  function chooseCode(code: string) {
    const found = COURSES.find(
      (c) =>
        c.school === value.school &&
        c.courseCode === code.trim().toUpperCase().replace(/\s+/g, " "),
    );
    setCreditsConfirmed(!found?.creditsUnspecified);
    setValue((prev) => ({
      ...prev,
      courseCode: code.toUpperCase(),
      ...(found
        ? {
            title: found.title,
            credits: found.credits,
            fulfillsRequirements:
              found.fulfillsRequirements ?? suggestedRequirements(found),
          }
        : {}),
    }));
  }
  const catalogCourse = COURSES.find(
    (c) =>
      c.school === value.school &&
      c.courseCode ===
        value.courseCode.trim().toUpperCase().replace(/\s+/g, " "),
  );
  return (
    <form
      className="space-y-5 rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        if (disabled) return;
        if (catalogCourse?.creditsUnspecified && !creditsConfirmed) {
          setError(
            "Enter the enrolled credits; the catalog does not specify them.",
          );
          return;
        }
        setError(
          (await onApply({
            ...value,
            courseCode: value.courseCode
              .trim()
              .toUpperCase()
              .replace(/\s+/g, " "),
            title: value.title.trim(),
          })) ?? "",
        );
      }}
    >
      <fieldset disabled={saving} className="space-y-5">
        <h2 className="text-xl font-semibold">
          {course.courseCode ? `Edit ${course.courseCode}` : "Add a course"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">
            School
            <select
              className={selectClass}
              value={value.school}
              onChange={(e) => update("school", e.target.value as School)}
            >
              <option value="udel">University of Delaware</option>
              <option value="brookdale">Brookdale</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Term
            <select
              className={selectClass}
              value={value.term}
              onChange={(e) => update("term", e.target.value as Term)}
            >
              {["Fall", "Winter", "Spring", "Summer"].map((term) => (
                <option key={term}>{term}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Year
            <Input
              className="mt-1"
              type="number"
              min="2000"
              max="2100"
              required
              value={value.year}
              onChange={(e) => update("year", Number(e.target.value))}
            />
          </label>
          <label className="text-sm font-medium">
            Course code
            <Input
              className="mt-1"
              list="academic-catalog"
              maxLength={40}
              required
              value={value.courseCode}
              onChange={(e) => chooseCode(e.target.value)}
              placeholder="e.g. CGSC 170"
            />
            <datalist id="academic-catalog">
              {COURSES.filter((c) => c.school === value.school).map((c) => (
                <option key={c.id} value={c.courseCode}>
                  {c.title}
                </option>
              ))}
            </datalist>
          </label>
          {catalogCourse && (
            <p className="text-xs text-slate-600 sm:col-span-2">
              {catalogCourse.description}{" "}
              {catalogCourse.catalogUrl && (
                <a
                  href={catalogCourse.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  View official catalog entry
                </a>
              )}
            </p>
          )}
          <label className="text-sm font-medium sm:col-span-2">
            Course title
            <Input
              className="mt-1"
              maxLength={200}
              required
              value={value.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Credits
            <Input
              className="mt-1"
              type="number"
              min="0"
              max="30"
              step="0.1"
              required
              value={creditsConfirmed ? value.credits : ""}
              onChange={(e) => {
                setCreditsConfirmed(e.target.value !== "");
                update("credits", Number(e.target.value));
              }}
            />
          </label>
          <label className="text-sm font-medium">
            Status
            <select
              className={selectClass}
              value={value.status}
              onChange={(e) => update("status", e.target.value as CourseStatus)}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Grade (optional)
            <Input
              className="mt-1"
              maxLength={12}
              value={value.grade ?? ""}
              onChange={(e) => update("grade", e.target.value)}
              placeholder="e.g. A, B+, P, T"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Winter uses the year of the preceding Fall: winter break after Fall
          2026 is Winter 2026.
        </p>
        <fieldset className="rounded-lg border p-4">
          <legend className="px-2 text-sm font-semibold">
            Requirements this course fulfills
          </legend>
          <p className="mb-3 text-sm text-slate-500">
            Review suggested matches. Select approved substitutions here; leave
            all unchecked for elective credit only.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              update("fulfillsRequirements", suggestedRequirements(value))
            }
          >
            Suggest matches
          </Button>
          <div className="mt-3 grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
            {REQUIREMENTS.filter((r) => r.id !== "free-elective").map((r) => (
              <label key={r.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={value.fulfillsRequirements?.includes(r.id) ?? false}
                  onChange={(e) =>
                    update(
                      "fulfillsRequirements",
                      e.target.checked
                        ? [...(value.fulfillsRequirements ?? []), r.id]
                        : (value.fulfillsRequirements ?? []).filter(
                            (id) => id !== r.id,
                          ),
                    )
                  }
                />
                {r.name}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={disabled}>
            {saving ? "Saving…" : "Save course"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
