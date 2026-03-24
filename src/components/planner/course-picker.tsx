'use client';

import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, CheckCircle2, Circle,
  Clock, Star, ArrowRight, GraduationCap, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { COURSES, searchCourses, getCourseByCode } from '@/lib/data/courses';
import { REQUIREMENTS, REQUIREMENT_GROUPS } from '@/lib/data/requirements';
import { TRANSFER_MAPPINGS } from '@/lib/data/transfer-mappings';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';
import { Course, Term, RequirementCategory } from '@/lib/types';

interface CoursePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCourse: (course: Course) => void;
  semesterTerm?: Term;
  semesterSchool?: 'udel' | 'brookdale';
  plannedCourseCodes?: string[]; // courses already in the plan
}

// Build a structured list of requirements with their course options
function buildRequirementSections(school: 'udel' | 'brookdale', query: string) {
  const completedCodes = new Set(COMPLETED_COURSES.map(c => c.courseCode));
  const q = query.toLowerCase();

  // Group requirements by category
  const sections: {
    category: RequirementCategory;
    label: string;
    description: string;
    requirements: {
      id: string;
      name: string;
      status: 'completed' | 'in_progress' | 'not_started';
      courses: Course[];
    }[];
  }[] = [];

  for (const group of REQUIREMENT_GROUPS) {
    const reqs = REQUIREMENTS
      .filter(r => r.category === group.category)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const reqItems = reqs.map(req => {
      // Determine status
      let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
      for (const cc of COMPLETED_COURSES) {
        const fulfills = cc.fulfillsRequirements?.includes(req.id);
        const matches = req.courseOptions?.includes(cc.courseCode);
        if (fulfills || matches) {
          if (cc.status === 'completed' || cc.status === 'transfer') {
            status = 'completed';
            break;
          } else if (cc.status === 'in_progress') {
            status = 'in_progress';
          }
        }
      }

      // Get available courses for this requirement
      let courses: Course[] = [];
      if (req.courseOptions && req.courseOptions.length > 0) {
        if (school === 'udel') {
          courses = req.courseOptions
            .map(code => COURSES.find(c => c.courseCode === code && c.school === 'udel'))
            .filter((c): c is Course => c !== undefined);
        } else {
          // For brookdale, find transfer mappings that result in one of the requirement courses
          const transferCourses: Course[] = [];
          for (const code of req.courseOptions) {
            const mappings = TRANSFER_MAPPINGS.filter(m => m.udelCourseCode === code);
            for (const m of mappings) {
              for (const bc of m.brookdaleCourses) {
                const brookdaleCourse = COURSES.find(c => c.courseCode === bc && c.school === 'brookdale');
                if (brookdaleCourse) {
                  transferCourses.push(brookdaleCourse);
                }
              }
            }
          }
          courses = transferCourses;
        }
      }

      // Filter by search query
      if (q) {
        courses = courses.filter(c =>
          c.courseCode.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
        );
      }

      return { id: req.id, name: req.name, status, courses };
    }).filter(r => {
      // If searching, only show requirements that have matching courses
      if (q) return r.courses.length > 0;
      return true;
    });

    if (reqItems.length > 0) {
      sections.push({
        category: group.category,
        label: group.label,
        description: group.description,
        requirements: reqItems,
      });
    }
  }

  return sections;
}

// Get extra elective courses not in any requirement
function getElectiveCourses(school: 'udel' | 'brookdale', query: string): Course[] {
  const reqCourseCodes = new Set<string>();
  for (const req of REQUIREMENTS) {
    if (req.courseOptions) {
      for (const code of req.courseOptions) {
        reqCourseCodes.add(code);
      }
    }
  }

  let electives = COURSES.filter(c => c.school === school && !reqCourseCodes.has(c.courseCode));

  if (query) {
    const q = query.toLowerCase();
    electives = electives.filter(c =>
      c.courseCode.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    );
  }

  return electives;
}

function getTransferMapping(courseCode: string) {
  return TRANSFER_MAPPINGS.find((m) => m.brookdaleCourses.includes(courseCode));
}

