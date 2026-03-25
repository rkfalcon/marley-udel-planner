'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MARLEY_PROFILE, COMPLETED_COURSES } from '@/lib/data/marley-progress';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { TRANSFER_MAPPINGS } from '@/lib/data/transfer-mappings';
import { SECOND_WRITING_ALL_CODES } from '@/lib/data/second-writing-courses';
import { getCourseByCode } from '@/lib/data/courses';
import { Plan, PlanSemester, PlanCourse } from '@/lib/types';

// Requirement matching helpers (mirrors use-requirements logic)
const secondWritingSet = new Set(SECOND_WRITING_ALL_CODES);
const brookdaleToUdel = new Map<string, string>();
for (const m of TRANSFER_MAPPINGS) {
  for (const bc of m.brookdaleCourses) {
    if (!brookdaleToUdel.has(bc)) brookdaleToUdel.set(bc, m.udelCourseCode);
  }
}

function getUdelEquiv(code: string, school?: string): string {
  if (school === 'brookdale' || brookdaleToUdel.has(code)) return brookdaleToUdel.get(code) || code;
  return code;
}

function findRequirementsFulfilled(courseCode: string, school: string): string[] {
  const udelEquiv = getUdelEquiv(courseCode, school);
  const fulfilled: string[] = [];

  // Check completed courses for pre-mapped fulfillments
  const completed = COMPLETED_COURSES.find(c => c.courseCode === courseCode);
  if (completed?.fulfillsRequirements) {
    for (const reqId of completed.fulfillsRequirements) {
      const req = REQUIREMENTS.find(r => r.id === reqId);
      if (req && req.id !== 'free-elective') fulfilled.push(req.name);
    }
  }

  // Check requirement course options
  for (const req of REQUIREMENTS) {
    if (req.id === 'free-elective') continue;
    if (fulfilled.some(f => f === req.name)) continue;

    const matchesDirect = req.courseOptions?.includes(courseCode);
    const matchesEquiv = req.courseOptions?.includes(udelEquiv);
    const matchesSW = req.id === 'second-writing' && (secondWritingSet.has(courseCode) || secondWritingSet.has(udelEquiv));

    if (matchesDirect || matchesEquiv || matchesSW) {
      fulfilled.push(req.name);
    }
  }

  return fulfilled;
}

