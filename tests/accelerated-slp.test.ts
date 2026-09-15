import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAcceleratedSlp } from '../src/lib/accelerated-slp';
import type { Plan, PlanSemester } from '../src/lib/types';
const semester = (term: PlanSemester['term'], year: number, status: 'completed'|'planned'|'in_progress', code='CGSC 350'): PlanSemester => ({id: `${term}${year}`, planId: 'p', term, year, school:'udel', sortOrder:0, courses:[{id:code, planSemesterId:'s', school:'udel', courseCode:code, title:code, credits:3, status}]});
const plan = (semesters: PlanSemester[]): Plan => ({id:'p',slug:'p',name:'p',targetGraduation:'Spring 2028',isEarlyGraduation:true,createdAt:'',updatedAt:'',semesters});
test('junior deadline excludes summer after junior year and later courses', () => {
 const result=evaluateAcceleratedSlp(plan([semester('Spring',2028,'completed'),semester('Summer',2028,'planned','LING 353'),semester('Fall',2028,'planned','CGSC 379')]));
 assert.equal(result.earned,3); assert.equal(result.projected,3); assert.equal(result.lateCourses.length,2); assert.equal(result.remaining,106);
});
test('winter uses the academic year convention; progress never becomes earned', () => {
 const result=evaluateAcceleratedSlp(plan([semester('Winter',2027,'in_progress'),semester('Winter',2028,'planned','LING 353')]));
 assert.equal(result.earned,0); assert.equal(result.projected,3); assert.equal(result.lateCourses.length,1);
 assert.equal(result.major.find(r=>r.id==='ppslp-cgsc350')?.status,'in_progress');
});
test('completing a course changes earned credits and major requirement together', () => {
 const result=evaluateAcceleratedSlp(plan([semester('Fall',2026,'completed')]));
 assert.equal(result.earned,3); assert.equal(result.major.find(r=>r.id==='ppslp-cgsc350')?.status,'completed');
});
test('GPA is unknown unless entered and must meet both thresholds', () => {
 const p=plan([]); assert.equal(evaluateAcceleratedSlp(p).gpaStatus,'unknown');
 p.acceleratedSlp={entryYear:2025,overallGpa:3.7,majorGpa:3.59};
 assert.equal(evaluateAcceleratedSlp(p).gpaStatus,'below');
 p.acceleratedSlp.majorGpa=3.6; assert.equal(evaluateAcceleratedSlp(p).gpaStatus,'meets');
 p.acceleratedSlp.majorGpa=5; assert.equal(evaluateAcceleratedSlp(p).gpaStatus,'unknown');
});

test('canonical edits reconcile into existing accelerated plans without duplicate credit', async () => {
 const { reconcilePlan } = await import('../src/lib/academic-record');
 const p=plan([semester('Fall',2026,'planned')]); p.acceleratedSlp={entryYear:2025};
 const course={id:'real',legacyKeys:[],courseCode:'CGSC 350',title:'Communication Disorders',school:'udel' as const,term:'Fall' as const,year:2026,credits:3,status:'in_progress' as const};
 const synced=reconcilePlan(p,[course]);
 assert.equal(evaluateAcceleratedSlp(synced).projected,3);
 assert.equal(evaluateAcceleratedSlp(synced).earned,0);
 const completed=reconcilePlan(synced,[{...course,status:'completed'}]);
 assert.equal(evaluateAcceleratedSlp(completed).earned,3);
 assert.deepEqual(completed.acceleratedSlp,{entryYear:2025});
 const moved=reconcilePlan(completed,[{...course,term:'Fall',year:2028}]);
 assert.equal(evaluateAcceleratedSlp(moved).projected,0);
});

test('accelerated plans include every UDel term through 2030 without replacing existing courses', async () => {
 const { reconcilePlan } = await import('../src/lib/academic-record');
 const p=plan([semester('Summer',2028,'planned'),semester('Fall',2029,'planned','CSCD 610')]);
 p.acceleratedSlp={entryYear:2025};
 const extended=reconcilePlan(p,[]);
 for (const year of [2029,2030]) for (const term of ['Fall','Winter','Spring','Summer']) {
   assert.equal(extended.semesters.filter(s=>s.term===term&&s.year===year&&s.school==='udel').length,1);
 }
 assert.equal(extended.semesters.find(s=>s.term==='Fall'&&s.year===2029)?.courses[0].courseCode,'CSCD 610');
 assert.deepEqual(reconcilePlan(extended,[]),extended);
 assert.equal(evaluateAcceleratedSlp(extended).projected,0);
 const last=extended.semesters.at(-1)!;
 const withCourse={...extended,semesters:extended.semesters.map(s=>s.id===last.id?{...s,courses:[{...p.semesters[0].courses[0],id:'future',planSemesterId:s.id}]}:s)};
 assert.equal(reconcilePlan(withCourse,[]).semesters.at(-1)?.courses.length,1);
});
test('ordinary plans keep their existing semester range',async()=>{
 const { reconcilePlan }=await import('../src/lib/academic-record');
 assert.equal(reconcilePlan(plan([semester('Spring',2028,'planned')]),[]).semesters.length,1);
});
