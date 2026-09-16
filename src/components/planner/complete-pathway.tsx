'use client';
import { pathwayAudit, type CompleteSlpPathway } from '@/lib/complete-slp';
import { evaluateAcceleratedSlp } from '@/lib/accelerated-slp';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { CourseSchedulingInfo } from './course-scheduling-info';
import { CourseCatalogLink } from './course-catalog-link';
import { PathwayPanel } from './pathway-panel';
import type { Plan } from '@/lib/types';

export function CompletePathway({plan, print=false, compact=false, onChange}: {plan:Plan; print?:boolean; compact?:boolean; onChange?:(pathway:CompleteSlpPathway)=>void}) {
  if(!plan.pathway)return null;
  const p=plan.pathway,a=pathwayAudit(plan),transition=evaluateAcceleratedSlp(plan);
  const rows=plan.semesters.filter(s=>s.courses.length);
  const table=rows.reduce<{s:Plan['semesters'][number]; undergraduateCumulative:number}[]>((result,s)=>[...result,{s,undergraduateCumulative:(result.at(-1)?.undergraduateCumulative??0)+s.courses.filter(c=>c.program!=='graduate').reduce((n,c)=>n+c.credits,0)}],[]);
  return <PathwayPanel title="One pathway · B.S. Cognitive Science + M.A. Speech-Language Pathology" label="Complete BS and MA pathway" collapsible={!compact && !print}>
    <p>SLP concentration · {p.catalogYear} planning catalog · <a className="underline" href={`/plan/${p.sourceSlug}`}>Original source plan</a></p>
    <div className={`grid gap-3 ${compact?'':'md:grid-cols-3'}`}>
      <div className="rounded-lg bg-blue-50 p-3"><strong>1 · Undergraduate requirements</strong><p>Spring {transition.juniorYear}: {transition.earned} earned / {transition.projected} projected toward 109 credits.</p><p>{a.transitionRequirements.requirementsWithStatus.filter(r=>r.id!=='free-elective'&&r.projectedFulfilled).length} / {a.transitionRequirements.totalRequirements-1} course requirements covered by this plan.</p></div>
      <div className="rounded-lg bg-indigo-50 p-3"><strong>2 · B.S. award target: {p.bsAward}</strong><p>{a.bsEarned} earned · {a.bsProjected}/124 projected with {a.shared} proposed shared credits.</p><p>Sharing approval: {p.sharedApproval?'Recorded as confirmed':'Pending advisor confirmation'}. Without that approval: {a.bsConfirmedProjection}/124 projected.</p></div>
      <div className="rounded-lg bg-teal-50 p-3"><strong>3 · M.A. award target: {p.maAward}</strong><p>{a.maEarned} earned · {a.maCredits}/60 projected.</p><p>{a.graduateRequirements.filter(r=>r.covered).length}/{a.graduateRequirements.length} required course groups covered; clinical sign-offs remain separate.</p></div>
    </div>
    <p><strong>{a.uniqueCredits} unique enrollment credits</strong> across both degrees; shared courses appear once. Targets are projections, not completed awards.</p>
    {a.issues.map((issue,i)=><p role="alert" key={i} className="text-amber-800">{issue}</p>)}
    {compact ? <a href="#complete-course-roadmap" className="underline">View course sources and requirement mappings</a> : <>
    <p>Application milestone: junior year, Fall 2027–Spring 2028. GPA verification: {transition.gpaStatus==='unknown'?'both current overall and major GPAs need confirmation':transition.gpaStatus==='meets'?'entered values meet 3.6 in both areas':'entered values are below the 3.6 threshold'}. MA start target: Fall 2028.</p>
    <details open={print}><summary className="cursor-pointer font-semibold">Advisor confirmations and source discrepancies</summary><ul className="list-disc pl-5 space-y-2 mt-3">{p.notes.map((note,i)=><li key={i}>{note}</li>)}</ul></details>
    <fieldset className="space-y-2 rounded-lg border p-3"><legend className="font-semibold">Clinical and degree confirmations</legend>
      <p>Record these only after verification by the advisor/program. Save Plan to retain changes; course credits do not complete these checks automatically.</p>
      <label className="flex gap-2"><input type="checkbox" checked={p.sharedApproval} disabled={!onChange} onChange={e=>onChange?.({...p,sharedApproval:e.target.checked})}/>Advisor approved the listed Fall 2028 shared B.S./M.A. credits (maximum 15)</label>
      {([
        ['observation','Before direct clinical work: 25 guided observation hours documented and approved in CALIPSO'],
        ['firstYearClinic','Before CSCD 751: 8 CSCD 651 credits and first-year clinical clearance (approximately 100 direct hours)'],
        ['directHours','By MA graduation: 375 approved direct clinical hours, including permitted simulation/telepractice limits'],
        ['competencies','Required knowledge/skills competencies and clinical exit verification completed'],
        ['project','Comprehensive academic-clinical project and presentation approved (CSCD 780)'],
        ['graduateStanding','Program verified graduate GPA/grade and academic standing requirements'],
      ] as const).map(([key,label])=><label className="flex gap-2" key={key}><input type="checkbox" checked={!!p.clinicalConfirmations?.[key]} disabled={!onChange} onChange={e=>onChange?.({...p,clinicalConfirmations:{...p.clinicalConfirmations,[key]:e.target.checked}})}/>{label}</label>)}
      <a className="underline" href="https://catalog.udel.edu/mime/media/96/5661/Program+Policy+Document+Speech-Language+Pathology+MA.pdf">Official program policy and clinical requirements</a>
    </fieldset>
    <details open={print}><summary className="cursor-pointer font-semibold">M.A. requirement audit (including repeated clinical courses)</summary><ul className="grid gap-1 sm:grid-cols-2 mt-3">{a.graduateRequirements.map(r=><li key={r.code}><CourseCatalogLink course={{courseCode:r.code,school:'udel',program:'graduate'}} />: {r.credits} credits across {r.occurrences} enrollment{r.occurrences===1?'':'s'} · {r.completed?'Completed':r.covered?'Planned':'Needs scheduling'}</li>)}</ul></details>
    <details id="complete-course-roadmap" open={print}><summary className="cursor-pointer font-semibold">Complete course roadmap, sources and requirement mappings</summary>
      {table.map(({s,undergraduateCumulative})=><div className="my-4 break-inside-avoid" key={s.id}>
        <h3 className={`rounded p-2 text-white font-semibold ${s.school==='brookdale'?'bg-emerald-600':'bg-blue-600'}`}>{s.term} {s.year} · {s.school==='brookdale'?'Brookdale':'UDel'}{s.term==='Winter'?` (January ${s.year+1})`:''} · {s.courses.reduce((n,c)=>n+c.credits,0)} credits</h3>
        <p className="my-2">{s.courses.some(c=>c.program==='graduate')?'Graduate phase':'Undergraduate phase'} · Cumulative undergraduate coursework: {undergraduateCumulative} credits</p>
        <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr><th className="p-2">Course / credits</th><th className="p-2">Applies to / purpose</th><th className="p-2">Prerequisites / verification</th></tr></thead><tbody>{s.courses.map(c=><tr key={c.id} className="border-t align-top">
          <td className="p-2"><strong><CourseCatalogLink course={c} /></strong> {c.school === 'udel' && <CourseSchedulingInfo courseCode={c.courseCode} />} — {c.title}<br/>{c.credits} credits · {c.status.replace('_',' ')}{c.grade?` · Grade ${c.grade}`:''}<br/>{c.requirementRole??'Existing academic record'}{c.courseKind?` · ${c.courseKind}`:''}</td>
          <td className="p-2">{c.program==='graduate'?'M.A. Speech-Language Pathology':'B.S. Cognitive Science'}{c.sharedBsCredits?` + ${c.sharedBsCredits} proposed B.S. shared credits (${p.sharedApproval?'advisor approval recorded':'approval pending'})`:''}<br/>{c.fulfillsRequirements?.map(id=>REQUIREMENTS.find(r=>r.id===id)?.name??id).join('; ')|| (c.program==='graduate'?'Required MA curriculum':'BS degree credit minimum')}<p>{c.rationale}</p></td>
          <td className="p-2">{c.prerequisites}<br/>{c.corequisites?`Corequisite: ${c.corequisites}`:''}<p>{c.verification??'Preserved from source/academic record.'}</p>{c.sourceUrls?.map((url,i)=><a key={url} className="mr-2 underline" href={url} target="_blank" rel="noreferrer">{i===0?'Course catalog':i===1?'MA requirements':'Department sequence'}</a>)}</td>
        </tr>)}</tbody></table></div>
      </div>)}
    </details>
    <p className="text-xs">Policy sources: <a className="underline" href="https://catalog.udel.edu/preview_program.php?catoid=96&poid=96656">3+2 combined program</a> · <a className="underline" href="https://catalog.udel.edu/preview_program.php?catoid=96&poid=96141">MA catalog</a>. Reviewed September 16, 2026.</p>
    </>}
  </PathwayPanel>;
}
