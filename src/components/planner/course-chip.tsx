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
  const isPlaceholder = courseCode.startsWith('ELEC');
  const displayCode = isPlaceholder ? 'ELECTIVE' : courseCode;

  const containerClasses = cn(
    'group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-all duration-150',
    isPlaceholder && 'bg-orange-50 border-orange-300 text-orange-800 border-dashed',
    !isPlaceholder && status === 'completed' && school === 'udel' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
    !isPlaceholder && (status === 'completed' && school === 'brookdale') && 'bg-cyan-50 border-cyan-200 text-cyan-800',
    !isPlaceholder && status === 'in_progress' && 'bg-amber-50 border-amber-200 text-amber-800',
    !isPlaceholder && status === 'planned' && school === 'udel' && 'bg-blue-50 border-blue-200 text-blue-800',
    !isPlaceholder && status === 'planned' && school === 'brookdale' && 'bg-sky-50 border-sky-200 text-sky-800',
    !isPlaceholder && status === 'transfer' && 'bg-teal-50 border-teal-200 text-teal-800',
    isRemovable && 'hover:shadow-sm pr-1.5'
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
