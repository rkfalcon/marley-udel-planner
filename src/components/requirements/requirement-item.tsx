'use client';

import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RequirementWithStatus } from '@/lib/types';

interface RequirementItemProps {
  requirement: RequirementWithStatus;
}

export function RequirementItem({ requirement }: RequirementItemProps) {
  const { status, name, description, fulfilledBy, courseOptions } = requirement;

  const statusIcon = {
    completed: (
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" aria-label="Completed" />
    ),
    in_progress: (
      <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" aria-label="In progress" />
    ),
    not_started: (
      <Circle className="mt-0.5 size-4 shrink-0 text-slate-400" aria-label="Not started" />
    ),
  }[status];

  return (
    <div
      className={cn(
        'flex gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
        status === 'completed' && 'bg-green-50/60 dark:bg-green-950/20',
        status === 'in_progress' && 'bg-amber-50/60 dark:bg-amber-950/20',
        status === 'not_started' && 'bg-transparent'
      )}
    >
      {statusIcon}

      <div className="min-w-0 flex-1 space-y-1">
        {/* Name row */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              'font-medium leading-snug',
              status === 'completed' && 'text-green-900 dark:text-green-100',
              status === 'in_progress' && 'text-amber-900 dark:text-amber-100',
              status === 'not_started' && 'text-foreground'
            )}
          >
            {name}
          </span>
          <span className="text-xs text-muted-foreground">
            {requirement.creditsRequired} cr
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}

        {/* Fulfillment info */}
        {(status === 'completed' || status === 'in_progress') && fulfilledBy ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                status === 'completed' &&
                  'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200',
                status === 'in_progress' &&
                  'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
              )}
            >
              {fulfilledBy.courseCode}
            </Badge>
            <span className="text-xs text-muted-foreground">{fulfilledBy.title}</span>
            {'grade' in fulfilledBy && fulfilledBy.grade && (
              <span
                className={cn(
                  'text-xs font-semibold',
                  status === 'completed' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                )}
              >
                {fulfilledBy.grade}
              </span>
            )}
            {status === 'in_progress' && (
              <span className="text-xs italic text-muted-foreground">In progress</span>
            )}
          </div>
        ) : (
          status === 'not_started' &&
          courseOptions &&
          courseOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {courseOptions.slice(0, 6).map((code) => (
                <Badge key={code} variant="outline" className="text-xs text-muted-foreground">
                  {code}
                </Badge>
              ))}
              {courseOptions.length > 6 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{courseOptions.length - 6} more
                </Badge>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
