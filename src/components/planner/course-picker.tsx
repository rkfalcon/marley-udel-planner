'use client';

import { useState, useMemo } from 'react';
import { Search, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { COURSES, searchCourses } from '@/lib/data/courses';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { TRANSFER_MAPPINGS } from '@/lib/data/transfer-mappings';
import { Course, Term } from '@/lib/types';

interface CoursePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCourse: (course: Course) => void;
  semesterTerm?: Term;
  semesterSchool?: 'udel' | 'brookdale';
}

function getRequirementName(courseCode: string): string | null {
  for (const req of REQUIREMENTS) {
    if (req.courseOptions?.includes(courseCode)) {
      return req.name;
    }
  }
  return null;
}

function getTransferMapping(courseCode: string) {
  return TRANSFER_MAPPINGS.find((m) => m.brookdaleCourses.includes(courseCode));
}

export function CoursePicker({
  open,
  onOpenChange,
  onSelectCourse,
  semesterTerm,
  semesterSchool = 'udel',
}: CoursePickerProps) {
  const [query, setQuery] = useState('');
  const [activeSchool, setActiveSchool] = useState<'udel' | 'brookdale'>(
    semesterSchool
  );

  const filteredCourses = useMemo(() => {
    const results = searchCourses(query, activeSchool);
    // Sort: courses fulfilling requirements first
    return results.sort((a, b) => {
      const aFulfills = getRequirementName(a.courseCode) !== null;
      const bFulfills = getRequirementName(b.courseCode) !== null;
      if (aFulfills && !bFulfills) return -1;
      if (!aFulfills && bFulfills) return 1;
      return a.courseCode.localeCompare(b.courseCode);
    });
  }, [query, activeSchool]);

  const handleSelect = (course: Course) => {
    onSelectCourse(course);
    onOpenChange(false);
    setQuery('');
  };

  const semesterLabel = semesterTerm
    ? `${semesterTerm} ${semesterSchool === 'brookdale' ? '(Brookdale)' : '(UDel)'}`
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
          <SheetTitle className="text-lg font-bold text-slate-800">
            Add Course
          </SheetTitle>
          {semesterLabel && (
            <p className="text-sm text-slate-500 mt-0.5">
              Adding to{' '}
              <span className="font-medium text-slate-700">{semesterLabel}</span>
            </p>
          )}
        </SheetHeader>

        <div className="px-5 pt-4 pb-3 space-y-3">
          {/* School toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
            <button
              onClick={() => setActiveSchool('udel')}
              className={cn(
                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-150',
                activeSchool === 'udel'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              UDel Courses
            </button>
            <button
              onClick={() => setActiveSchool('brookdale')}
              className={cn(
                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-150',
                activeSchool === 'brookdale'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Brookdale Courses
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code or title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm border-slate-200 focus:border-blue-300"
              autoFocus
            />
          </div>

          <p className="text-xs text-slate-400">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
            {query && ` for "${query}"`}
          </p>
        </div>

        <ScrollArea className="flex-1 px-5 pb-5">
          <div className="space-y-2">
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No courses found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try a different search term or switch schools
                </p>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const reqName = getRequirementName(course.courseCode);
                const transferMap =
                  course.school === 'brookdale'
                    ? getTransferMapping(course.courseCode)
                    : null;
                const isBrookdale = course.school === 'brookdale';

                return (
                  <button
                    key={course.id}
                    onClick={() => handleSelect(course)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-all duration-150 group',
                      'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1',
                      {
                        'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 focus:ring-blue-300':
                          !isBrookdale,
                        'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50 focus:ring-emerald-300':
                          isBrookdale,
                        // Highlight courses that fulfill requirements
                        'border-blue-200 bg-blue-50/30': reqName && !isBrookdale,
                        'border-emerald-200 bg-emerald-50/30': reqName && isBrookdale,
                      }
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn('text-sm font-bold', {
                              'text-blue-700': !isBrookdale,
                              'text-emerald-700': isBrookdale,
                            })}
                          >
                            {course.courseCode}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 h-4 py-0 font-semibold border', {
                              'border-blue-200 text-blue-600 bg-blue-50': !isBrookdale,
                              'border-emerald-200 text-emerald-600 bg-emerald-50': isBrookdale,
                            })}
                          >
                            {course.credits} cr
                          </Badge>
                          {reqName && (
                            <Star
                              className={cn('h-3 w-3 fill-current shrink-0', {
                                'text-amber-400': true,
                              })}
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-tight">
                          {course.title}
                        </p>
                        {course.typicallyOffered && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Offered: {course.typicallyOffered}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        className={cn(
                          'h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                          {
                            'text-blue-400': !isBrookdale,
                            'text-emerald-400': isBrookdale,
                          }
                        )}
                      />
                    </div>

                    {/* Requirement fulfillment badge */}
                    {reqName && (
                      <div className="mt-2">
                        <Badge
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 h-auto border-0',
                            {
                              'bg-amber-100 text-amber-700': true,
                            }
                          )}
                        >
                          Fulfills: {reqName.replace(/^[A-Z]+\s\d+\s[-–]\s/, '')}
                        </Badge>
                      </div>
                    )}

                    {/* Transfer mapping info */}
                    {transferMap && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">
                          Transfers as:
                        </span>
                        <Badge
                          className="text-[10px] font-medium px-2 py-0.5 h-auto bg-teal-100 text-teal-700 border-0"
                        >
                          {transferMap.udelCourseCode} — {transferMap.udelTitle}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