function getTransferInfo(courseCode: string): string | null {
  const mapping = TRANSFER_MAPPINGS.find(m =>
    m.brookdaleCourses.length === 1 && m.brookdaleCourses[0] === courseCode
  );
  if (mapping) return `Transfers as ${mapping.udelCourseCode} — ${mapping.udelTitle}`;
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 border-green-300',
    in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
    planned: 'bg-blue-100 text-blue-800 border-blue-300',
    transfer: 'bg-teal-100 text-teal-800 border-teal-300',
  };
  const labels: Record<string, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    planned: 'Planned',
    transfer: 'Transfer',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function PrintPlanPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/plans?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.semesters) setPlan(data as Plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Compute stats
  const stats = useMemo(() => {
    if (!plan) return null;
    const allCourses = plan.semesters.flatMap(s => s.courses);
    const completed = allCourses.filter(c => c.status === 'completed' || c.status === 'transfer');
    const inProgress = allCourses.filter(c => c.status === 'in_progress');
    const planned = allCourses.filter(c => c.status === 'planned');
    const totalCredits = allCourses.reduce((s, c) => s + c.credits, 0);
    const completedCredits = completed.reduce((s, c) => s + c.credits, 0);
    const inProgressCredits = inProgress.reduce((s, c) => s + c.credits, 0);
    const plannedCredits = planned.reduce((s, c) => s + c.credits, 0);

    // Count fulfilled requirements
    const fulfilledReqs = new Set<string>();
    for (const course of allCourses) {
      const reqs = findRequirementsFulfilled(course.courseCode, course.school);
      reqs.forEach(r => fulfilledReqs.add(r));
    }
    // Check completed courses from Marley's transcript too
    for (const course of COMPLETED_COURSES) {
      const reqs = findRequirementsFulfilled(course.courseCode, course.school);
      reqs.forEach(r => fulfilledReqs.add(r));
    }

    const unfulfilledReqs = REQUIREMENTS
      .filter(r => r.id !== 'free-elective' && !fulfilledReqs.has(r.name))
      .map(r => r.name);

    return {
      totalCredits,
      completedCredits,
      inProgressCredits,
      plannedCredits,
      remaining: Math.max(0, 124 - totalCredits),
      fulfilledCount: fulfilledReqs.size,
      totalReqs: REQUIREMENTS.filter(r => r.id !== 'free-elective').length,
      unfulfilledReqs,
    };
  }, [plan]);

  // Group semesters by academic year
  const academicYears = useMemo(() => {
    if (!plan) return [];
    const years = new Map<string, PlanSemester[]>();
    for (const sem of plan.semesters) {
      // Academic year: Fall X and Spring/Summer/Winter X+1 belong to X–(X+1)
      const ay = sem.term === 'Fall' || sem.term === 'Summer'
        ? `${sem.year}–${sem.year + 1}`
        : `${sem.year - 1}–${sem.year}`;
      if (!years.has(ay)) years.set(ay, []);
      years.get(ay)!.push(sem);
    }
    return Array.from(years.entries()).sort((a, b) => {
      const ya = parseInt(a[0]);
      const yb = parseInt(b[0]);
      return ya - yb;
    });
  }, [plan]);

  useEffect(() => {
    // Auto-trigger print after a brief delay to let styles render
    if (plan && !loading) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [plan, loading]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading plan...</div>
    );
  }

  if (!plan || !stats) {
    return (
      <div className="p-8 text-center text-gray-500">Plan not found</div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.5in; size: letter; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          body { background: #f1f5f9; }
        }
      `}</style>

      {/* Print button (hidden in print) */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 text-sm font-medium"
        >
          🖨️ Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg shadow-lg hover:bg-slate-700 text-sm font-medium"
        >
          ✕ Close
        </button>
      </div>

      <div className="max-w-[8.5in] mx-auto bg-white p-6 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="border-b-2 border-[#00539F] pb-4 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#00539F]">University of Delaware — Degree Plan</h1>
              <h2 className="text-lg font-semibold text-gray-800 mt-1">{plan.name}</h2>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold text-gray-800">{MARLEY_PROFILE.name}</p>
              <p>ID: {MARLEY_PROFILE.studentId}</p>
              <p>Plan Created: {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p>Printed: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Student Info & Summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-1 text-sm">
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Major:</span><span>{MARLEY_PROFILE.major}</span></div>
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Specialization:</span><span>{MARLEY_PROFILE.specialization}</span></div>
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Advisor:</span><span>{MARLEY_PROFILE.advisor}</span></div>
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Catalog Term:</span><span>{MARLEY_PROFILE.catalogTerm}</span></div>
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Cumulative GPA:</span><span>{MARLEY_PROFILE.cgpa.toFixed(3)}</span></div>
            <div className="flex gap-2"><span className="font-semibold text-gray-600 w-28">Target Grad:</span><span className="font-semibold text-[#00539F]">{plan.targetGraduation}{plan.isEarlyGraduation ? ' (Early Graduation)' : ''}</span></div>
          </div>

          <div className="border rounded-lg p-3 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Credit Summary</h3>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold text-green-700">{stats.completedCredits} cr</span>
              <span className="text-gray-600">In Progress:</span>
              <span className="font-semibold text-amber-600">{stats.inProgressCredits} cr</span>
              <span className="text-gray-600">Planned:</span>
              <span className="font-semibold text-blue-600">{stats.plannedCredits} cr</span>
              <span className="text-gray-600 font-semibold border-t pt-1">Total:</span>
              <span className="font-bold border-t pt-1">{stats.totalCredits} / 124 cr</span>
              {stats.remaining > 0 && <>
                <span className="text-gray-600">Remaining:</span>
                <span className="font-semibold text-red-600">{stats.remaining} cr</span>
              </>}
            </div>
            <div className="mt-2 pt-2 border-t text-sm">
              <span className="text-gray-600">Requirements Met:</span>
              <span className="font-semibold ml-1">{stats.fulfilledCount} / {stats.totalReqs}</span>
            </div>
          </div>
        </div>

        {/* Semester-by-Semester Plan */}
        <h3 className="text-base font-bold text-gray-800 mb-3 border-b pb-1">Semester Plan</h3>

        {academicYears.map(([year, semesters], ayIdx) => {
          const yearCredits = semesters.reduce((s, sem) =>
            s + sem.courses.reduce((cs, c) => cs + c.credits, 0), 0
          );
          return (
            <div key={year} className={ayIdx > 0 ? 'mt-4' : ''}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-[#00539F]">Academic Year {year}</h4>
                <span className="text-xs text-gray-500">{yearCredits} credits</span>
              </div>

              {semesters.map(sem => {
                if (sem.courses.length === 0) return null;
                const semCredits = sem.courses.reduce((s, c) => s + c.credits, 0);
                const isBrookdale = sem.school === 'brookdale';

                return (
                  <div key={sem.id} className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        {sem.term} {sem.year}
                      </span>
                      {isBrookdale && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-semibold border border-teal-200">
                          Brookdale CC
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">{semCredits} credits</span>
                    </div>

                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 pr-2 text-[10px] font-semibold text-gray-500 uppercase w-24">Course</th>
                          <th className="text-left py-1 pr-2 text-[10px] font-semibold text-gray-500 uppercase">Title</th>
                          <th className="text-center py-1 px-1 text-[10px] font-semibold text-gray-500 uppercase w-10">Cr</th>
                          <th className="text-center py-1 px-1 text-[10px] font-semibold text-gray-500 uppercase w-16">Status</th>
                          <th className="text-center py-1 px-1 text-[10px] font-semibold text-gray-500 uppercase w-12">Grade</th>
                          <th className="text-left py-1 pl-2 text-[10px] font-semibold text-gray-500 uppercase">Requirements Fulfilled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map(course => {
                          const isElecPlaceholder = course.courseCode.startsWith('ELEC');
                          const reqsFulfilled = isElecPlaceholder
                            ? ['Free Elective']
                            : findRequirementsFulfilled(course.courseCode, course.school);
                          const transferInfo = isBrookdale ? getTransferInfo(course.courseCode) : null;

                          return (
                            <tr key={course.id} className="border-b border-gray-100">
                              <td className="py-1.5 pr-2 font-mono text-xs font-semibold text-gray-800">
                                {isElecPlaceholder ? 'ELECTIVE' : course.courseCode}
                              </td>
                              <td className="py-1.5 pr-2 text-gray-700">
                                <div>{course.title || (isElecPlaceholder ? 'Elective Placeholder' : '')}</div>
                                {transferInfo && (
                                  <div className="text-[10px] text-teal-600 italic">{transferInfo}</div>
                                )}
                              </td>
                              <td className="py-1.5 px-1 text-center font-semibold">{course.credits}</td>
                              <td className="py-1.5 px-1 text-center">
                                <StatusBadge status={course.status} />
                              </td>
                              <td className="py-1.5 px-1 text-center font-semibold text-gray-700">
                                {course.grade || '—'}
                              </td>
                              <td className="py-1.5 pl-2 text-[11px] text-gray-500">
                                {reqsFulfilled.length > 0
                                  ? reqsFulfilled.join('; ')
                                  : <span className="text-gray-300">Elective</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Unfulfilled Requirements */}
        {stats.unfulfilledReqs.length > 0 && (
          <div className="mt-6 page-break">
            <h3 className="text-base font-bold text-red-700 mb-2 border-b border-red-200 pb-1">
              Outstanding Requirements ({stats.unfulfilledReqs.length})
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {stats.unfulfilledReqs.map(req => (
                <div key={req} className="flex items-center gap-2 py-0.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-3 border-t border-gray-200 text-[10px] text-gray-400 flex justify-between">
          <span>University of Delaware — {MARLEY_PROFILE.major} — {MARLEY_PROFILE.specialization}</span>
          <span>Plan URL: marley-udel-planner.vercel.app/plan/{plan.slug}</span>
        </div>

        {/* Advisor signature lines */}
        <div className="mt-8 grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Student Signature / Date</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Advisor Signature / Date</p>
          </div>
        </div>
      </div>
    </>
  );
}
