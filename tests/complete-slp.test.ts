import test from 'node:test';
import assert from 'node:assert/strict';
import { pathwayAudit, clonePathway } from '../src/lib/complete-slp';
import type { Plan, PlanCourse } from '../src/lib/types';
const base:Plan={id:'source',name:'source',slug:'source',createdAt:'before',updatedAt:'before',targetGraduation:'Spring 2028',isEarlyGraduation:true,acceleratedSlp:{entryYear:2025},semesters:[{id:'s',planId:'source',term:'Fall',year:2026,school:'udel',sortOrder:0,courses:[{id:'a',planSemesterId:'s',courseCode:'CGSC 350',school:'udel',credits:3,title:'History',status:'in_progress',grade:'A',fulfillsRequirements:['ppslp-cgsc350']}]}]};
test('cloning keeps all history and metadata without mutating the source',()=>{
 const before=structuredClone(base);const copy=clonePathway(base,'copy','copy');
 assert.deepEqual(base,before);assert.notEqual(copy.id,base.id);assert.notEqual(copy.semesters[0].id,'s');
 assert.equal(copy.semesters[0].courses[0].grade,'A');assert.deepEqual(copy.acceleratedSlp,base.acceleratedSlp);
});
const graduate=(id:string,code:string,credits:number,shared=0):PlanCourse=>({id,planSemesterId:'g',courseCode:code,school:'udel',title:code,status:'planned',credits,program:'graduate',sharedBsCredits:shared});
test('shared credits are one enrollment, capped at 15, and limited to eligible fall courses',()=>{
 const p=clonePathway(base,'copy','copy');p.pathway={sourceSlug:'source',type:'3+2-slp',catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[],notes:[]};
 p.semesters.push({id:'g',planId:'copy',term:'Fall',year:2028,school:'udel',sortOrder:1,courses:[graduate('g1','CSCD 610',10,10),graduate('g2','CSCD 611',10,10)]});
 let a=pathwayAudit(p);assert.equal(a.shared,15);assert.equal(a.uniqueCredits,23);assert.equal(a.bsProjected,18);assert.equal(a.bsConfirmedProjection,3);assert.ok(a.issues.length);
 p.semesters[1].term='Spring';a=pathwayAudit(p);assert.equal(a.shared,0);
 p.semesters[1].term='Fall';p.semesters[1].courses=[graduate('g1','CSCD 500',3,3)];assert.equal(pathwayAudit(p).shared,0);
});
test('credit totals alone do not satisfy missing graduate requirements',()=>{
 const p=clonePathway(base,'copy','copy');p.pathway={sourceSlug:'source',type:'3+2-slp',catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[{code:'CSCD 651',credits:8,occurrences:4}],notes:[]};
 p.semesters[0].courses.push(graduate('g','CSCD 651',8));
 assert.equal(pathwayAudit(p).graduateRequirements[0].covered,false);
});

test('repeated clinical enrollments survive academic reconciliation with their degree allocation',async()=>{
 const {reconcilePlan}=await import('../src/lib/academic-record');
 const p=clonePathway(base,'copy','copy');p.pathway={sourceSlug:'source',type:'3+2-slp',catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[],notes:[]};
 p.semesters=[{...p.semesters[0],term:'Fall',year:2028,courses:[graduate('g1','CSCD 651',1,1)]},{...p.semesters[0],id:'spring',term:'Spring',year:2029,courses:[graduate('g2','CSCD 651',3)]}];
 const result=reconcilePlan(p,[{id:'clinical',legacyKeys:[],courseCode:'CSCD 651',title:'Clinical',credits:1,school:'udel',term:'Fall',year:2028,status:'completed'}]);
 assert.equal(result.semesters.flatMap(s=>s.courses).length,2);
 const actual=result.semesters.flatMap(s=>s.courses).find(c=>c.academicCourseId==='clinical')!;
 assert.equal(actual.program,'graduate');assert.equal(actual.sharedBsCredits,1);
 assert.equal(pathwayAudit(result).maCredits,4);
});

test('graduate coursework cannot inflate the 109-credit undergraduate transition',async()=>{
 const {evaluateAcceleratedSlp}=await import('../src/lib/accelerated-slp');
 const p=clonePathway(base,'copy','copy');
 p.pathway={sourceSlug:'source',type:'3+2-slp',catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[],notes:[]};
 p.semesters[0].courses.push(graduate('early','CSCD 610',3));
 assert.equal(evaluateAcceleratedSlp(p).projected,3);
 p.semesters.push({...p.semesters[0],id:'late',term:'Fall',year:2028,courses:[{...base.semesters[0].courses[0],courseCode:'CGSC 378',fulfillsRequirements:['ppslp-cgsc378']}]});
 assert.equal(pathwayAudit(p).transitionRequirements.requirementsWithStatus.find(r=>r.id==='ppslp-cgsc378')?.projectedFulfilled,false);
});

test('semester totals follow calendar winters, separate earned credits and cap sharing',async()=>{
 const {semesterDegreeCredits}=await import('../src/lib/complete-slp');
 const p=clonePathway(base,'copy','copy');
 p.pathway={sourceSlug:'source',type:'3+2-slp',catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[],notes:[]};
 p.semesters[0].courses[0].status='completed';
 const make=(id:string,term:'Fall'|'Spring'|'Winter',year:number,courses:PlanCourse[])=>({id,planId:p.id,term,year,school:'udel' as const,sortOrder:0,courses});
 p.semesters.push(make('spring','Spring',2029,[graduate('s','CSCD 625',3)]),make('winter','Winter',2028,[graduate('w','CSCD 615',2)]),make('fall','Fall',2028,[graduate('f','CSCD 610',16,16)]));
 let totals=semesterDegreeCredits(p);
 assert.deepEqual(totals.get('fall'),{bsProjected:18,bsEarned:3,maProjected:16,maEarned:0,shared:15,sharedApproved:false});
 assert.equal(totals.get('winter')?.maProjected,18);
 assert.equal(totals.get('spring')?.maProjected,21);
 p.semesters.find(s=>s.id==='fall')!.courses[0].status='completed';
 assert.equal(semesterDegreeCredits(p).get('spring')?.bsEarned,3);
 p.pathway.sharedApproval=true;
 totals=semesterDegreeCredits(p);
 assert.equal(totals.get('spring')?.bsEarned,18);
 assert.equal(totals.get('spring')?.maEarned,16);
});

test('ordinary and legacy plans get cumulative counters without changing saved records',async()=>{
 const {semesterDegreeCredits}=await import('../src/lib/complete-slp');
 const p=clonePathway(base,'ordinary','ordinary');
 p.semesters[0].courses[0].status='completed';
 p.semesters.push({...p.semesters[0],id:'later',year:2028,courses:[{...graduate('legacy','CSCD 610',3),program:undefined}]});
 const before=structuredClone(p);
 const totals=semesterDegreeCredits(p);
 assert.equal(totals.get(p.semesters[0].id)?.bsEarned,3);
 assert.equal(totals.get('later')?.bsProjected,3);
 assert.equal(totals.get('later')?.maProjected,3);
 assert.equal(totals.get('later')?.shared,0);
 assert.deepEqual(p,before);
});
