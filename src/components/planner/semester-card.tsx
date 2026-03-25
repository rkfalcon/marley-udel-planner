'use client';

import { Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CourseChip } from './course-chip';
import { PlanSemester } from '@/lib/types';

interface SemesterCardProps {
  semester: PlanSemester;
  onAddCourse: (semesterId: string) => void;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
  isLocked?: boolean;
}

function formatSemesterLabel(term: string, year: number): string {
  return `${term} ${year}`;
}

export function SemesterCard({
  semester,
  onAddCourse,
  onRemoveCourse,
  isLocked = false,
}: SemesterCardProps) {
  const { term, year, school, courses } = semester;
  const isBrookdale = school === 'brookdale';
  const isBreak = term === 'Summer' || term === 'Winter';
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  // Special case: prior transfer credits (Summer 2025 Brookdale with all completed/transfer courses)
  const isPriorTransfer = term === 'Summer' && year === 2024 && isBrookdale && isLocked &&
    courses.length > 0 && courses.every(c => c.status === 'completed' || c.status === 'transfer');

  const label = isPriorTransfer
    ? 'Prior Credits'
    : formatSemesterLabel(term, year);

  const cardClasses = cn(
    'w-56 shrink-0 flex flex-col shadow-sm transition-all duration-150',
    {
      // Prior transfer credits - grey with special styling
      'bg-gray-50 border-gray-300': isPriorTransfer,
      // UDel semesters - white with blue accent
      'bg-white border-slate-200 hover:shadow-md': !isBrookdale && !isLocked && !isPriorTransfer,
      // Brookdale semesters - subtle green tint
      'bg-emerald-50/60 border-emerald-200 hover:shadow-md':
        isBrookdale && !isLocked && !isPriorTransfer,
      // Locked Brookdale semesters — keep green tint
      'bg-emerald-50/40 border-emerald-200 opacity-90': isBrookdale && isLocked && !isPriorTransfer,
      // Locked UDel semesters
      'bg-slate-50 border-slate-200 opacity-80': isLocked && !isBrookdale && !isPriorTransfer,
    }
  );

  const headerClasses = cn(
    'px-3 pt-3 pb-2 rounded-t-lg',
    isPriorTransfer && 'bg-gray-500',
    !isPriorTransfer && isBrookdale && !isLocked && 'bg-emerald-600',
    !isPriorTransfer && isBrookdale && isLocked && 'bg-emerald-600/80',
    !isPriorTransfer && !isBrookdale && !isLocked && 'bg-blue-600',
    !isPriorTransfer && !isBrookdale && isLocked && 'bg-slate-400',
  );

  return (
    <Card className={cardClasses}>
      {/* Colored header bar */}
      <div className={headerClasses}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm leading-tight">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {isLocked && (
              <Lock className="h-3 w-3 text-white/80" aria-label="Locked" />
            )}
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 h-4 font-semibold border-0',
                !isBrookdale && !isLocked && 'bg-blue-500 text-white',
                isBrookdale && 'bg-emerald-500 text-white',
                isLocked && !isBrookdale && 'bg-slate-300 text-slate-700'
              )}
            >
              {isBrookdale ? 'Brookdale' : 'UDel'}
            </Badge>
          </div>
        </div>
        {isPriorTransfer && (
          <p className="text-white/70 text-[10px] mt-0.5 leading-tight">
            Credits from Brookdale CC
          </p>
        )}
        {isBreak && !isPriorTransfer && (
          <p className="text-white/70 text-[10px] mt-0.5 leading-tight">
            {term === 'Summer' ? 'Summer Session' : 'Winter Session'}
          </p>
        )}
      </div>

      <CardContent className="flex flex-col flex-1 px-3 py-2.5 gap-1.5">
        {/* Course list */}
        {courses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-4">
            <p
              className={cn('text-xs text-center', {
                'text-slate-400': !isBrookdale,
                'text-emerald-400': isBrookdale,
              })}
            >
              {isLocked ? 'No courses' : 'No courses added'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {courses.map((course) => (
              <CourseChip
                key={course.id}
                courseCode={course.courseCode}
                title={course.title}
                credits={course.credits}
                status={course.status}
                school={course.school}
                grade={course.grade}
                onRemove={
                  !isLocked && course.status === 'planned'
                    ? () => onRemoveCourse(semester.id, course.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2">
          <Separator
            className={cn({
              'bg-slate-100': !isBrookdale,
              'bg-emerald-100': isBrookdale,
            })}
          />
          <div className="flex items-center justify-between pt-2">
            <span
              className={cn('text-[11px] font-medium', {
                'text-slate-500': !isBrookdale && !isLocked,
                'text-emerald-600': isBrookdale && !isLocked,
                'text-slate-400': isLocked,
              })}
            >
              {totalCredits} credit{totalCredits !== 1 ? 's' : ''}
            </span>
            {!isLocked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddCourse(semester.id)}
                className={cn(
                  'h-6 px-1.5 text-[11px] gap-0.5 font-medium',
                  {
                    'text-blue-600 hover:text-blue-700 hover:bg-blue-50':
                      !isBrookdale,
                    'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50':
                      isBrookdale,
                  }
                )}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
