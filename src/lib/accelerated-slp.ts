import { evaluateRequirements } from './requirement-evaluation';
import type { Plan, Term } from './types';

export const ACCELERATED_SLP_URL = 'https://www.udel.edu/academics/colleges/cas/units/departments/linguistics-cognitive-science/undergraduate-programs/accelerated-program/';
export const SLP_ADMISSIONS_URL = 'https://www.udel.edu/academics/colleges/chs/departments/cscd/graduate-programs/masters-program/';
export interface AcceleratedSlpSettings {
  entryYear: number;
  overallGpa?: number;
  majorGpa?: number;
  advisorReviewed?: boolean;
  prerequisitesReviewed?: boolean;
  observationReviewed?: boolean;
  applicationSubmitted?: boolean;
}
function position(term: Term, year: number) {
  return (year + (term === 'Winter' ? 1 : 0)) * 12 + ({Winter:1, Spring:3, Summer:6, Fall:9}[term]);
}
export function evaluateAcceleratedSlp(plan: Plan) {
  const settings = plan.acceleratedSlp;
  const entryYear = settings?.entryYear ?? 2025;
  const juniorYear = entryYear + 3;
  const deadline = position('Spring', juniorYear);
  const before = plan.semesters.filter(s => position(s.term,s.year) <= deadline).flatMap(s => s.courses);
  const lateCourses = plan.semesters.filter(s => position(s.term,s.year) > deadline).flatMap(s => s.courses.map(c => ({...c, semester: `${s.term} ${s.year}`})));
  const earned = before.filter(c => c.status === 'completed' || c.status === 'transfer').reduce((n,c)=>n+c.credits,0);
  const projected = before.reduce((n,c)=>n+c.credits,0);
  const evaluated = evaluateRequirements([], before);
  const major = evaluated.requirementsWithStatus.filter(r => r.category === 'major_core' || r.category === 'ppslp');
  const gpas = [settings?.overallGpa,settings?.majorGpa];
  const valid = gpas.every(g => typeof g === 'number' && Number.isFinite(g) && g >= 0 && g <= 4);
  const gpaStatus = !valid ? 'unknown' : gpas.every(g => g! >= 3.6) ? 'meets' : 'below';
  return {entryYear,juniorYear,earned,projected,remaining:Math.max(0,109-projected),major,lateCourses,gpaStatus};
}

/** Keep all graduate-year terms available, including winter after the final fall. */
export function acceleratedSlpTerms(entryYear: number) {
  const terms: { term: Term; year: number; school: 'udel' }[] = [];
  for (let year = entryYear + 3; year <= entryYear + 5; year++) {
    for (const term of ['Spring', 'Summer', 'Fall', 'Winter'] as const) {
      if (year === entryYear + 3 && term === 'Spring') continue;
      terms.push({ term, year, school: 'udel' });
    }
  }
  return terms;
}

export function extendAcceleratedSlpPlan(plan: Plan): Plan {
  if (!plan.acceleratedSlp) return plan;
  const semesters = [...plan.semesters];
  for (const term of acceleratedSlpTerms(plan.acceleratedSlp.entryYear)) {
    if (semesters.some(s => s.term === term.term && s.year === term.year && s.school === term.school)) continue;
    semesters.push({
      ...term,
      id: `slp-semester-${term.term}-${term.year}-udel`,
      planId: plan.id,
      sortOrder: semesters.length,
      courses: [],
    });
  }
  return { ...plan, semesters };
}
