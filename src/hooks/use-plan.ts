'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plan, PlanSemester, PlanCourse, Term, School, CourseStatus } from '@/lib/types';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

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

function createFutureSemesters(targetGrad: string, includeBreaks: boolean = true): PlanSemester[] {
  const semesters: PlanSemester[] = [];
  const terms: { term: Term; year: number }[] = [];

  // Parse target graduation (e.g., "Spring 2028")
  const [targetTerm, targetYearStr] = targetGrad.split(' ');
  const targetYear = parseInt(targetYearStr);

  // Generate semesters from Summer 2026 to target
  let year = 2026;
  const startTerms: Term[] = ['Summer', 'Fall'];
  const fullTerms: Term[] = includeBreaks
    ? ['Winter', 'Spring', 'Summer', 'Fall']
    : ['Spring', 'Fall'];

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
      school: school,
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

  const savePlan = useCallback(async (pin?: string, options?: { forceNew?: boolean }) => {
    // Use ref to always get the latest plan state (avoids stale closure)
    const currentPlan = planRef.current;
    if (!currentPlan) return null;

    const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
    const existingPlan = plans[currentPlan.slug];

    // PIN verification for existing plans (not forceNew)
    if (existingPlan && !options?.forceNew) {
      if (existingPlan.pin && pin !== existingPlan.pin) {
        throw new Error('WRONG_PIN');
      }
    }

    // Save to localStorage — preserve original pin for updates, use new pin for new plans
    const pinToStore = options?.forceNew ? pin : (existingPlan?.pin || pin);
    const updatedPlan = { ...currentPlan, updatedAt: new Date().toISOString() };
    plans[currentPlan.slug] = { ...updatedPlan, pin: pinToStore };
    localStorage.setItem('udel-plans', JSON.stringify(plans));

    // Also update the in-memory plan state
    setPlan(updatedPlan);

    return currentPlan.slug;
  }, []);

  const loadPlan = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      // Load from localStorage (primary storage)
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      if (plans[slug]) {
        // Strip the pin before setting state (don't expose it)
        const { pin: _pin, ...planData } = plans[slug];
        setPlan(planData);
        return planData;
      }
      throw new Error('Plan not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllPlans = useCallback(async () => {
    try {
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      return Object.values(plans).map((p: unknown) => {
        const planEntry = p as Plan & { pin?: string };
        return {
          id: planEntry.id,
          name: planEntry.name,
          slug: planEntry.slug,
          targetGraduation: planEntry.targetGraduation,
          isEarlyGraduation: planEntry.isEarlyGraduation,
          createdAt: planEntry.createdAt,
          updatedAt: planEntry.updatedAt,
        };
      });
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
