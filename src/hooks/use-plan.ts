'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plan, PlanSemester, PlanCourse, Term, School, CourseStatus } from '@/lib/types';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';

function generateId() {
  return crypto.randomUUID();
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
}

const SEMESTER_ORDER: Record<Term, number> = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Fall: 3,
};

function sortSemesters(semesters: PlanSemester[]): PlanSemester[] {
  return [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return SEMESTER_ORDER[a.term] - SEMESTER_ORDER[b.term];
  });
}

function createPastSemesters(): PlanSemester[] {
  const fall25Courses: PlanCourse[] = COMPLETED_COURSES
    .filter(c => c.term === 'Fall' && c.year === 2025 && c.school === 'udel')
    .map(c => ({
      id: generateId(),
      planSemesterId: '',
      courseCode: c.courseCode,
      title: c.title,
      school: c.school,
      credits: c.credits,
      status: c.status,
      grade: c.grade,
    }));

  // Prior transfer credits (taken before starting UDel — tagged as Summer 2024)
  const priorTransferCourses: PlanCourse[] = COMPLETED_COURSES
    .filter(c => c.status === 'transfer' && c.term === 'Summer' && c.year === 2024)
    .map(c => ({
      id: generateId(),
      planSemesterId: '',
      courseCode: c.courseCode,
      title: c.title,
      school: 'brookdale' as School,
      credits: c.credits,
      status: 'completed' as CourseStatus,
      grade: c.grade,
    }));

  // Winter 2025 Brookdale courses (HIST 105 taken at Brookdale)
  const winter25BrookdaleCourses: PlanCourse[] = COMPLETED_COURSES
    .filter(c => c.status === 'transfer' && c.term === 'Winter' && c.year === 2025 && c.school === 'brookdale')
    .map(c => ({
      id: generateId(),
      planSemesterId: '',
      courseCode: c.courseCode,
      title: c.title,
      school: 'brookdale' as School,
      credits: c.credits,
      status: 'completed' as CourseStatus,
      grade: c.grade,
    }));

  const spring26Courses: PlanCourse[] = COMPLETED_COURSES
    .filter(c => c.term === 'Spring' && c.year === 2026)
    .map(c => ({
      id: generateId(),
      planSemesterId: '',
      courseCode: c.courseCode,
      title: c.title,
      school: c.school,
      credits: c.credits,
      status: c.status,
      grade: c.grade,
    }));

  const priorId = generateId();
  const fall25Id = generateId();
  const winter25BrookdaleId = generateId();
  const spring26Id = generateId();

  return [
    // Prior transfer credits from Brookdale (Summer 2024 → Academic Year 2024-2025)
    {
      id: priorId,
      planId: '',
      term: 'Summer' as Term,
      year: 2024,
      school: 'brookdale' as School,
      sortOrder: 0,
      courses: priorTransferCourses.map(c => ({ ...c, planSemesterId: priorId })),
    },
    // Fall 2025 at UDel (Academic Year 2025-2026)
    {
      id: fall25Id,
      planId: '',
      term: 'Fall' as Term,
      year: 2025,
      school: 'udel' as School,
      sortOrder: 1,
      courses: fall25Courses.map(c => ({ ...c, planSemesterId: fall25Id })),
    },
    // Winter 2025 at Brookdale — winter break of Fall 2025 (Academic Year 2025-2026)
    ...(winter25BrookdaleCourses.length > 0 ? [{
      id: winter25BrookdaleId,
      planId: '',
      term: 'Winter' as Term,
      year: 2025,
      school: 'brookdale' as School,
      sortOrder: 2,
      courses: winter25BrookdaleCourses.map(c => ({ ...c, planSemesterId: winter25BrookdaleId })),
    }] : []),
    // Spring 2026 at UDel (Academic Year 2025-2026)
    {
      id: spring26Id,
      planId: '',
      term: 'Spring' as Term,
      year: 2026,
      school: 'udel' as School,
      sortOrder: 3,
      courses: spring26Courses.map(c => ({ ...c, planSemesterId: spring26Id })),
    },
  ];
}

