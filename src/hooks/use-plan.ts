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

  const transferCourses: PlanCourse[] = COMPLETED_COURSES
    .filter(c => c.status === 'transfer')
    .map(c => ({
      id: generateId(),
      planSemesterId: '',
      courseCode: c.courseCode,
      title: c.title,
      school: 'brookdale',
      credits: c.credits,
      status: 'completed',
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

  const fall25Id = generateId();
  const transferId = generateId();
  const spring26Id = generateId();

  return [
    {
      id: fall25Id,
      planId: '',
      term: 'Fall',
      year: 2025,
      school: 'udel',
      sortOrder: 0,
      courses: fall25Courses.map(c => ({ ...c, planSemesterId: fall25Id })),
    },
    {
      id: transferId,
      planId: '',
      term: 'Fall',
      year: 2025,
      school: 'brookdale',
      sortOrder: 1,
      courses: transferCourses.map(c => ({ ...c, planSemesterId: transferId })),
    },
    {
      id: spring26Id,
      planId: '',
      term: 'Spring',
      year: 2026,
      school: 'udel',
      sortOrder: 2,
      courses: spring26Courses.map(c => ({ ...c, planSemesterId: spring26Id })),
    },
  ];
}

function createFutureSemesters(targetGrad: string): PlanSemester[] {
  const semesters: PlanSemester[] = [];
  const terms: { term: Term; year: number }[] = [];

  const [targetTerm, targetYearStr] = targetGrad.split(' ');
  const targetYear = parseInt(targetYearStr);

  const startTerms: Term[] = ['Summer', 'Fall'];
  const fullTerms: Term[] = ['Winter', 'Spring', 'Summer', 'Fall'];

  for (const term of startTerms) {
    terms.push({ term, year: 2026 });
  }

  for (let y = 2027; y <= targetYear; y++) {
    for (const term of fullTerms) {
      if (y === targetYear) {
        const targetTermOrder = SEMESTER_ORDER[targetTerm as Term];
        if (SEMESTER_ORDER[term] > targetTermOrder) break;
      }
      terms.push({ term, year: y });
    }
  }

  let sortOrder = 3;
  for (const { term, year } of terms) {
    const school = (term === 'Summer' || term === 'Winter') ? 'brookdale' : 'udel';
    semesters.push({
      id: generateId(),
      planId: '',
      term,
      year,
      school: school as School,
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
