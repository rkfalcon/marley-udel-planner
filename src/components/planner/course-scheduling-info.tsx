'use client';

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SCHEDULING_NOTES: Record<string, string> = {
  'CSCD 615': 'UDel’s published MA sequence places Cultural Humility in Clinical Practice in the first winter. The course catalog instead lists a typical fall offering, so this winter placement needs program confirmation.',
  'CSCD 620': 'UDel’s published MA sequence places Professional Practice in Speech-Language Pathology in the first winter. Winter instruction is part of the full-time program sequence; this placement was not chosen simply to reduce fall or spring workload.',
  'CSCD 624': 'UDel’s published MA sequence places Dysphagia in the first summer alongside clinical practicum. Summer instruction is part of the full-time program sequence; moving it to fall or spring requires program confirmation.',
  'CSCD 626': 'UDel’s published MA sequence places Augmentative and Alternative Communication in the first summer alongside clinical practicum. Moving it to fall or spring requires confirmation of course availability and the approved sequence.',
  'CSCD 650': 'Clinical Practicum Seminar is a zero-credit companion to CSCD 651. It is included alongside each practicum enrollment based on the catalog’s concurrent-enrollment requirement. These proposed seminar placements need program confirmation and add no credits to the degree total.',
  'CSCD 651': 'Clinical Practicum repeats intentionally: each enrollment represents a separate term of supervised clinical training. The published first-year sequence assigns 1 credit in fall, 1 in winter, 3 in spring and 3 in summer: 8 credits total. These are separate enrollments, not duplicate credit for one class.',
  'CSCD 750': 'Advanced Clinical Practicum Seminar carries zero credits. It is paired with CSCD 751 based on the catalog’s concurrent-enrollment requirement; the published sequence also lists it in the second winter without winter practicum credits. Exact seminar registrations remain provisional and require program confirmation.',
  'CSCD 751': 'Advanced Clinical Practicum repeats intentionally across two external clinical-placement semesters: 4 credits in the second fall and 4 in the second spring, totaling 8 credits. Students must first complete 8 credits of CSCD 651 and receive clinical clearance. Each enrollment is a separate clinical experience.',
};

export function CourseSchedulingInfo({ courseCode }: { courseCode: string }) {
  const note = SCHEDULING_NOTES[courseCode];
  if (!note) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`Scheduling information for ${courseCode}`}
        title=""
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 print:hidden"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="block max-w-[min(22rem,calc(100vw-2rem))] space-y-2 p-3 text-left leading-relaxed">
        <p className="font-semibold">{courseCode} · Scheduling information</p>
        <p>{note}</p>
        <p className="text-xs opacity-80">Based on the department’s 2025–2027 sequence and 2026–2027 catalog. Marley’s 2028–2030 cohort schedule is not yet confirmed. Winter uses the preceding fall’s year in this planner (Winter 2028 = January 2029).</p>
      </TooltipContent>
    </Tooltip>
  );
}
