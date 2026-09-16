import type { Plan, PlanCourse } from './types';
import { evaluateRequirements } from './requirement-evaluation';
export interface CompleteSlpPathway {
  type: '3+2-slp';
  sourceSlug: string;
  catalogYear: string;
  bsAward: string;
  maAward: string;
  sharedApproval: boolean;
  graduateRequirements: {code:string; credits:number; occurrences:number}[];
  notes: string[];
  clinicalConfirmations?: Partial<Record<'observation' | 'firstYearClinic' | 'directHours' | 'competencies' | 'project' | 'graduateStanding', boolean>>;
  profileSnapshot?: Record<string, string | number>;
}
export function clonePathway(source: Plan, id: string, slug: string): Plan {
  const copy = structuredClone(source);
  return {...copy,id,slug,semesters:copy.semesters.map((s,i)=>{
    const semesterId=`${id}-s${i}`;
    return {...s,id:semesterId,planId:id,courses:s.courses.map((c,j)=>({...c,id:`${semesterId}-c${j}`,planSemesterId:semesterId}))};
  })};
}
const earned = (c:PlanCourse) => c.status==='completed'||c.status==='transfer';
const total = (cs:PlanCourse[])=>cs.reduce((n,c)=>n+c.credits,0);
export function pathwayAudit(plan: Plan) {
  const courses=plan.semesters.flatMap(s=>s.courses);
  const undergraduate=courses.filter(c=>c.program!=='graduate');
  const graduate=courses.filter(c=>c.program==='graduate');
  let shared=0,sharedEarned=0;
  const issues:string[]=[];
  const bsCourses=[...undergraduate];
  const entry=plan.acceleratedSlp?.entryYear??2025;
  for(const s of plan.semesters) for(const c of s.courses) {
    if(!c.sharedBsCredits)continue;
    const number=Number(c.courseCode.match(/\b(\d{3})\b/)?.[1]);
    if(c.program!=='graduate'||c.school!=='udel'||s.term!=='Fall'||s.year!==entry+3||number<600||!Number.isFinite(number)||!Number.isFinite(c.sharedBsCredits)||c.sharedBsCredits<0){issues.push(`${c.courseCode}: shared credit is not eligible in this term.`);continue;}
    const credits=Math.max(0,Math.min(c.credits,c.sharedBsCredits,15-shared));
    if(credits!==c.sharedBsCredits)issues.push(`${c.courseCode}: shared credit exceeds course credits or the 15-credit limit.`);
    shared+=credits;
    if(earned(c))sharedEarned+=credits;
    bsCourses.push({...c,credits,fulfillsRequirements:[]});
  }
  const graduateRequirements=(plan.pathway?.graduateRequirements??[]).map(r=>{
    const matches=graduate.filter(c=>c.courseCode===r.code);
    return {...r,covered:total(matches)>=r.credits&&matches.length>=r.occurrences,completed:total(matches.filter(earned))>=r.credits&&matches.filter(earned).length>=r.occurrences};
  });
  const beforeTransition = plan.semesters.filter(s =>
    s.year + (s.term === 'Winter' ? 1 : 0) < entry + 3 ||
    (s.year + (s.term === 'Winter' ? 1 : 0) === entry + 3 && ['Winter', 'Spring'].includes(s.term))
  ).flatMap(s => s.courses.filter(c => c.program !== 'graduate'));
  return {undergraduate,graduate,shared,sharedEarned,issues,bsCourses,transitionRequirements:evaluateRequirements([],beforeTransition),uniqueCredits:total(courses),undergraduateCredits:total(undergraduate),bsProjected:total(undergraduate)+shared,bsConfirmedProjection:total(undergraduate)+(plan.pathway?.sharedApproval?shared:0),bsEarned:total(undergraduate.filter(earned))+(plan.pathway?.sharedApproval?sharedEarned:0),maCredits:total(graduate),maEarned:total(graduate.filter(earned)),graduateRequirements,bsRequirements:evaluateRequirements([],bsCourses)};
}

/** End-of-term totals include both schools when a term has multiple cards. */
export function semesterDegreeCredits(plan: Plan) {
  const position = (s: Plan['semesters'][number]) =>
    (s.year + (s.term === 'Winter' ? 1 : 0)) * 12 +
    ({ Winter: 1, Spring: 3, Summer: 6, Fall: 9 }[s.term]);
  return new Map(plan.semesters.map(semester => {
    const throughTerm = plan.semesters.filter(s => position(s) <= position(semester));
    const audit = pathwayAudit({ ...plan, semesters: throughTerm });
    return [semester.id, {
      bsProjected: audit.bsProjected,
      bsEarned: audit.bsEarned,
      maProjected: audit.maCredits,
      maEarned: audit.maEarned,
      shared: audit.shared,
      sharedApproved: !!plan.pathway?.sharedApproval,
    }];
  }));
}

export type SemesterDegreeCredits = ReturnType<typeof semesterDegreeCredits> extends Map<string, infer T> ? T : never;