function CourseButton({
  course,
  onSelect,
  isPlanned,
  isCompleted,
}: {
  course: Course;
  onSelect: (course: Course) => void;
  isPlanned: boolean;
  isCompleted: boolean;
}) {
  const isBrookdale = course.school === 'brookdale';
  const transferMap = isBrookdale ? getTransferMapping(course.courseCode) : null;
  const isDisabled = isPlanned || isCompleted;

  return (
    <button
      onClick={() => !isDisabled && onSelect(course)}
      disabled={isDisabled}
      className={cn(
        'w-full text-left rounded-lg border p-2.5 transition-all duration-150 group',
        'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && !isBrookdale && 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 focus:ring-blue-300',
        !isDisabled && isBrookdale && 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50 focus:ring-emerald-300',
        isPlanned && 'border-blue-200 bg-blue-50/50',
        isCompleted && 'border-green-200 bg-green-50/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('text-sm font-bold', isBrookdale ? 'text-emerald-700' : 'text-blue-700')}>
              {course.courseCode}
            </span>
            <Badge variant="outline" className={cn(
              'text-[10px] px-1.5 h-4 py-0 font-semibold border',
              isBrookdale ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-blue-200 text-blue-600 bg-blue-50',
            )}>
              {course.credits} cr
            </Badge>
            {isPlanned && (
              <Badge className="text-[10px] px-1.5 h-4 py-0 bg-blue-100 text-blue-600 border-0">In plan</Badge>
            )}
            {isCompleted && (
              <Badge className="text-[10px] px-1.5 h-4 py-0 bg-green-100 text-green-600 border-0">Done</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-tight truncate">{course.title}</p>
          {transferMap && (
            <p className="text-[10px] text-teal-600 mt-0.5">
              → {transferMap.udelCourseCode}: {transferMap.udelTitle}
            </p>
          )}
        </div>
        {!isDisabled && (
          <Plus className={cn(
            'h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
            isBrookdale ? 'text-emerald-400' : 'text-blue-400',
          )} />
        )}
      </div>
    </button>
  );
}

function BrookdaleTransferList({
  query,
  onSelect,
  plannedCodes,
  completedCodes,
}: {
  query: string;
  onSelect: (course: Course) => void;
  plannedCodes: Set<string>;
  completedCodes: Set<string>;
}) {
  const q = query.toLowerCase();

  // Filter transfer mappings by search
  const filtered = useMemo(() => {
    if (!q) return TRANSFER_MAPPINGS;
    return TRANSFER_MAPPINGS.filter(m =>
      m.brookdaleCourses.some(c => c.toLowerCase().includes(q)) ||
      m.brookdaleTitles.some(t => t.toLowerCase().includes(q)) ||
      m.udelCourseCode.toLowerCase().includes(q) ||
      m.udelTitle.toLowerCase().includes(q)
    );
  }, [q]);

  // Check which ones fulfill a degree requirement
  const getReqMatch = (udelCode: string) => {
    for (const req of REQUIREMENTS) {
      if (req.courseOptions?.includes(udelCode)) return req.name;
    }
    return null;
  };

  // Sort: requirement-fulfilling first, then alphabetical
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aReq = getReqMatch(a.udelCourseCode);
      const bReq = getReqMatch(b.udelCourseCode);
      if (aReq && !bReq) return -1;
      if (!aReq && bReq) return 1;
      return a.brookdaleCourses[0].localeCompare(b.brookdaleCourses[0]);
    });
  }, [filtered]);

  return (
    <div className="px-4 pb-5 space-y-1.5">
      <p className="text-xs text-slate-500 px-1 pb-1">
        {filtered.length} of {TRANSFER_MAPPINGS.length} Brookdale → UDel transfer courses
      </p>

      {sorted.map((mapping) => {
        const reqMatch = getReqMatch(mapping.udelCourseCode);
        const isMulti = mapping.brookdaleCourses.length > 1;
        const isPlanned = mapping.brookdaleCourses.some(c => plannedCodes.has(c));
        const brookdaleCode = mapping.brookdaleCourses.join(' + ');

        return (
          <button
            key={mapping.id}
            onClick={() => {
              // Create a course object from the transfer mapping
              const course: Course = {
                id: `transfer-${mapping.id}`,
                school: 'brookdale',
                courseCode: mapping.brookdaleCourses[0],
                title: mapping.brookdaleTitles[0],
                credits: 3, // Most transfer courses are 3 credits
              };
              onSelect(course);
            }}
            disabled={isPlanned}
            className={cn(
              'w-full text-left rounded-lg border p-3 transition-all duration-150 group',
              'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-300',
              isPlanned && 'opacity-50 cursor-not-allowed',
              reqMatch
                ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
                : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Brookdale course info */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-emerald-700">{brookdaleCode}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-4 py-0 font-semibold border-emerald-200 text-emerald-600 bg-emerald-50">
                    3 cr
                  </Badge>
                  {isMulti && (
                    <Badge className="text-[10px] px-1.5 h-4 py-0 bg-orange-100 text-orange-600 border-0">
                      Both required
                    </Badge>
                  )}
                  {isPlanned && (
                    <Badge className="text-[10px] px-1.5 h-4 py-0 bg-blue-100 text-blue-600 border-0">In plan</Badge>
                  )}
                  {reqMatch && (
                    <Star className="h-3 w-3 text-amber-400 fill-current shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{mapping.brookdaleTitles.join(' & ')}</p>

                {/* Transfer arrow + UDel equivalent */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ArrowRight className="h-3 w-3 text-teal-500 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700">{mapping.udelCourseCode}</span>
                  <span className="text-xs text-slate-500">{mapping.udelTitle}</span>
                </div>

                {/* Requirement fulfillment */}
                {reqMatch && (
                  <Badge className="mt-1.5 text-[10px] font-medium px-2 py-0.5 h-auto bg-amber-100 text-amber-700 border-0">
                    Fulfills: {reqMatch.replace(/^[A-Z]+\s\d+\s[-–]\s/, '')}
                  </Badge>
                )}

                {/* Notes */}
                {mapping.notes && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">{mapping.notes}</p>
                )}
              </div>

              {!isPlanned && (
                <Plus className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
        );
      })}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No transfer courses match</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

function CustomCourseEntry({
  school,
  onAdd,
}: {
  school: 'udel' | 'brookdale';
  onAdd: (course: Course) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [credits, setCredits] = useState('3');

  const handleAdd = () => {
    if (!code.trim() || !title.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      school,
      courseCode: code.trim().toUpperCase(),
      title: title.trim(),
      credits: parseInt(credits) || 3,
    });
    setCode('');
    setTitle('');
    setCredits('3');
  };

  return (
    <div className="rounded-lg border border-dashed border-slate-300 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <Plus className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-600 flex-1">
          Add Any Course
        </span>
        <span className="text-[10px] text-slate-400">
          Type any {school === 'udel' ? 'UDel' : 'Brookdale'} course
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 space-y-2.5 bg-slate-50/50">
          <p className="text-[11px] text-slate-500">
            Enter any course from the {school === 'udel' ? 'University of Delaware' : 'Brookdale CC'} catalog:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. PSYC 310"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Input
              placeholder="Credits"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="h-8 text-xs w-16"
              type="number"
              min="1"
              max="6"
            />
          </div>
          <Input
            placeholder="Course title (e.g. Social Psychology)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!code.trim() || !title.trim()}
            className={cn(
              'w-full h-8 rounded-md text-xs font-semibold transition-colors',
              code.trim() && title.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            Add to Semester
          </button>
        </div>
      )}
    </div>
  );
}

export function CoursePicker({
  open,
  onOpenChange,
  onSelectCourse,
  semesterTerm,
  semesterSchool = 'udel',
  plannedCourseCodes = [],
}: CoursePickerProps) {
  const [query, setQuery] = useState('');
  const [activeSchool, setActiveSchool] = useState<'udel' | 'brookdale'>(semesterSchool);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());

  // Reset state when school changes
  const handleSchoolChange = (school: 'udel' | 'brookdale') => {
    setActiveSchool(school);
    setExpandedSections(new Set());
    setExpandedReqs(new Set());
  };

  const completedCodes = useMemo(
    () => new Set(COMPLETED_COURSES.map(c => c.courseCode)),
    []
  );
  const plannedSet = useMemo(() => new Set(plannedCourseCodes), [plannedCourseCodes]);

  const sections = useMemo(
    () => buildRequirementSections(activeSchool, query),
    [activeSchool, query]
  );

  const electiveCourses = useMemo(
    () => getElectiveCourses(activeSchool, query),
    [activeSchool, query]
  );

  const toggleSection = (category: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleReq = (reqId: string) => {
    setExpandedReqs(prev => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  const handleSelect = (course: Course) => {
    onSelectCourse(course);
    // Don't close — let user add multiple courses
  };

  const semesterLabel = semesterTerm
    ? `${semesterTerm} ${semesterSchool === 'brookdale' ? '(Brookdale)' : '(UDel)'}`
    : null;

  // When searching, auto-expand all sections
  const isSearching = query.length > 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setQuery(''); setExpandedSections(new Set()); setExpandedReqs(new Set()); } }}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
          <SheetTitle className="text-lg font-bold text-slate-800">Add Course</SheetTitle>
          {semesterLabel && (
            <p className="text-sm text-slate-500 mt-0.5">
              Adding to <span className="font-medium text-slate-700">{semesterLabel}</span>
            </p>
          )}
        </SheetHeader>

        <div className="px-5 pt-4 pb-3 space-y-3">
          {/* School toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 gap-1">
            <button
              onClick={() => handleSchoolChange('udel')}
              className={cn(
                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-150',
                activeSchool === 'udel' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              UDel Courses
            </button>
            <button
              onClick={() => handleSchoolChange('brookdale')}
              className={cn(
                'flex-1 text-sm font-medium py-1.5 rounded-md transition-all duration-150',
                activeSchool === 'brookdale' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Brookdale Courses
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code or title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-sm border-slate-200 focus:border-blue-300"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {activeSchool === 'udel' ? (
            /* ====== UDel: requirement-organized view ====== */
            <div className="px-4 pb-5 space-y-1">
              {sections.map((section) => {
                const isSectionExpanded = isSearching || expandedSections.has(section.category);
                const completedReqs = section.requirements.filter(r => r.status === 'completed').length;
                const totalReqs = section.requirements.length;
                const allDone = completedReqs === totalReqs;

                return (
                  <div key={section.category} className="rounded-lg border border-slate-100 overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.category)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50',
                        allDone && 'bg-green-50/50'
                      )}
                    >
                      {isSectionExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                      <span className="text-sm font-semibold text-slate-700 flex-1">{section.label}</span>
                      <span className={cn('text-xs font-medium tabular-nums', allDone ? 'text-green-600' : completedReqs > 0 ? 'text-amber-600' : 'text-slate-400')}>
                        {completedReqs}/{totalReqs}
                      </span>
                    </button>

                    {isSectionExpanded && (
                      <div className="border-t border-slate-100">
                        {section.requirements.map((req) => {
                          const isReqExpanded = isSearching || expandedReqs.has(req.id);
                          const statusIcon = req.status === 'completed'
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            : req.status === 'in_progress'
                            ? <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            : <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />;

                          return (
                            <div key={req.id}>
                              <button
                                onClick={() => toggleReq(req.id)}
                                className={cn('w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-slate-50/80', req.status === 'completed' && 'bg-green-50/30')}
                              >
                                {statusIcon}
                                <span className={cn('flex-1 text-xs font-medium leading-tight', req.status === 'completed' ? 'text-green-700 line-through' : 'text-slate-600')}>
                                  {req.name}
                                </span>
                                {req.courses.length > 0 && (
                                  <>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 text-slate-400 border-slate-200">{req.courses.length}</Badge>
                                    {isReqExpanded ? <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" /> : <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />}
                                  </>
                                )}
                              </button>
                              {isReqExpanded && req.courses.length > 0 && (
                                <div className="px-4 pb-2 pl-9 space-y-1.5">
                                  {req.courses.map((course) => (
                                    <CourseButton key={course.id} course={course} onSelect={handleSelect} isPlanned={plannedSet.has(course.courseCode)} isCompleted={completedCodes.has(course.courseCode)} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Additional elective courses */}
              {electiveCourses.length > 0 && (
                <div className="rounded-lg border border-slate-100 overflow-hidden">
                  <button onClick={() => toggleSection('extra-electives')} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors">
                    {(isSearching || expandedSections.has('extra-electives')) ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                    <span className="text-sm font-semibold text-slate-700 flex-1">Additional Elective Courses</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 text-slate-400 border-slate-200">{electiveCourses.length}</Badge>
                  </button>
                  {(isSearching || expandedSections.has('extra-electives')) && (
                    <div className="border-t border-slate-100 px-4 py-2 space-y-1.5">
                      {electiveCourses.map(course => (
                        <CourseButton key={course.id} course={course} onSelect={handleSelect} isPlanned={plannedSet.has(course.courseCode)} isCompleted={completedCodes.has(course.courseCode)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <CustomCourseEntry school="udel" onAdd={handleSelect} />
            </div>
          ) : (
            /* ====== Brookdale: flat transfer mapping list ====== */
            <BrookdaleTransferList
              query={query}
              onSelect={handleSelect}
              plannedCodes={plannedSet}
              completedCodes={completedCodes}
            />
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
