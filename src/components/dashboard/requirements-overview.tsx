'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRequirements } from '@/hooks/use-requirements';
import { RequirementCategory } from '@/lib/types';

const CATEGORY_META: Record<
  RequirementCategory,
  { label: string; shortLabel: string; icon: string }
> = {
  university: { label: 'University Requirements', shortLabel: 'University', icon: '🎓' },
  college: { label: 'College of Arts & Sciences', shortLabel: 'College', icon: '🏛️' },
  major_core: { label: 'Major Core (CGSC)', shortLabel: 'Major Core', icon: '🧠' },
  ppslp: { label: 'Pre-Professional SLP', shortLabel: 'PPSLP', icon: '🗣️' },
  elective: { label: 'Electives', shortLabel: 'Electives', icon: '📚' },
};

interface CategoryCardProps {
  category: RequirementCategory;
  completedCount: number;
  totalCount: number;
  completedCredits: number;
  totalCredits: number;
}

function CategoryCard({
  category,
  completedCount,
  totalCount,
  completedCredits,
  totalCredits,
}: CategoryCardProps) {
  const meta = CATEGORY_META[category];
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isComplete = completedCount === totalCount && totalCount > 0;
  const isStarted = completedCount > 0;

  const statusColor = isComplete
    ? 'text-green-600'
    : isStarted
    ? 'text-amber-600'
    : 'text-slate-400';

  const progressColor = isComplete
    ? '[&>div]:bg-green-500'
    : isStarted
    ? '[&>div]:bg-amber-400'
    : '[&>div]:bg-slate-300';

  const badgeVariant = isComplete ? 'default' : isStarted ? 'secondary' : 'outline';

  const badgeClass = isComplete
    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100'
    : isStarted
    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50';

  return (
    <Card className="group transition-shadow hover:shadow-md border-slate-100">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none shrink-0" aria-hidden>
              {meta.icon}
            </span>
            <CardTitle className="text-sm font-semibold text-slate-700 leading-snug">
              {meta.label}
            </CardTitle>
          </div>
          <Badge
            variant={badgeVariant}
            className={cn('shrink-0 text-xs font-medium px-2 py-0.5', badgeClass)}
          >
            {isComplete ? 'Done' : isStarted ? 'In Progress' : 'Not Started'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress
            value={percent}
            className={cn('h-2 bg-slate-100', progressColor)}
          />
          <div className="flex justify-between items-center">
            <span className={cn('text-sm font-semibold tabular-nums', statusColor)}>
              {completedCount}/{totalCount}{' '}
              <span className="font-normal text-slate-400">requirements</span>
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {completedCredits} / {totalCredits} cr
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RequirementsOverview() {
  const { groups, totalCompleted, totalRequirements } = useRequirements();

  const overallPercent =
    totalRequirements > 0 ? Math.round((totalCompleted / totalRequirements) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Overall summary row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700 tabular-nums">{totalCompleted}</span> of{' '}
          <span className="font-semibold text-slate-700 tabular-nums">{totalRequirements}</span>{' '}
          requirements completed
        </p>
        <span className="text-sm font-semibold text-slate-600 tabular-nums">{overallPercent}%</span>
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((group) => (
          <CategoryCard
            key={group.category}
            category={group.category}
            completedCount={group.completedCount}
            totalCount={group.totalCount}
            completedCredits={group.completedCredits}
            totalCredits={group.totalCredits}
          />
        ))}
      </div>
    </div>
  );
}
