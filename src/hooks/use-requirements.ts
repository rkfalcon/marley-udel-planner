'use client';

import { useMemo } from 'react';
import { REQUIREMENTS, REQUIREMENT_GROUPS } from '@/lib/data/requirements';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';
import { SECOND_WRITING_ALL_CODES } from '@/lib/data/second-writing-courses';
import { TRANSFER_MAPPINGS } from '@/lib/data/transfer-mappings';
import { RequirementWithStatus, RequirementGroup, CompletedCourse, PlanCourse } from '@/lib/types';

const secondWritingSet = new Set(SECOND_WRITING_ALL_CODES);

// Build a lookup: Brookdale course code → UDel equivalent course code
const brookdaleToUdel = new Map<string, string>();
for (const m of TRANSFER_MAPPINGS) {
  // For single-course mappings, map brookdale code → udel code
  if (m.brookdaleCourses.length === 1) {
    brookdaleToUdel.set(m.brookdaleCourses[0], m.udelCourseCode);
  }
  // For multi-course mappings, map each brookdale code → udel code
  for (const bc of m.brookdaleCourses) {
    if (!brookdaleToUdel.has(bc)) {
      brookdaleToUdel.set(bc, m.udelCourseCode);
    }
  }
}

// Given a course code (possibly Brookdale), get the UDel equivalent for requirement matching
function getUdelEquivalent(courseCode: string, school?: string): string {
  if (school === 'brookdale' || brookdaleToUdel.has(courseCode)) {
    return brookdaleToUdel.get(courseCode) || courseCode;
  }
  return courseCode;
}

function getRequirementStatus(
  req: typeof REQUIREMENTS[number],
  completedCourses: CompletedCourse[],
  plannedCourses: PlanCourse[] = []
): RequirementWithStatus {
  let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
  let fulfilledBy: CompletedCourse | PlanCourse | undefined;

  // Check completed/in-progress courses first
  for (const course of completedCourses) {
    const fulfillsThis = course.fulfillsRequirements?.includes(req.id);
    const matchesCourseOption = req.courseOptions?.includes(course.courseCode);
    // Special: second-writing can be fulfilled by any approved course
    const matchesSecondWriting = req.id === 'second-writing' && secondWritingSet.has(course.courseCode);

    if (fulfillsThis || matchesCourseOption || matchesSecondWriting) {
      if (course.status === 'completed' || course.status === 'transfer') {
        status = 'completed';
        fulfilledBy = course;
        break;
      } else if (course.status === 'in_progress') {
        status = 'in_progress';
        fulfilledBy = course;
      }
    }
  }

  // For credit-based requirements, check total credits
  if (req.fulfillmentType === 'credits') {
    const creditsEarned = completedCourses
      .filter(c => {
        const fulfillsThis = c.fulfillsRequirements?.includes(req.id);
        const matchesCourseOption = req.courseOptions?.includes(c.courseCode);
        return (fulfillsThis || matchesCourseOption) &&
          (c.status === 'completed' || c.status === 'transfer');
      })
      .reduce((sum, c) => sum + c.credits, 0);

    const creditsInProgress = completedCourses
      .filter(c => {
        const fulfillsThis = c.fulfillsRequirements?.includes(req.id);
        const matchesCourseOption = req.courseOptions?.includes(c.courseCode);
        return (fulfillsThis || matchesCourseOption) && c.status === 'in_progress';
      })
      .reduce((sum, c) => sum + c.credits, 0);

    // Also count planned course credits for credit-based reqs
    const creditsPlanned = plannedCourses
      .filter(c => req.courseOptions?.includes(c.courseCode))
      .reduce((sum, c) => sum + c.credits, 0);

    if (creditsEarned >= req.creditsRequired) {
      status = 'completed';
    } else if (creditsEarned + creditsInProgress >= req.creditsRequired) {
      status = 'in_progress';
    } else if (creditsEarned + creditsInProgress + creditsPlanned >= req.creditsRequired) {
      status = 'in_progress'; // planned courses bring it to threshold
    } else {
      status = creditsEarned > 0 || creditsPlanned > 0 ? 'in_progress' : 'not_started';
    }
  }

  // Check planned courses — if requirement not yet fulfilled, a planned course can mark it as in_progress
  if (status === 'not_started' || status === 'in_progress') {
    for (const course of plannedCourses) {
      const udelEquiv = getUdelEquivalent(course.courseCode, course.school);
      const matchesOption = req.courseOptions?.includes(course.courseCode) || req.courseOptions?.includes(udelEquiv);
      const matchesSW = req.id === 'second-writing' && (secondWritingSet.has(course.courseCode) || secondWritingSet.has(udelEquiv));
      // Manual override: course was explicitly marked as fulfilling this requirement (e.g. cross-listed courses)
      const matchesManual = course.fulfillsRequirements?.includes(req.id);
      if (matchesOption || matchesSW || matchesManual) {
        if (status === 'not_started') {
          status = 'in_progress'; // planned course counts as "in progress" toward fulfillment
        }
        if (!fulfilledBy) {
          fulfilledBy = course;
        }
        break;
      }
    }
  }

  return {
    ...req,
    status,
    fulfilledBy,
  };
}

