'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RequirementCategory } from '@/components/requirements/requirement-category';
import { useRequirements } from '@/hooks/use-requirements';
import { cn } from '@/lib/utils';
import type { RequirementGroup } from '@/lib/types';

export default function RequirementsPage() {
  const { groups, totalCompleted, totalInProgress, totalRequirements } = useRequirements();

  const totalCreditsEarned = useMemo(
    () => groups.reduce((sum, g) => sum + g.completedCredits, 0),
    [groups]
  );

  const totalCredits = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalCredits, 0),
    [groups]
  );

  const overallProgressPercent =
    totalRequirements > 0 ? Math.round((totalCompleted / totalRequirements) * 100) : 0;

  const filteredGroups = (filter: string): RequirementGroup[] => {
    if (filter === 'completed') {
      return groups
        .map((g) => ({
          ...g,
          requirements: g.requirements.filter((r) => r.status === 'completed'),
        }))
        .filter((g) => g.requirements.length > 0);
    }
    if (filter === 'remaining') {
      return groups
        .map((g) => ({
          ...g,
          requirements: g.requirements.filter((r) => r.status !== 'completed'),
          completedCount: 0,
        }))
        .filter((g) => g.requirements.length > 0);
    }
    return groups;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Degree Requirements</h1>
        <p className="text-sm text-muted-foreground">
          Cognitive Science BS &mdash; PPSLP Specialization
        </p>
      </div>

      {/* Overall progress summary */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
            <p className="text-3xl font-bold tabular-nums">
              {totalCompleted}
              <span className="text-lg font-normal text-muted-foreground">
                /{totalRequirements}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">requirements complete</p>
          </div>

          <div className="space-y-0.5 text-right">
            <p className="text-sm font-medium text-muted-foreground">Credits Earned</p>
            <p className="text-3xl font-bold tabular-nums">
              {totalCreditsEarned}
              <span className="text-lg font-normal text-muted-foreground">
                /{totalCredits}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">credits toward degree</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="relative flex h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                overallProgressPercent === 100 ? 'bg-green-600' : 'bg-primary'
              )}
              style={{ width: `${overallProgressPercent}%` }}
              role="progressbar"
              aria-valuenow={overallProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${overallProgressPercent}% of requirements complete`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {overallProgressPercent}% complete
              {totalInProgress > 0 && (
                <span className="ml-2 text-amber-500">{totalInProgress} in progress</span>
              )}
            </span>
            <span>{totalRequirements - totalCompleted} remaining</span>
          </div>
        </div>
      </div>

      {/* Filter tabs + requirement list */}
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              {totalRequirements}
            </span>
          </TabsTrigger>
          <TabsTrigger value="remaining">
            Remaining
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              {totalRequirements - totalCompleted}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              {totalCompleted}
            </span>
          </TabsTrigger>
        </TabsList>

        {(['all', 'remaining', 'completed'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="space-y-3">
              {filteredGroups(tab).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {tab === 'completed'
                    ? 'No requirements completed yet.'
                    : 'All requirements are complete!'}
                </p>
              ) : (
                filteredGroups(tab).map((group) => (
                  <RequirementCategory key={group.category} group={group} />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
