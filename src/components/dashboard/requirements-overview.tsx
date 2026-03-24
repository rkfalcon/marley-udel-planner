'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRequirements } from '@/hooks/use-requirements';
import { RequirementItem } from '@/components/requirements/requirement-item';
import { RequirementCategory as RequirementCategoryType } from '@/lib/types';
import type { RequirementGroup } from '@/lib/types';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

const CATEGORY_META: Record<
  RequirementCategoryType,
  { label: string; shortLabel: string; icon: string }
> = {
  university: { label: 'University Requirements', shortLabel: 'University', icon: '🎓' },
  college: { label: 'College of Arts & Sciences', shortLabel: 'College', icon: '🏛️' },
  major_core: { label: 'Major Core (CGSC)', shortLabel: 'Major Core', icon: '🧠' },
  ppslp: { label: 'Pre-Professional SLP', shortLabel: 'PPSLP', icon: '🗣️' },
  elective: { label: 'Electives', shortLabel: 'Electives', icon: '📚' },
};

interface CategoryCardProps {
  category: RequirementCategoryType;
  completedCount: number;
  totalCount: number;
  completedCredits: number;
  totalCredits: number;
  onClick: () => void;
}

function CategoryCard({
  category,
  completedCount,
  totalCount,
  completedCredits,
  totalCredits,
  onClick,
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
    <Card
      className={cn(
        'group transition-all border-slate-100',
        'cursor-pointer hover:shadow-md hover:border-slate-200 hover:scale-[1.01]',
        'active:scale-[0.99]'
      )}
      onClick={onClick}
    >
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
        <div className="space-y-1.5">
          <div className="relative flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isComplete ? 'bg-green-500' : isStarted ? 'bg-amber-400' : 'bg-slate-300'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
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

function CategoryDetailDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: RequirementGroup | null;
}) {
  if (!group) return null;

  const meta = CATEGORY_META[group.category];
  const completedCount = group.requirements.filter(r => r.status === 'completed').length;
  const inProgressCount = group.requirements.filter(r => r.status === 'in_progress').length;
  const notStartedCount = group.requirements.filter(r => r.status === 'not_started').length;
  const percent = group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0;

  const isComplete = group.completedCount === group.totalCount && group.totalCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <div className={cn(
          'px-6 pt-6 pb-4 border-b',
          isComplete ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-800">
              <span className="text-xl">{meta.icon}</span>
              {meta.label}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-1">{group.description}</p>

          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="relative flex h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {completedCount} done
                  </span>
                )}
                {inProgressCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-500" />
                    {inProgressCount} in progress
                  </span>
                )}
                {notStartedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Circle className="h-3 w-3 text-slate-400" />
                    {notStartedCount} remaining
                  </span>
                )}
              </div>
              <span className="font-medium">
                {group.completedCredits} / {group.totalCredits} cr
              </span>
            </div>
          </div>
        </div>

        {/* Requirements list */}
        <ScrollArea className="max-h-[60vh]">
          <div className="px-4 py-3 divide-y divide-border/50">
            {group.requirements.map((req) => (
              <RequirementItem key={req.id} requirement={req} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function RequirementsOverview() {
  const { groups, totalCompleted, totalRequirements } = useRequirements();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<RequirementGroup | null>(null);

  const overallPercent =
    totalRequirements > 0 ? Math.round((totalCompleted / totalRequirements) * 100) : 0;

  const openDialog = (group: RequirementGroup) => {
    setActiveGroup(group);
    setDialogOpen(true);
  };

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
            onClick={() => openDialog(group)}
          />
        ))}
      </div>

      {/* Detail dialog */}
      <CategoryDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={activeGroup}
      />
    </div>
  );
}
