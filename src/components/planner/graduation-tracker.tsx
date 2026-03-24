'use client';

import { useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRequirements } from '@/hooks/use-requirements';
import { MARLEY_PROFILE } from '@/lib/data/marley-progress';
import { Plan, PlanCourse } from '@/lib/types';

interface GraduationTrackerProps {
  plan: Plan;
}

const TOTAL_CREDITS_REQUIRED = MARLEY_PROFILE.totalCreditsRequired;

const CATEGORY_LABELS: Record<string, string> = {
  university: 'University Reqs',
  college: 'College of A&S',
  major_core: 'Major Core',
  ppslp: 'PPSLP Specialization',
  elective: 'Electives',
};

const CATEGORY_COLORS: Record<string, string> = {
  university: 'text-purple-600',
  college: 'text-indigo-600',
  major_core: 'text-blue-600',
  ppslp: 'text-teal-600',
  elective: 'text-slate-500',
};

export function GraduationTracker({ plan }: GraduationTrackerProps) {
  const allPlanCourses = useMemo<PlanCourse[]>(
    () => plan.semesters.flatMap((s) => s.courses),
    [plan]
  );

  const plannedOnlyCourses = useMemo(
    () => allPlanCourses.filter((c) => c.status === 'planned'),
    [allPlanCourses]
  );

  const { groups, totalCompleted, totalFulfilled, totalInProgress, totalNotStarted, totalRequirements } =
    useRequirements(plannedOnlyCourses);

  // Credit tallies
  const completedCredits = allPlanCourses
    .filter((c) => c.status === 'completed' || c.status === 'transfer')
    .reduce((sum, c) => sum + c.credits, 0);

  const inProgressCredits = allPlanCourses
    .filter((c) => c.status === 'in_progress')
    .reduce((sum, c) => sum + c.credits, 0);

  const plannedCredits = allPlanCourses
    .filter((c) => c.status === 'planned')
    .reduce((sum, c) => sum + c.credits, 0);

  const totalCreditsSoFar = completedCredits + inProgressCredits + plannedCredits;
  const progressPercent = Math.min(
    100,
    Math.round((totalCreditsSoFar / TOTAL_CREDITS_REQUIRED) * 100)
  );
  const creditsNeeded = Math.max(0, TOTAL_CREDITS_REQUIRED - totalCreditsSoFar);
  const isOnTrack = totalCreditsSoFar >= TOTAL_CREDITS_REQUIRED;

  // Estimate graduation
  const estimatedGrad = useMemo(() => {
    if (isOnTrack) return plan.targetGraduation;
    const semestersWithCourses = plan.semesters.filter((s) => s.courses.length > 0);
    if (semestersWithCourses.length === 0) return 'Unknown';
    const last = semestersWithCourses[semestersWithCourses.length - 1];
    return `${last.term} ${last.year}`;
  }, [plan, isOnTrack]);

  const requirementSummary = useMemo(() => {
    return { met: totalCompleted, inProgress: totalInProgress, total: totalRequirements };
  }, [totalCompleted, totalInProgress, totalRequirements]);

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base font-bold text-slate-800">
            Graduation Progress
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500">
          {MARLEY_PROFILE.major}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1 overflow-y-auto pb-4">
        {/* Credit progress */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Total Credits</span>
            <span className="text-xs font-bold text-slate-800">
              {totalCreditsSoFar}
              <span className="text-slate-400 font-normal">/{TOTAL_CREDITS_REQUIRED}</span>
            </span>
          </div>

          <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${Math.min(100, (completedCredits / TOTAL_CREDITS_REQUIRED) * 100)}%` }} />
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${Math.min(100, (inProgressCredits / TOTAL_CREDITS_REQUIRED) * 100)}%` }} />
            <div className="h-full bg-blue-300 transition-all duration-500" style={{ width: `${Math.min(100, (plannedCredits / TOTAL_CREDITS_REQUIRED) * 100)}%` }} />
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />{completedCredits} done</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />{inProgressCredits} in prog.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300 shrink-0" />{plannedCredits} planned</span>
          </div>

          {!isOnTrack && creditsNeeded > 0 && (
            <div className="flex items-center gap-1.5 mt-2 p-2 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] text-amber-700">Need {creditsNeeded} more credit{creditsNeeded !== 1 ? 's' : ''} to graduate</span>
            </div>
          )}

          {isOnTrack && (
            <div className="flex items-center gap-1.5 mt-2 p-2 rounded-md bg-emerald-50 border border-emerald-200">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-[11px] text-emerald-700 font-medium">On track to graduate!</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Estimated graduation */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Est. Graduation</span>
          <Badge className={cn('text-xs font-bold px-2.5 py-1 border', isOnTrack ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-amber-50 border-amber-200 text-amber-700')}>
            {estimatedGrad}
          </Badge>
        </div>

        <Separator />

        {/* Requirements checklist — show ALL, no truncation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Requirements</span>
            <span className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{requirementSummary.met}</span>/{requirementSummary.total} met
            </span>
          </div>

          <div className="space-y-3">
            {groups.map((group) => {
              const completed = group.requirements.filter((r) => r.status === 'completed').length;
              const inProg = group.requirements.filter((r) => r.status === 'in_progress').length;
              const total = group.requirements.length;
              const allDone = completed === total;
              const colorClass = CATEGORY_COLORS[group.category] || 'text-slate-600';

              return (
                <div key={group.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn('text-[11px] font-semibold', colorClass)}>
                      {CATEGORY_LABELS[group.category] || group.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {allDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : inProg > 0 ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className="text-[10px] text-slate-500 font-medium">{completed}/{total}</span>
                    </div>
                  </div>

                  {/* ALL requirements — no truncation */}
                  <div className="space-y-0.5 pl-1">
                    {group.requirements.map((req) => {
                      // Build display: show course code if fulfilled, otherwise show short name
                      const fulfilledCourse = req.fulfilledBy;
                      const courseCode = fulfilledCourse ? fulfilledCourse.courseCode : null;
                      // Short name: strip "CGSC 375 - " prefix if present
                      const shortName = req.name.replace(/^[A-Z]+\s\d+\w*\s[-–]\s/, '');

                      return (
                        <div key={req.id} className="flex items-start gap-1.5">
                          {req.status === 'completed' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                          ) : req.status === 'in_progress' ? (
                            <Clock className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-3 w-3 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span
                              className={cn('text-[10px] leading-tight block', {
                                'text-emerald-700 line-through decoration-emerald-300': req.status === 'completed',
                                'text-amber-700': req.status === 'in_progress',
                                'text-slate-500': req.status === 'not_started',
                              })}
                            >
                              {shortName}
                            </span>
                            {/* Show course code + title when fulfilled */}
                            {courseCode && (
                              <span className={cn('text-[9px] leading-tight block', {
                                'text-emerald-500': req.status === 'completed',
                                'text-amber-500': req.status === 'in_progress',
                              })}>
                                {courseCode}
                                {fulfilledCourse && 'title' in fulfilledCourse && fulfilledCourse.title
                                  ? ` — ${fulfilledCourse.title}`
                                  : ''}
                                {fulfilledCourse && fulfilledCourse.status === 'planned' && ' (planned)'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
