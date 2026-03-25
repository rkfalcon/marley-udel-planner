'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePlan } from '@/hooks/use-plan';

const GRADUATION_OPTIONS = [
  { value: 'Spring 2027', label: 'Spring 2027', description: '4 semesters away' },
  { value: 'Fall 2027', label: 'Fall 2027', description: '4.5 semesters away' },
  { value: 'Spring 2028', label: 'Spring 2028', description: '5 semesters away' },
  { value: 'Fall 2028', label: 'Fall 2028', description: '5.5 semesters away' },
];

// Preview: what semesters will be generated for a given graduation target
// Winter N = winter break after Fall N (same year label)
const SEMESTER_PREVIEWS: Record<string, { term: string; year: number; school: string }[]> = {
  'Spring 2027': [
    { term: 'Summer', year: 2026, school: 'Brookdale' },
    { term: 'Fall', year: 2026, school: 'UDel' },
    { term: 'Winter', year: 2026, school: 'Brookdale' },
    { term: 'Spring', year: 2027, school: 'UDel' },
  ],
  'Fall 2027': [
    { term: 'Summer', year: 2026, school: 'Brookdale' },
    { term: 'Fall', year: 2026, school: 'UDel' },
    { term: 'Winter', year: 2026, school: 'Brookdale' },
    { term: 'Spring', year: 2027, school: 'UDel' },
    { term: 'Summer', year: 2027, school: 'Brookdale' },
    { term: 'Fall', year: 2027, school: 'UDel' },
  ],
  'Spring 2028': [
    { term: 'Summer', year: 2026, school: 'Brookdale' },
    { term: 'Fall', year: 2026, school: 'UDel' },
    { term: 'Winter', year: 2026, school: 'Brookdale' },
    { term: 'Spring', year: 2027, school: 'UDel' },
    { term: 'Summer', year: 2027, school: 'Brookdale' },
    { term: 'Fall', year: 2027, school: 'UDel' },
    { term: 'Winter', year: 2027, school: 'Brookdale' },
    { term: 'Spring', year: 2028, school: 'UDel' },
    { term: 'Summer', year: 2028, school: 'Brookdale' },
  ],
  'Fall 2028': [
    { term: 'Summer', year: 2026, school: 'Brookdale' },
    { term: 'Fall', year: 2026, school: 'UDel' },
    { term: 'Winter', year: 2026, school: 'Brookdale' },
    { term: 'Spring', year: 2027, school: 'UDel' },
    { term: 'Summer', year: 2027, school: 'Brookdale' },
    { term: 'Fall', year: 2027, school: 'UDel' },
    { term: 'Winter', year: 2027, school: 'Brookdale' },
    { term: 'Spring', year: 2028, school: 'UDel' },
    { term: 'Summer', year: 2028, school: 'Brookdale' },
    { term: 'Fall', year: 2028, school: 'UDel' },
  ],
};

const PAST_SEMESTERS = [
  { term: 'Prior Credits', year: 2024, school: 'Brookdale', locked: true },
  { term: 'Fall', year: 2025, school: 'UDel', locked: true },
  { term: 'Winter', year: 2025, school: 'Brookdale', locked: true },
  { term: 'Spring', year: 2026, school: 'UDel', locked: true },
];

export default function NewPlanPage() {
  const router = useRouter();
  const { createPlan, loading } = usePlan();

  const [name, setName] = useState('');
  const [targetGraduation, setTargetGraduation] = useState('Spring 2028');
  const [isEarlyGraduation, setIsEarlyGraduation] = useState(false);
  const [error, setError] = useState('');

  const futureSemesters = SEMESTER_PREVIEWS[targetGraduation] || [];

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    setError('');

    const plan = createPlan(name.trim(), targetGraduation, isEarlyGraduation);
    // Save to database immediately so the plan page can load it
    try {
      await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, action: 'create' }),
      });
    } catch {
      // If save fails, the plan page will show not found — but proceed anyway
    }
    router.push(`/plan/${plan.slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create a Graduation Plan
          </h1>
          <p className="text-slate-500 text-base">
            Build your path to graduation at the University of Delaware
          </p>
        </div>

        {/* Form card */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-800">Plan Details</CardTitle>
            <CardDescription>
              Customize your degree plan. Past semesters are pre-filled from your transcript.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Plan name */}
            <div className="space-y-2">
              <Label htmlFor="plan-name" className="text-sm font-semibold text-slate-700">
                Plan Name
              </Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g., Spring 2028 Graduation Plan"
                className={cn(
                  'border-slate-200 focus:border-blue-300 h-10',
                  error && 'border-red-300 focus:border-red-400'
                )}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            {/* Target graduation */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Target Graduation
              </Label>
              <Select
                value={targetGraduation}
                onValueChange={(val) => { if (val) setTargetGraduation(val); }}
              >
                <SelectTrigger className="border-slate-200 focus:border-blue-300 h-10">
                  <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADUATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-slate-400">
                          {opt.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Early graduation toggle */}
            <div
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all duration-150',
                isEarlyGraduation
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              )}
              onClick={() => setIsEarlyGraduation((v) => !v)}
            >
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                  isEarlyGraduation
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-slate-300 bg-white'
                )}
              >
                {isEarlyGraduation && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Early Graduation Goal
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px] px-1.5 py-0">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Ambitious
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mark this plan as targeting an accelerated graduation timeline
                </p>
              </div>
            </div>

            <Separator />

            {/* Semester preview */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  Semester Preview
                </span>
                <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-200 border px-1.5">
                  {PAST_SEMESTERS.length + futureSemesters.length} semesters total
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Past semesters */}
                {PAST_SEMESTERS.map((s, i) => (
                  <div
                    key={`past-${i}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 opacity-70"
                  >
                    <span className="text-[10px] text-slate-400 shrink-0">
                      PAST
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {s.term} {s.year}
                      </p>
                      <p className="text-[10px] text-slate-400">{s.school}</p>
                    </div>
                  </div>
                ))}

                {/* Future semesters */}
                {futureSemesters.map((s, i) => {
                  const isBrookdale = s.school === 'Brookdale';
                  const isLast = i === futureSemesters.length - 1;

                  return (
                    <div
                      key={`future-${i}`}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md border',
                        isBrookdale
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-blue-50 border-blue-200',
                        isLast && 'ring-2 ring-amber-300 ring-offset-1'
                      )}
                    >
                      {isLast && (
                        <GraduationCap className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={cn('text-xs font-semibold truncate', {
                            'text-blue-700': !isBrookdale,
                            'text-emerald-700': isBrookdale,
                          })}
                        >
                          {s.term} {s.year}
                        </p>
                        <p
                          className={cn('text-[10px]', {
                            'text-blue-500': !isBrookdale,
                            'text-emerald-500': isBrookdale,
                          })}
                        >
                          {s.school}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Summer and Winter semesters use Brookdale Community College for transfer credit savings.
              </p>
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Plan
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
