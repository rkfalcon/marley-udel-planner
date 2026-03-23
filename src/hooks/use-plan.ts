'use client';

import { useState, useCallback } from 'react';
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

  const savePlan = useCallback(async (pin?: string) => {
    if (!plan) return;
    if (!isSupabaseConfigured()) {
      // Save to localStorage as fallback
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      plans[plan.slug] = { ...plan, pin };
      localStorage.setItem('udel-plans', JSON.stringify(plans));
      return plan.slug;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, pin }),
      });
      if (!response.ok) throw new Error('Failed to save plan');
      const data = await response.json();
      return data.slug;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      // Fallback to localStorage
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      plans[plan.slug] = { ...plan, pin };
      localStorage.setItem('udel-plans', JSON.stringify(plans));
      return plan.slug;
    } finally {
      setLoading(false);
    }
  }, [plan]);

  const loadPlan = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        try {
        const { data, error: sbError } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!sbError && data) {
          // Load semesters and courses
          const { data: semesters } = await supabase
            .from('plan_semesters')
            .select('*, plan_courses(*)')
            .eq('plan_id', data.id)
            .order('sort_order');

          const loadedPlan: Plan = {
            id: data.id,
            name: data.name,
            description: data.description,
            slug: data.slug,
            targetGraduation: data.target_graduation,
            isEarlyGraduation: data.is_early_graduation,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            semesters: (semesters || []).map((s: Record<string, unknown>) => ({
              id: s.id as string,
              planId: s.plan_id as string,
              term: s.term as Term,
              year: s.year as number,
              school: s.school as School,
              sortOrder: s.sort_order as number,
              courses: ((s.plan_courses as Record<string, unknown>[]) || []).map((c: Record<string, unknown>) => ({
                id: c.id as string,
                planSemesterId: c.plan_semester_id as string,
                courseCode: c.course_code as string,
                title: c.title as string || '',
                school: c.school as School,
                credits: c.credits as number,
                status: c.status as CourseStatus,
                grade: c.grade as string | undefined,
                notes: c.notes as string | undefined,
              })),
            })),
          };
          setPlan(loadedPlan);
          return loadedPlan;
        }
        } catch {
          // Supabase tables may not exist yet, fall through to localStorage
        }
      }

      // Fallback to localStorage
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      if (plans[slug]) {
        setPlan(plans[slug]);
        return plans[slug];
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
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('plans')
          .select('id, name, slug, target_graduation, is_early_graduation, created_at, updated_at')
          .order('updated_at', { ascending: false });
        return (data || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          name: d.name as string,
          slug: d.slug as string,
          targetGraduation: d.target_graduation as string,
          isEarlyGraduation: d.is_early_graduation as boolean,
          createdAt: d.created_at as string,
          updatedAt: d.updated_at as string,
        }));
      }

      // localStorage fallback
      const plans = JSON.parse(localStorage.getItem('udel-plans') || '{}');
      return Object.values(plans).map((p: unknown) => {
        const plan = p as Plan;
        return {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          targetGraduation: plan.targetGraduation,
          isEarlyGraduation: plan.isEarlyGraduation,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
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
