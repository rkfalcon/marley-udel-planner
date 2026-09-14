'use client';
import type { Plan } from '@/lib/types';
import { ACCELERATED_SLP_URL, SLP_ADMISSIONS_URL, evaluateAcceleratedSlp, type AcceleratedSlpSettings } from '@/lib/accelerated-slp';

export function AcceleratedSlp({plan, onChange}: {plan: Plan; onChange?: (settings: AcceleratedSlpSettings | undefined) => void}) {
  const settings = plan.acceleratedSlp;
  if (!settings) return onChange ? <div className="p-4 print:hidden"><button className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-800" onClick={() => onChange({entryYear:2025})}>Explore the 3+2 SLP pathway in this plan</button></div> : null;
  const progress = evaluateAcceleratedSlp(plan);
  const update = (patch: Partial<AcceleratedSlpSettings>) => onChange?.({...settings,...patch});
  const done = progress.major.filter(r => r.status === 'completed').length;
  const covered = progress.major.filter(r => r.projectedFulfilled).length;
  return <section className="m-4 rounded-xl border border-blue-200 bg-white p-5 text-sm text-slate-700 space-y-4" aria-label="3+2 SLP pathway">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-blue-900">3+2 SLP pathway · BS → MA</h2><p>Live coursework projection through Spring {progress.juniorYear}. Save Plan to keep pathway settings and confirmations.</p></div>{onChange && <button className="underline print:hidden" onClick={()=>onChange(undefined)}>Remove pathway view</button>}</div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg bg-blue-50 p-3"><strong className="block text-lg">{progress.earned} / 109 credits earned</strong><p>{progress.projected} including in-progress and planned courses before the deadline.</p><p>{progress.remaining} more credits to schedule.</p></div>
      <div className="rounded-lg bg-blue-50 p-3"><strong className="block text-lg">{done} / {progress.major.length} major requirements completed</strong><p>{covered} covered by this plan, including SLP concentration.</p></div>
      <div className="rounded-lg bg-blue-50 p-3"><strong className="block text-lg">GPA: {progress.gpaStatus === 'unknown' ? 'Needs verification' : progress.gpaStatus === 'meets' ? 'Entered values meet 3.6' : 'Below 3.6 minimum'}</strong><p>Both overall and major GPA must meet 3.6 at application. Enter verified values below.</p></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <label>First fall at UDel<input aria-label="First fall at UDel" type="number" min="2020" max="2100" value={settings.entryYear} disabled={!onChange} className="block w-full rounded border p-2" onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=2020&&n<=2100)update({entryYear:n});}} /></label>
      {(['overallGpa','majorGpa'] as const).map(key=><label key={key}>{key==='overallGpa'?'Verified overall GPA':'Verified major GPA'}<input aria-label={key==='overallGpa'?'Verified overall GPA':'Verified major GPA'} type="number" min="0" max="4" step="0.001" placeholder="Unknown" value={settings[key] ?? ''} disabled={!onChange} className="block w-full rounded border p-2" onChange={e=>{const n=e.target.value===''?undefined:Number(e.target.value);if(n===undefined||(Number.isFinite(n)&&n>=0&&n<=4))update({[key]:n});}} /></label>)}
    </div>
    <ol className="list-decimal pl-5 space-y-1">
      <li>Now: review course sequencing, prerequisites and availability with the undergraduate advisor.</li>
      <li>Fall {progress.juniorYear-1}–Spring {progress.juniorYear}: apply during junior year. Confirm that cycle’s deadline with admissions.</li>
      <li>By Spring {progress.juniorYear}: reach 109 earned credits and finish the major. Schedule missing courses in the semester grid below.</li>
      <li>{progress.juniorYear}–{progress.juniorYear+2}: anticipated MA phase, subject to admission and the approved graduate schedule.</li>
    </ol>
    <p>The BS still requires 124 credits. Up to 15 approved MA credits may be shared; they are not automatically added to earned credit totals. Confirm the BS award date and shared courses with your advisor.</p>
    <details open={!onChange}><summary className="cursor-pointer font-semibold">Major and concentration courses to finish by Spring {progress.juniorYear}</summary><ul className="mt-2 grid gap-2 sm:grid-cols-2">{progress.major.map(r=><li key={r.id} className="rounded border p-2"><span className="font-medium">{r.name}</span><span className="block text-xs">{r.status==='completed'?'Completed':r.projectedFulfilled?'Covered by in-progress/planned coursework':'Needs scheduling'} · {r.creditsRequired} credits</span>{!r.projectedFulfilled&&<span className="block text-xs text-slate-500">{r.courseOptions?.join(' / ') || r.description}</span>}</li>)}</ul></details>
    {progress.lateCourses.length>0&&<details><summary className="cursor-pointer font-semibold text-amber-800">{progress.lateCourses.length} courses fall after the junior-year deadline</summary><ul className="list-disc pl-5">{progress.lateCourses.map((c,i)=><li key={`${c.id}-${i}`}>{c.courseCode} · {c.semester} · {c.credits} credits (excluded above)</li>)}</ul></details>}
    <fieldset className="space-y-2"><legend className="font-semibold">Advising and application checklist</legend>
      {([
        ['advisorReviewed','Advisor reviewed the three-year BS plan and shared MA credits'],
        ['prerequisitesReviewed','Advisor verified MA prerequisites: phonetics/phonology, speech science, language development and audiology; reviewed biology, physics/chemistry, social science and statistics for certification'],
        ['observationReviewed','25 clinical observation hours documented with an ASHA-certified SLP'],
        ['applicationSubmitted','Application submitted for the intended admission cycle'],
      ] as const).map(([key,label])=><label className="flex items-start gap-2" key={key}><input type="checkbox" className="mt-1" checked={!!settings[key]} disabled={!onChange} onChange={e=>update({[key]:e.target.checked})}/>{label}</label>)}
    </fieldset>
    <p className="text-xs text-slate-500">Planning aid, not an admission decision. Confirm GPAs again after grades change. General education, residency and minimum-grade rules still apply. Graduate courses and clinical placements follow the department’s approved program of study.</p>
    <p className="text-xs"><a className="underline" href={ACCELERATED_SLP_URL} target="_blank" rel="noreferrer">Official 3+2 rules</a> · <a className="underline" href={SLP_ADMISSIONS_URL} target="_blank" rel="noreferrer">MA prerequisites, application and program of study</a> · Rules checked September 14, 2026; published admissions guidance covers 2026–2027. Verify Marley’s later cycle. Contact cgsc-advise@udel.edu or cscd-admissions@udel.edu.</p>
  </section>;
}
