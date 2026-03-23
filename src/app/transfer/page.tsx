'use client';

import { useState, useMemo } from 'react';
import { Search, Star, AlertTriangle, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TRANSFER_MAPPINGS, RECOMMENDED_TRANSFERS } from '@/lib/data/transfer-mappings';
import { REQUIREMENTS } from '@/lib/data/requirements';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';

// ─── Derived data ────────────────────────────────────────────────────────────

/** UDel course codes that have already been satisfied by completed/transfer/in-progress work */
const FULFILLED_CODES = new Set<string>(
  COMPLETED_COURSES.flatMap((c) => [c.courseCode])
);

/** All UDel course codes that appear in at least one requirement's courseOptions */
const REQUIREMENT_CODES = new Set<string>(
  REQUIREMENTS.flatMap((r) => r.courseOptions ?? [])
);

/** Returns true when this mapping's UDel equivalent could fulfill a remaining requirement */
function fulfillsRemainingRequirement(udelCode: string): boolean {
  if (!REQUIREMENT_CODES.has(udelCode)) return false;
  // Check whether it is already satisfied
  return !FULFILLED_CODES.has(udelCode);
}

/** Collect unique departments from Brookdale course codes (e.g. "MATH", "PSYC") */
const ALL_DEPARTMENTS = Array.from(
  new Set(TRANSFER_MAPPINGS.flatMap((m) => m.brookdaleCourses.map((c) => c.split(' ')[0])))
).sort();

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'recommended';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRecommendedInfo(mappingId: string) {
  return RECOMMENDED_TRANSFERS.find((r) => r.mappingId === mappingId) ?? null;
}

