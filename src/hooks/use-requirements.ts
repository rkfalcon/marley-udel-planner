'use client';

import { useMemo } from 'react';
import { REQUIREMENTS, REQUIREMENT_GROUPS } from '@/lib/data/requirements';
import { COMPLETED_COURSES } from '@/lib/data/marley-progress';
import { RequirementWithStatus, RequirementGroup, CompletedCourse, PlanCourse } from '@/lib/types';

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

    if (fulfillsThis || matchesCourseOption) {
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
      if (req.courseOptions?.includes(course.courseCode)) {
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
    const requirementsWithStatus = REQUIREMENTS.map(req =>
      getRequirementStatus(req, COMPLETED_COURSES, plannedCourses)
    );

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
