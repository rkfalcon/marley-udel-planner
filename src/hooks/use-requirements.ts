'use client';
import { useMemo } from 'react';
import { useAcademicRecord } from '@/components/academic/academic-record-provider';
import { evaluateRequirements } from '@/lib/requirement-evaluation';
import type { PlanCourse } from '@/lib/types';
const EMPTY: PlanCourse[] = [];
export function useRequirements(plannedCourses: PlanCourse[] = EMPTY) {
  const { courses } = useAcademicRecord();
  return useMemo(() => evaluateRequirements(courses, plannedCourses.filter(c => !c.academicCourseId)), [courses, plannedCourses]);
}