function requirementNameForCode(udelCode: string): string | null {
  const req = REQUIREMENTS.find((r) => r.courseOptions?.includes(udelCode));
  return req ? req.name : null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface RecommendedCardProps {
  mappingId: string;
  priority: 'high' | 'medium';
  reason: string;
}

function RecommendedCard({ mappingId, priority, reason }: RecommendedCardProps) {
  const mapping = TRANSFER_MAPPINGS.find((m) => m.id === mappingId);
  if (!mapping) return null;

  const bothRequired = mapping.brookdaleCourses.length > 1;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex flex-col gap-2',
        priority === 'high'
          ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
          : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
      )}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">
            {mapping.brookdaleCourses.join(' + ')}
          </span>
          {bothRequired && (
            <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Both Required
            </Badge>
          )}
        </div>
        <Badge
          className={cn(
            'shrink-0 text-xs',
            priority === 'high'
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          )}
        >
          {priority === 'high' ? (
            <><Star className="h-3 w-3 mr-1" />High Priority</>
          ) : (
            'Medium Priority'
          )}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-tight">
        {mapping.brookdaleTitles.join(' & ')}
      </p>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowRight className="h-3 w-3 shrink-0" />
        <span className="font-medium">{mapping.udelCourseCode}</span>
        <span>—</span>
        <span>{mapping.udelTitle}</span>
      </div>

      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        {reason}
      </p>

      {mapping.notes && (
        <p className="text-xs text-muted-foreground italic flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          {mapping.notes}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransferPage() {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedDept, setSelectedDept] = useState<string>('');

  const filteredMappings = useMemo(() => {
    const q = search.toLowerCase().trim();

    return TRANSFER_MAPPINGS.filter((m) => {
      // Text search
      if (q) {
        const haystack = [
          ...m.brookdaleCourses,
          ...m.brookdaleTitles,
          m.udelCourseCode,
          m.udelTitle,
          m.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Recommended filter
      if (filterMode === 'recommended') {
        if (!getRecommendedInfo(m.id)) return false;
      }

      // Department filter
      if (selectedDept) {
        if (!m.brookdaleCourses.some((c) => c.startsWith(selectedDept + ' '))) return false;
      }

      return true;
    });
  }, [search, filterMode, selectedDept]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brookdale CC Transfer Credits</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Use this tool to look up how Brookdale Community College courses transfer to the University
          of Delaware. Rows highlighted in green indicate courses that can satisfy a remaining
          requirement in Marley&apos;s degree plan.
        </p>
      </div>

      {/* Recommended Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Recommended for Marley
          </CardTitle>
          <CardDescription>
            Transfer courses that fulfill remaining degree requirements or provide the most strategic
            free-elective credit for her CGSC / PPSLP program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* High priority */}
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              High Priority — Fills Requirement Gap
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RECOMMENDED_TRANSFERS.filter((r) => r.priority === 'high').map((r) => (
                <RecommendedCard key={r.mappingId} {...r} />
              ))}
            </div>
          </div>

          {/* Medium priority */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Medium Priority — Free Elective Credit
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RECOMMENDED_TRANSFERS.filter((r) => r.priority === 'medium').map((r) => (
                <RecommendedCard key={r.mappingId} {...r} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All 86 Transfer Mappings</CardTitle>
          <CardDescription>
            Full Brookdale ↔ UDel articulation table. Rows in green fulfill a remaining requirement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course code, title, or UDel equivalent…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter mode buttons */}
            <div className="flex rounded-md border overflow-hidden shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  filterMode === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('recommended')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-l transition-colors',
                  filterMode === 'recommended'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                Recommended Only
              </button>
            </div>

            {/* Department dropdown */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={cn(
                'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
                'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'shrink-0'
              )}
            >
              <option value="">All Departments</option>
              {ALL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Result count */}
          <p className="text-xs text-muted-foreground mb-3">
            Showing {filteredMappings.length} of {TRANSFER_MAPPINGS.length} mappings
          </p>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    Brookdale Course(s)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Brookdale Title(s)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    UDel Equivalent
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    UDel Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No mappings match your search.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((m) => {
                    const recommended = getRecommendedInfo(m.id);
                    const fulfillsReq = fulfillsRemainingRequirement(m.udelCourseCode);
                    const reqName = fulfillsReq ? requirementNameForCode(m.udelCourseCode) : null;
                    const bothRequired = m.brookdaleCourses.length > 1;

                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          'border-b transition-colors',
                          fulfillsReq
                            ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40'
                            : 'hover:bg-muted/40'
                        )}
                      >
                        {/* Brookdale Courses */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            {m.brookdaleCourses.map((code) => (
                              <span
                                key={code}
                                className="font-mono text-xs font-semibold whitespace-nowrap"
                              >
                                {code}
                              </span>
                            ))}
                            {bothRequired && (
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px] px-1.5 py-0 border-orange-400 text-orange-600"
                              >
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                Both Required
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Brookdale Titles */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-0.5">
                            {m.brookdaleTitles.map((title, i) => (
                              <span key={i} className="text-xs leading-snug">
                                {title}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* UDel Equivalent */}
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-semibold">
                              {m.udelCourseCode}
                            </span>
                            {fulfillsReq && (
                              <Badge className="w-fit text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                Fulfills Req
                              </Badge>
                            )}
                            {recommended && (
                              <Badge
                                className={cn(
                                  'w-fit text-[10px] px-1.5 py-0',
                                  recommended.priority === 'high'
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                )}
                              >
                                <Star className="h-2.5 w-2.5 mr-0.5" />
                                {recommended.priority === 'high' ? 'High' : 'Med'}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* UDel Title */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs leading-snug">{m.udelTitle}</span>
                            {reqName && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                                {reqName}
                              </span>
                            )}
                            {recommended && (
                              <span className="text-[10px] text-muted-foreground leading-tight italic">
                                {recommended.reason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3 align-top">
                          {m.notes ? (
                            <span className="text-xs text-muted-foreground italic leading-snug">
                              {m.notes}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300" />
              Fulfills a remaining requirement
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className="h-4 text-[10px] px-1.5 py-0 bg-amber-500 text-white">
                High
              </Badge>
              Recommended high priority
            </div>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-4 text-[10px] px-1.5 py-0 border-orange-400 text-orange-600"
              >
                Both Required
              </Badge>
              Must take both Brookdale courses
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
