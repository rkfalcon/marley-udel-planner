'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CourseStatus, School } from '@/lib/types';

interface CourseChipProps {
  courseCode: string;
  title: string;
  credits: number;
  status: CourseStatus;
  school: School;
  grade?: string;
  onRemove?: () => void;
}

export function CourseChip({
  courseCode,
  title,
  credits,
  status,
  school,
  grade,
  onRemove,
}: CourseChipProps) {
  const isRemovable = onRemove && status === 'planned';

  const containerClasses = cn(
    'group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-all duration-150',
    {
      // Completed - green
      'bg-emerald-50 border-emerald-200 text-emerald-800':
        status === 'completed' && school === 'udel',
      // Transfer (completed brookdale) - teal/cyan
      'bg-cyan-50 border-cyan-200 text-cyan-800':
        status === 'completed' && school === 'brookdale',
      // In progress - amber
      'bg-amber-50 border-amber-200 text-amber-800': status === 'in_progress',
      // Planned - blue
      'bg-blue-50 border-blue-200 text-blue-800':
        status === 'planned' && school === 'udel',
      // Planned brookdale - cyan
      'bg-cyan-50 border-cyan-200 text-cyan-800':
        status === 'planned' && school === 'brookdale',
      // Transfer status
      'bg-teal-50 border-teal-200 text-teal-800': status === 'transfer',
      // Hover effect for removable
      'hover:shadow-sm': isRemovable,
      'pr-1.5': isRemovable,
    }
  );

  const creditsBadgeClasses = cn(
    'ml-0.5 h-4 min-w-4 rounded px-1 text-[10px] font-semibold leading-4',
    {
      'bg-emerald-200 text-emerald-700':
        status === 'completed' && school === 'udel',
      'bg-cyan-200 text-cyan-700':
        (status === 'completed' && school === 'brookdale') ||
        (status === 'planned' && school === 'brookdale'),
      'bg-amber-200 text-amber-700': status === 'in_progress',
      'bg-blue-200 text-blue-700':
        status === 'planned' && school === 'udel',
      'bg-teal-200 text-teal-700': status === 'transfer',
    }
  );

  return (
    <div className={containerClasses} title={title}>
      <span className="truncate max-w-[120px] leading-none">{courseCode}</span>

      <span className={creditsBadgeClasses}>{credits}cr</span>

      {grade && (
        <span
          className={cn(
            'ml-0.5 h-4 rounded px-1 text-[10px] font-bold leading-4 shrink-0',
            {
              'bg-emerald-200 text-emerald-700':
                status === 'completed' && school === 'udel',
              'bg-cyan-200 text-cyan-700':
                status === 'completed' && school === 'brookdale',
              'bg-teal-200 text-teal-700': status === 'transfer',
            }
          )}
        >
          {grade}
        </span>
      )}

      {isRemovable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'ml-0.5 shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-blue-200 text-blue-600 hover:text-blue-800',
            school === 'brookdale' &&
              'hover:bg-cyan-200 text-cyan-600 hover:text-cyan-800'
          )}
          aria-label={`Remove ${courseCode}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
