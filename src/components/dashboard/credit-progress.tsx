'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  getCreditsCompleted,
  getCreditsInProgress,
  getCreditsRemaining,
  MARLEY_PROFILE,
} from '@/lib/data/marley-progress';

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

interface StatCardProps {
  label: string;
  value: number;
  colorClass: string;
  dotClass: string;
  sublabel?: string;
}

function StatCard({ label, value, colorClass, dotClass, sublabel }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl px-4 py-4 gap-1',
        'bg-white border border-slate-100 shadow-sm'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2.5 h-2.5 rounded-full', dotClass)} />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className={cn('text-3xl font-bold tabular-nums', colorClass)}>{value}</span>
      <span className="text-xs text-slate-400">{sublabel ?? 'credits'}</span>
    </div>
  );
}

export function CreditProgress() {
  const [animated, setAnimated] = useState(false);

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
          {/* In-progress arc (behind completed) */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <StatCard
          label="Completed"
          value={completed}
          colorClass="text-green-600"
          dotClass="bg-green-500"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          colorClass="text-amber-500"
          dotClass="bg-amber-400"
        />
        <StatCard
          label="Remaining"
          value={remaining}
          colorClass="text-slate-500"
          dotClass="bg-slate-300"
        />
      </div>
    </div>
  );
}
