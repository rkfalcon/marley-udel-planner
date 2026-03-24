export type CourseStatus = 'completed' | 'in_progress' | 'planned' | 'transfer';

export type School = 'udel' | 'brookdale';

export type RequirementCategory =
  | 'university'
  | 'college'
  | 'major_core'
  | 'ppslp'
  | 'elective';

export type FulfillmentType = 'all' | 'any' | 'credits';

export type Term = 'Fall' | 'Winter' | 'Spring' | 'Summer';

export interface Course {
  id: string;
  school: School;
  courseCode: string;
  title: string;
  credits: number;
  description?: string;
  attributes?: string[];
  prerequisites?: string;
  typicallyOffered?: string;
}

export interface TransferMapping {
  id: string;
  brookdaleCourses: string[];
  brookdaleTitles: string[];
  udelCourseCode: string;
  udelTitle: string;
  lastReviewed?: number;
  notes?: string;
}

export interface Requirement {
  id: string;
  category: RequirementCategory;
  subcategory?: string;
  name: string;
  description?: string;
  creditsRequired: number;
  fulfillmentType: FulfillmentType;
  parentId?: string;
  sortOrder: number;
  courseOptions?: string[]; // course codes that can fulfill this
  isRequired?: boolean; // if true, specific course is mandatory
}

export interface CompletedCourse {
  courseCode: string;
  title: string;
  credits: number;
  grade?: string;
  status: CourseStatus;
  term: Term;
  year: number;
  school: School;
  fulfillsRequirements?: string[]; // requirement IDs
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  slug: string;
  targetGraduation: string;
  isEarlyGraduation: boolean;
  createdAt: string;
  updatedAt: string;
  semesters: PlanSemester[];
}

export interface PlanSemester {
  id: string;
  planId: string;
  term: Term;
  year: number;
  school: School;
  sortOrder: number;
  courses: PlanCourse[];
}

export interface PlanCourse {
  id: string;
  planSemesterId: string;
  courseCode: string;
  title: string;
  school: School;
  credits: number;
  status: CourseStatus;
  grade?: string;
  fulfillsRequirementId?: string;
  notes?: string;
}

export interface RequirementWithStatus extends Requirement {
  status: 'completed' | 'in_progress' | 'not_started';
  fulfilledBy?: CompletedCourse | PlanCourse;
  children?: RequirementWithStatus[];
}

export interface RequirementGroup {
  category: RequirementCategory;
  label: string;
  description: string;
  requirements: RequirementWithStatus[];
  completedCount: number;
  fulfilledCount: number;
  totalCount: number;
  completedCredits: number;
  fulfilledCredits: number;
  totalCredits: number;
}