export function useRequirements(plannedCourses: PlanCourse[] = []) {
  return useMemo(() => {
    // Calculate total credits from all sources
    const completedCredits = COMPLETED_COURSES
      .filter(c => c.status === 'completed' || c.status === 'transfer')
      .reduce((sum, c) => sum + c.credits, 0);
    const inProgressCredits = COMPLETED_COURSES
      .filter(c => c.status === 'in_progress')
      .reduce((sum, c) => sum + c.credits, 0);
    const plannedCredits = plannedCourses.reduce((sum, c) => sum + c.credits, 0);
    const totalAllCredits = completedCredits + inProgressCredits + plannedCredits;
    const creditsNeeded = Math.max(0, 124 - totalAllCredits);

    // Compute non-elective requirement credits (sum of all requirements except free-elective)
    const nonElectiveReqCredits = REQUIREMENTS
      .filter(r => r.id !== 'free-elective')
      .reduce((sum, r) => sum + r.creditsRequired, 0);

    // Free elective credits needed = 124 - non-elective requirement credits
    // This is the "gap" that must be filled by electives
    const freeElectiveCreditsRequired = Math.max(0, 124 - nonElectiveReqCredits);

    // Count how many elective credits are earned/planned (courses not fulfilling any other requirement)
    // For simplicity, elective credits = total credits - credits from requirement-fulfilling courses
    const electiveCreditsEarned = COMPLETED_COURSES
      .filter(c => c.fulfillsRequirements?.includes('free-elective') && (c.status === 'completed' || c.status === 'transfer'))
      .reduce((sum, c) => sum + c.credits, 0);
    const electiveCreditsInProgress = COMPLETED_COURSES
      .filter(c => c.fulfillsRequirements?.includes('free-elective') && c.status === 'in_progress')
      .reduce((sum, c) => sum + c.credits, 0);
    // Planned elective credits = planned courses that don't fulfill any specific requirement
    // (i.e., courses from the "Additional Elective Courses" section or custom courses)
    const plannedElectiveCredits = plannedCourses
      .filter(c => {
        // Check if this course fulfills any non-elective requirement
        const udelEquiv = getUdelEquivalent(c.courseCode, c.school);
        for (const req of REQUIREMENTS) {
          if (req.id === 'free-elective') continue;
          if (req.courseOptions?.includes(c.courseCode) || req.courseOptions?.includes(udelEquiv)) return false;
          if (req.id === 'second-writing' && (secondWritingSet.has(c.courseCode) || secondWritingSet.has(udelEquiv))) return false;
        }
        return true; // This is a pure elective
      })
      .reduce((sum, c) => sum + c.credits, 0);

    const totalElectiveCredits = electiveCreditsEarned + electiveCreditsInProgress + plannedElectiveCredits;

    const requirementsWithStatus = REQUIREMENTS.map(req => {
      if (req.id === 'free-elective') {
        // Dynamic elective requirement
        const dynamicReq = {
          ...req,
          creditsRequired: freeElectiveCreditsRequired,
          description: `${creditsNeeded} more credits needed to reach 124 total (${totalElectiveCredits} elective credits earned/planned)`,
        };

        let electiveStatus: 'completed' | 'in_progress' | 'not_started' = 'not_started';
        if (totalAllCredits >= 124) {
          electiveStatus = 'completed';
        } else if (totalElectiveCredits > 0) {
          electiveStatus = 'in_progress';
        }

        return {
          ...dynamicReq,
          status: electiveStatus,
          fulfilledBy: undefined,
        } as RequirementWithStatus;
      }
      return getRequirementStatus(req, COMPLETED_COURSES, plannedCourses);
    });

    const groups: RequirementGroup[] = REQUIREMENT_GROUPS.map(group => {
      const reqs = requirementsWithStatus
        .filter(r => r.category === group.category)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const completedCount = reqs.filter(r => r.status === 'completed').length;
      // fulfilledCount = completed + in_progress that have a fulfilledBy course (i.e., a course is assigned)
      const fulfilledCount = reqs.filter(r => r.status === 'completed' || (r.status === 'in_progress' && r.fulfilledBy)).length;
      const totalCount = reqs.length;
      const completedCredits = reqs
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.creditsRequired, 0);
      const fulfilledCredits = reqs
        .filter(r => r.status === 'completed' || (r.status === 'in_progress' && r.fulfilledBy))
        .reduce((sum, r) => sum + r.creditsRequired, 0);
      const totalCredits = reqs.reduce((sum, r) => sum + r.creditsRequired, 0);

      return {
        ...group,
        requirements: reqs,
        completedCount,
        fulfilledCount,
        totalCount,
        completedCredits,
        fulfilledCredits,
        totalCredits,
      };
    });

    const totalCompleted = requirementsWithStatus.filter(r => r.status === 'completed').length;
    const totalFulfilled = requirementsWithStatus.filter(r => r.status === 'completed' || (r.status === 'in_progress' && r.fulfilledBy)).length;
    const totalInProgress = requirementsWithStatus.filter(r => r.status === 'in_progress').length;
    const totalNotStarted = requirementsWithStatus.filter(r => r.status === 'not_started').length;

    return {
      groups,
      requirementsWithStatus,
      totalCompleted,
      totalFulfilled,
      totalInProgress,
      totalNotStarted,
      totalRequirements: requirementsWithStatus.length,
    };
  }, [plannedCourses]);
}
