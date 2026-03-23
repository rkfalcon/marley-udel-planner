'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlan } from '@/hooks/use-plan';
import { CalendarDays, Clock, Plus, GraduationCap, ChevronRight } from 'lucide-react';

interface PlanSummary {
  id: string;
  name: string;
  slug: string;
  targetGraduation: string;
  isEarlyGraduation: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function PlanCard({ plan }: { plan: PlanSummary }) {
  return (
    <Link href={`/plan/${plan.slug}`} className="group block">
      <Card className="h-full transition-all duration-200 border-slate-100 hover:border-blue-200 hover:shadow-md group-hover:-translate-y-0.5">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                {plan.name}
              </CardTitle>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 transition-colors group-hover:text-blue-400" />
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Grad: </span>
            <span className="font-medium">{plan.targetGraduation}</span>
            {plan.isEarlyGraduation && (
              <Badge className="ml-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-1.5 py-0">
                Early
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Updated {formatRelativeDate(plan.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreateNewPlanCard() {
  return (
    <Link href="/plan/new" className="group block">
      <Card className="h-full border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm group-hover:-translate-y-0.5">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[140px] gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center transition-colors group-hover:border-blue-300 group-hover:bg-blue-50">
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
              Create New Plan
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Map out your path to graduation
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PlanCardSkeleton() {
  return (
    <Card className="h-full border-slate-100 animate-pulse">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2.5">
        <div className="h-3.5 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </CardContent>
    </Card>
  );
}

export function PlansList() {
  const { getAllPlans } = usePlan();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllPlans().then((result) => {
      if (!cancelled) {
        setPlans(result as PlanSummary[]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getAllPlans]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
        <CreateNewPlanCard />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <CreateNewPlanCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
      <CreateNewPlanCard />
    </div>
  );
}
