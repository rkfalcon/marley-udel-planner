'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getCreditsCompleted,
  getCreditsInProgress,
  getCreditsRemaining,
  COMPLETED_COURSES,
  MARLEY_PROFILE,
} from '@/lib/data/marley-progress';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { CheckCircle2, Clock, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

const RADIUS = 80;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;

interface ArcProps {
  offset: number;
  dashLength: number;
  color: string;
  delay?: number;
  animated: boolean;
}

function Arc({ offset, dashLength, color, delay = 0, animated }: ArcProps) {
  const [currentLength, setCurrentLength] = useState(0);

  useEffect(() => {
    if (!animated) return;
    const timeout = setTimeout(() => {
      setCurrentLength(dashLength);
    }, delay);
    return () => clearTimeout(timeout);
  }, [animated, dashLength, delay]);

  const displayLength = animated ? currentLength : dashLength;

  return (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={`${displayLength} ${CIRCUMFERENCE - displayLength}`}
      strokeDashoffset={-offset}
      strokeLinecap="round"
      style={{
        transition: animated ? 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        transformOrigin: 'center',
        transform: 'rotate(-90deg)',
      }}
    />
  );
}

type CreditCategory = 'completed' | 'in_progress' | 'remaining';

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
  dotClass: string;
  sublabel?: string;
  onClick: () => void;
}

function StatCard({ label, value, colorClass, dotClass, sublabel, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl px-4 py-4 gap-1',
        'bg-white border border-slate-100 shadow-sm',
        'cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:border-slate-200 hover:scale-[1.02]',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2.5 h-2.5 rounded-full', dotClass)} />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className={cn('text-3xl font-bold tabular-nums', colorClass)}>{value}</span>
      <span className="text-xs text-slate-400">{sublabel ?? 'credits'}</span>
    </button>
  );
}

// Build the remaining requirements list
function getRemainingRequirements() {
  const completedCodes = new Set(COMPLETED_COURSES.map(c => c.courseCode));
  const inProgressCodes = new Set(
    COMPLETED_COURSES.filter(c => c.status === 'in_progress').map(c => c.courseCode)
  );

  return REQUIREMENTS.filter(req => {
    if (req.id === 'free-elective') return true;
    // Check if any of the course options are completed or in progress
    const isFulfilled = req.courseOptions?.some(code => completedCodes.has(code));
    const isInProgress = req.courseOptions?.some(code => inProgressCodes.has(code));
    return !isFulfilled && !isInProgress;
  }).map(req => ({
    id: req.id,
    name: req.name,
    credits: req.creditsRequired,
    category: req.category,
    description: req.description,
    courseOptions: req.courseOptions || [],
  }));
}

const CATEGORY_LABELS: Record<string, string> = {
  university: 'University',
  college: 'College of A&S',
  major_core: 'Major Core',
  ppslp: 'PPSLP Specialization',
  elective: 'Electives',
};

function CourseDetailDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CreditCategory;
}) {
  const completedCourses = COMPLETED_COURSES.filter(
    c => c.status === 'completed' || c.status === 'transfer'
  );
  const inProgressCourses = COMPLETED_COURSES.filter(c => c.status === 'in_progress');
  const remaining = getRemainingRequirements();

  const config = {
    completed: {
      title: 'Completed Credits',
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      accent: 'green' as const,
      subtitle: `${getCreditsCompleted()} credits earned across ${completedCourses.length} courses`,
    },
    in_progress: {
      title: 'In Progress Credits',
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      accent: 'amber' as const,
      subtitle: `${getCreditsInProgress()} credits currently in progress — Spring 2026`,
    },
    remaining: {
      title: 'Remaining Credits Needed',
      icon: <BookOpen className="h-5 w-5 text-slate-500" />,
      accent: 'slate' as const,
      subtitle: `${getCreditsRemaining()} credits still needed to reach ${MARLEY_PROFILE.totalCreditsRequired}`,
    },
  }[category];

  const accentStyles = {
    green: {
      headerBg: 'bg-green-50',
      headerBorder: 'border-green-100',
      badge: 'bg-green-100 text-green-700 border-green-200',
      rowHover: 'hover:bg-green-50/50',
      creditBg: 'bg-green-100 text-green-700',
    },
    amber: {
      headerBg: 'bg-amber-50',
      headerBorder: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      rowHover: 'hover:bg-amber-50/50',
      creditBg: 'bg-amber-100 text-amber-700',
    },
    slate: {
      headerBg: 'bg-slate-50',
      headerBorder: 'border-slate-100',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      rowHover: 'hover:bg-slate-50/50',
      creditBg: 'bg-slate-100 text-slate-600',
    },
  }[config.accent];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <div className={cn('px-6 pt-6 pb-4 border-b', accentStyles.headerBg, accentStyles.headerBorder)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-800">
              {config.icon}
              {config.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-1.5">{config.subtitle}</p>
        </div>

        {/* Course list */}
        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-4 space-y-1">
            {category === 'completed' && (
              <>
                {/* UDel courses */}
                {completedCourses.filter(c => c.school === 'udel').length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        University of Delaware
                      </span>
                    </div>
                    {completedCourses
                      .filter(c => c.school === 'udel')
                      .map(course => (
                        <div
                          key={course.courseCode}
                          className={cn(
                            'flex items-center justify-between py-2.5 px-3 rounded-lg -mx-1 transition-colors',
                            accentStyles.rowHover
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-700">
                                {course.courseCode}
                              </span>
                              {course.grade && course.grade !== 'CR' && course.grade !== 'P' && (
                                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', accentStyles.badge)}>
                                  {course.grade}
                                </Badge>
                              )}
                              {course.grade === 'P' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                  Pass
                                </Badge>
                              )}
                              {course.grade === 'CR' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                  Credit
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{course.title}</p>
                          </div>
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', accentStyles.creditBg)}>
                            {course.credits} cr
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Transfer courses */}
                {completedCourses.filter(c => c.school === 'brookdale').length > 0 && (
                  <div>
                    <Separator className="mb-3" />
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-3.5 w-3.5 text-teal-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Transfer Credits (Brookdale CC)
                      </span>
                    </div>
                    {completedCourses
                      .filter(c => c.school === 'brookdale')
                      .map(course => (
                        <div
                          key={course.courseCode}
                          className={cn(
                            'flex items-center justify-between py-2.5 px-3 rounded-lg -mx-1 transition-colors',
                            'hover:bg-teal-50/50'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-700">
                                {course.courseCode}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-teal-50 text-teal-600 border-teal-200">
                                Transfer
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{course.title}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-700">
                            {course.credits} cr
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Total */}
                <Separator className="mt-3" />
                <div className="flex items-center justify-between pt-3 px-3 -mx-1">
                  <span className="text-sm font-semibold text-slate-600">Total Completed</span>
                  <span className="text-sm font-bold text-green-600">{getCreditsCompleted()} credits</span>
                </div>
              </>
            )}

            {category === 'in_progress' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Spring 2026 — University of Delaware
                  </span>
                </div>
                {inProgressCourses.map(course => (
                  <div
                    key={course.courseCode}
                    className={cn(
                      'flex items-center justify-between py-2.5 px-3 rounded-lg -mx-1 transition-colors',
                      accentStyles.rowHover
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {course.courseCode}
                        </span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', accentStyles.badge)}>
                          In Progress
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{course.title}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', accentStyles.creditBg)}>
                      {course.credits} cr
                    </span>
                  </div>
                ))}

                <Separator className="mt-3" />
                <div className="flex items-center justify-between pt-3 px-3 -mx-1">
                  <span className="text-sm font-semibold text-slate-600">Total In Progress</span>
                  <span className="text-sm font-bold text-amber-600">{getCreditsInProgress()} credits</span>
                </div>
              </>
            )}

            {category === 'remaining' && (
              <>
                {/* Group remaining by category */}
                {Object.entries(
                  remaining
                    .filter(r => r.id !== 'free-elective')
                    .reduce<Record<string, typeof remaining>>((acc, req) => {
                      const cat = req.category;
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(req);
                      return acc;
                    }, {})
                ).map(([cat, reqs]) => (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-slate-50 text-slate-500 border-slate-200">
                        {reqs.reduce((s, r) => s + r.credits, 0)} cr
                      </Badge>
                    </div>
                    {reqs.map(req => (
                      <div
                        key={req.id}
                        className={cn(
                          'flex items-center justify-between py-2.5 px-3 rounded-lg -mx-1 transition-colors',
                          accentStyles.rowHover
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-700">
                            {req.name}
                          </span>
                          {req.courseOptions.length > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              Options: {req.courseOptions.slice(0, 4).join(', ')}
                              {req.courseOptions.length > 4 && ` +${req.courseOptions.length - 4} more`}
                            </p>
                          )}
                          {req.description && req.courseOptions.length === 0 && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{req.description}</p>
                          )}
                        </div>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md shrink-0', accentStyles.creditBg)}>
                          {req.credits} cr
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Free electives */}
                <Separator className="mb-3" />
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Free Electives
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg -mx-1 bg-slate-50">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-slate-700">
                        Additional credits to reach 124
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Any UDel or transferable Brookdale course
                      </p>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', accentStyles.creditBg)}>
                      ~{getCreditsRemaining() - remaining.filter(r => r.id !== 'free-elective').reduce((s, r) => s + r.credits, 0)} cr
                    </span>
                  </div>
                </div>

                <Separator className="mt-3" />
                <div className="flex items-center justify-between pt-3 px-3 -mx-1">
                  <span className="text-sm font-semibold text-slate-600">Total Remaining</span>
                  <span className="text-sm font-bold text-slate-600">{getCreditsRemaining()} credits</span>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CreditProgress() {
  const [animated, setAnimated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CreditCategory>('completed');

  const completed = getCreditsCompleted();
  const inProgress = getCreditsInProgress();
  const remaining = getCreditsRemaining();
  const total = MARLEY_PROFILE.totalCreditsRequired;

  const completedLength = (completed / total) * CIRCUMFERENCE;
  const inProgressLength = (inProgress / total) * CIRCUMFERENCE;
  const completedOffset = 0;
  const inProgressOffset = completedLength;

  const overallPercent = Math.round(((completed + inProgress) / total) * 100);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  const openDialog = (category: CreditCategory) => {
    setActiveCategory(category);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-label={`${completed + inProgress} of ${total} credits`}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={STROKE_WIDTH}
          />
          {/* In-progress arc */}
          <Arc
            offset={inProgressOffset}
            dashLength={inProgressLength}
            color="#f59e0b"
            delay={300}
            animated={animated}
          />
          {/* Completed arc */}
          <Arc
            offset={completedOffset}
            dashLength={completedLength}
            color="#22c55e"
            delay={0}
            animated={animated}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-4xl font-bold text-slate-800 tabular-nums leading-none">
            {completed + inProgress}
          </span>
          <span className="text-xs text-slate-400 mt-1">of {total} credits</span>
          <span className="text-sm font-semibold text-slate-600 mt-0.5">{overallPercent}%</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-green-500 inline-block" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" />
          In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-slate-200 inline-block" />
          Remaining
        </span>
      </div>

      {/* Clickable Stat cards */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <StatCard
          label="Completed"
          value={completed}
          colorClass="text-green-600"
          dotClass="bg-green-500"
          onClick={() => openDialog('completed')}
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          colorClass="text-amber-500"
          dotClass="bg-amber-400"
          onClick={() => openDialog('in_progress')}
        />
        <StatCard
          label="Remaining"
          value={remaining}
          colorClass="text-slate-500"
          dotClass="bg-slate-300"
          onClick={() => openDialog('remaining')}
        />
      </div>

      {/* Detail dialog */}
      <CourseDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={activeCategory}
      />
    </div>
  );
}
