'use client';

import type { ReactNode } from 'react';
import { useCatalog } from '@/components/catalog/catalog-provider';
import { courseLink, type LinkedCourse } from '@/lib/course-links';

export function CourseCatalogLink({ course, children, className = '' }: {
  course: LinkedCourse;
  children?: ReactNode;
  className?: string;
}) {
  const { courses, source } = useCatalog();
  const link = courseLink(course, courses, source?.courses);
  return <a href={link.href} target="_blank" rel="noopener noreferrer"
    title={`${link.direct ? 'Open course page' : 'Look up in catalog (no individual course page available)'} — opens in a new tab`}
    className={`underline decoration-current/40 underline-offset-2 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}>
    {children ?? course.courseCode}
  </a>;
}
