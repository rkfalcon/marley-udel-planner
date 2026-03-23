'use client';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { RequirementGroup } from '@/lib/types';
import { RequirementItem } from './requirement-item';

interface RequirementCategoryProps {
  group: RequirementGroup;
}

export function RequirementCategory({ group }: RequirementCategoryProps) {
  const { label, description, requirements, completedCount, totalCount } = group;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const inProgressCount = requirements.filter((r) => r.status === 'in_progress').length;

  return (
    <Accordion className="rounded-lg border bg-card shadow-sm">
      <AccordionItem value={group.category} className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex min-w-0 flex-1 flex-col gap-2 pr-2">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="text-base font-semibold leading-tight">{label}</span>
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  completedCount === totalCount
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                )}
              >
                {completedCount}/{totalCount} requirements met
                {inProgressCount > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-amber-500">
                    ({inProgressCount} in progress)
                  </span>
                )}
              </span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-left text-xs text-muted-foreground">{description}</p>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    completedCount === totalCount ? 'bg-green-600' : 'bg-primary'
                  )}
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${progressPercent}% complete`}
                />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                {progressPercent}%
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-2 pb-3">
          <div className="divide-y divide-border/50">
            {requirements.map((req) => (
              <RequirementItem key={req.id} requirement={req} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