function createFutureSemesters(targetGrad: string): PlanSemester[] {
  const semesters: PlanSemester[] = [];

  const [targetTerm, targetYearStr] = targetGrad.split(' ');
  const targetYear = parseInt(targetYearStr);

  // Convention: Winter uses the SAME year as its preceding Fall
  // Academic Year 2025-2026: Fall 2025, Winter 2025, Spring 2026, Summer 2026
  // Academic Year 2026-2027: Fall 2026, Winter 2026, Spring 2027, Summer 2027
  // Academic Year 2027-2028: Fall 2027, Winter 2027, Spring 2028, Summer 2028

  const allTerms: { term: Term; year: number }[] = [];

  // Summer 2026 (Brookdale) — completes academic year 2025-2026
  allTerms.push({ term: 'Summer', year: 2026 });

  // Full academic years: 2026-2027, 2027-2028, etc.
  for (let fallYear = 2026; fallYear <= targetYear; fallYear++) {
    allTerms.push({ term: 'Fall', year: fallYear });           // Fall N (UDel)
    allTerms.push({ term: 'Winter', year: fallYear });         // Winter N (Brookdale) — winter break after Fall N
    allTerms.push({ term: 'Spring', year: fallYear + 1 });     // Spring N+1 (UDel)
    allTerms.push({ term: 'Summer', year: fallYear + 1 });     // Summer N+1 (Brookdale)
  }

  // Filter: keep semesters up to target graduation
  // For filtering, convert to a comparable number using calendar position
  function calendarPosition(term: Term, year: number): number {
    // Map to actual calendar month order for comparison
    const monthMap: Record<Term, number> = { Winter: 1, Spring: 3, Summer: 6, Fall: 9 };
    // Winter N actually happens in January of N+1 (but we label it N)
    const calYear = term === 'Winter' ? year + 1 : year;
    return calYear * 12 + monthMap[term];
  }

  const targetPos = calendarPosition(targetTerm as Term, targetYear);
  const filtered = allTerms.filter(({ term, year }) => {
    return calendarPosition(term, year) <= targetPos;
  });

  let sortOrder = 4;
  for (const { term, year } of filtered) {
    const school: School = (term === 'Summer' || term === 'Winter') ? 'brookdale' : 'udel';
    semesters.push({
      id: generateId(),
      planId: '',
      term,
      year,
      school,
      sortOrder: sortOrder++,
      courses: [],
    });
  }

  return semesters;
}

export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always-current ref to avoid stale closure in savePlan
  const planRef = useRef<Plan | null>(null);
  useEffect(() => { planRef.current = plan; }, [plan]);

  const createPlan = useCallback((name: string, targetGraduation: string, isEarly: boolean = false) => {
    const planId = generateId();
    const pastSemesters = createPastSemesters().map(s => ({ ...s, planId }));
    const futureSemesters = createFutureSemesters(targetGraduation).map(s => ({ ...s, planId }));

    const newPlan: Plan = {
      id: planId,
      name,
      slug: generateSlug(name),
      targetGraduation,
      isEarlyGraduation: isEarly,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semesters: sortSemesters([...pastSemesters, ...futureSemesters]),
    };

    setPlan(newPlan);
    return newPlan;
  }, []);

  const addCourse = useCallback((semesterId: string, course: Omit<PlanCourse, 'id' | 'planSemesterId'>) => {
    setPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        semesters: prev.semesters.map(s => {
          if (s.id !== semesterId) return s;
          return {
            ...s,
            courses: [...s.courses, { ...course, id: generateId(), planSemesterId: semesterId }],
          };
        }),
      };
    });
  }, []);

  const removeCourse = useCallback((semesterId: string, courseId: string) => {
    setPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        semesters: prev.semesters.map(s => {
          if (s.id !== semesterId) return s;
          return {
            ...s,
            courses: s.courses.filter(c => c.id !== courseId),
          };
        }),
      };
    });
  }, []);

  const savePlan = useCallback(async (pin?: string, options?: { action?: 'create' | 'update' | 'save_as_new' }) => {
    const currentPlan = planRef.current;
    if (!currentPlan) return null;

    const action = options?.action || 'create';

    const response = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: currentPlan, pin, action }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'WRONG_PIN') {
        throw new Error('WRONG_PIN');
      }
      throw new Error(data.error || 'Failed to save plan');
    }

    return data.slug as string;
  }, []);

  const loadPlan = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/plans?slug=${encodeURIComponent(slug)}`);

      if (!response.ok) {
        throw new Error('Plan not found');
      }

      const data = await response.json();

      // If the plan has full semester data, use it directly
      if (data.semesters && data.semesters.length > 0) {
        setPlan(data as Plan);
        return data as Plan;
      }

      // Legacy plan (no embedded data) — rebuild from template
      if (data._legacy || (data.semesters && data.semesters.length === 0)) {
        const targetGrad = data.targetGraduation || 'Spring 2028';
        const pastSemesters = createPastSemesters().map(s => ({ ...s, planId: data.id }));
        const futureSemesters = createFutureSemesters(targetGrad).map(s => ({ ...s, planId: data.id }));

        const rebuiltPlan: Plan = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          targetGraduation: targetGrad,
          isEarlyGraduation: data.isEarlyGraduation || false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          semesters: sortSemesters([...pastSemesters, ...futureSemesters]),
        };

        setPlan(rebuiltPlan);
        return rebuiltPlan;
      }

      throw new Error('Plan data is incomplete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) return [];
      const data = await response.json();
      return data as Array<{
        id: string;
        name: string;
        slug: string;
        targetGraduation: string;
        isEarlyGraduation: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    } catch {
      return [];
    }
  }, []);

  const getTotalPlannedCredits = useCallback(() => {
    if (!plan) return 0;
    return plan.semesters.reduce((sum, s) =>
      sum + s.courses.reduce((cSum, c) => cSum + c.credits, 0), 0
    );
  }, [plan]);

  return {
    plan,
    setPlan,
    loading,
    error,
    createPlan,
    addCourse,
    removeCourse,
    savePlan,
    loadPlan,
    getAllPlans,
    getTotalPlannedCredits,
  };
}
