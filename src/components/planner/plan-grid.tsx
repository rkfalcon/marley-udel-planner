'use client';

import { useState } from 'react';
import { GraduationCap, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SemesterCard } from './semester-card';
import { CoursePicker } from './course-picker';
import { Plan, PlanSemester, PlanCourse, Course } from '@/lib/types';

interface PlanGridProps {
  plan: Plan;
  onAddCourse: (semesterId: string, course: Omit<PlanCourse, 'id' | 'planSemesterId'>) => void;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
}

// Semesters that should be treated as "past" (locked)
const CURRENT_YEAR = 2026;
const CURRENT_TERM_ORDER = 1; // Spring = 1

const SEMESTER_ORDER: Record<string, number> = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

function isSemesterLocked(semester: PlanSemester): boolean {
  if (semester.year < CURRENT_YEAR) return true;
  if (semester.year === CURRENT_YEAR) {
    return SEMESTER_ORDER[semester.term] <= CURRENT_TERM_ORDER;
  }
  return false;
}

// Order within an academic year: Fall → Winter → Spring → Summer
const ACADEMIC_YEAR_ORDER: Record<string, number> = {
  Fall: 0,
  Winter: 1,
  Spring: 2,
  Summer: 3,
};

function groupByAcademicYear(
  semesters: PlanSemester[]
): Map<string, PlanSemester[]> {
  const groups = new Map<string, PlanSemester[]>();

  for (const semester of semesters) {
    // Special case: Prior Credits (Summer 2024 Brookdale) gets its own group
    // It represents credits earned before starting at UDel
    const isPriorCredits = semester.term === 'Summer' && semester.year === 2024 && semester.school === 'brookdale';

    let academicYear: string;
    if (isPriorCredits) {
      academicYear = 'Prior to UDel';
    } else if (semester.term === 'Fall' || semester.term === 'Winter') {
      // Fall N and Winter N → Academic Year N–(N+1)
      academicYear = `${semester.year}–${semester.year + 1}`;
    } else {
      // Spring N and Summer N → Academic Year (N-1)–N
      academicYear = `${semester.year - 1}–${semester.year}`;
    }

    if (!groups.has(academicYear)) {
      groups.set(academicYear, []);
    }
    groups.get(academicYear)!.push(semester);
  }

  // Sort semesters within each academic year: Fall → Winter → Spring → Summer
  for (const [, sems] of groups) {
    sems.sort((a, b) => ACADEMIC_YEAR_ORDER[a.term] - ACADEMIC_YEAR_ORDER[b.term]);
  }

  return groups;
}

export function PlanGrid({ plan, onAddCourse, onRemoveCourse }: PlanGridProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);

  const activeSemester = plan.semesters.find((s) => s.id === activeSemesterId);

  const handleAddCourse = (semesterId: string) => {
    setActiveSemesterId(semesterId);
    setPickerOpen(true);
  };

  const handleSelectCourse = (course: Course) => {
    if (!activeSemesterId || !activeSemester) return;

    onAddCourse(activeSemesterId, {
      courseCode: course.courseCode,
      title: course.title,
      school: course.school,
      credits: course.credits,
      status: 'planned',
    });
  };

  const totalPlanned = plan.semesters
    .flatMap((s) => s.courses)
    .reduce((sum, c) => sum + c.credits, 0);

  const totalCompleted = plan.semesters
    .flatMap((s) => s.courses)
    .filter((c) => c.status === 'completed' || c.status === 'transfer')
    .reduce((sum, c) => sum + c.credits, 0);

  const totalInProgress = plan.semesters
    .flatMap((s) => s.courses)
    .filter((c) => c.status === 'in_progress')
    .reduce((sum, c) => sum + c.credits, 0);

  const academicYearGroups = groupByAcademicYear(plan.semesters);
  const sortedYears = Array.from(academicYearGroups.keys()).sort((a, b) => {
    const yearA = parseInt(a.split('–')[0]);
    const yearB = parseInt(b.split('–')[0]);
    return yearA - yearB;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">{plan.name}</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-600">
              <span className="font-semibold text-slate-800">{totalCompleted}</span> completed
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-600">
              <span className="font-semibold text-slate-800">{totalInProgress}</span> in progress
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-slate-600">
              <span className="font-semibold text-slate-800">
                {totalPlanned - totalCompleted - totalInProgress}
              </span>{' '}
              planned
            </span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">
            Target:{' '}
            <span className="font-semibold text-slate-700">
              {plan.targetGraduation}
            </span>
          </span>
          {plan.isEarlyGraduation && (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 border font-medium px-1.5 py-0 h-4">
              Early Grad
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex flex-col h-full">
          {sortedYears.map((academicYear) => {
            const semesters = academicYearGroups.get(academicYear)!;

            return (
              <div key={academicYear} className="shrink-0">
                {/* Year divider */}
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 sticky left-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    Academic Year {academicYear}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {semesters.reduce(
                      (sum, s) =>
                        sum + s.courses.reduce((cs, c) => cs + c.credits, 0),
                      0
                    )}{' '}
                    credits
                  </span>
                </div>

                {/* Semesters row */}
                <div className="flex gap-3 px-4 py-3 overflow-x-auto">
                  {semesters.map((semester) => (
                    <SemesterCard
                      key={semester.id}
                      semester={semester}
                      onAddCourse={handleAddCourse}
                      onRemoveCourse={onRemoveCourse}
                      isLocked={isSemesterLocked(semester)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course picker sheet */}
      <CoursePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectCourse={handleSelectCourse}
        semesterTerm={activeSemester?.term}
        semesterSchool={activeSemester?.school}
        plannedCourseCodes={plan.semesters.flatMap(s => s.courses.map(c => c.courseCode))}
        totalPlanCredits={plan.semesters.reduce((sum, s) => sum + s.courses.reduce((cs, c) => cs + c.credits, 0), 0)}
      />
    </div>
  );
}
