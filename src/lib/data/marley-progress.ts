import { CompletedCourse } from '../types';

export const MARLEY_PROFILE = {
  name: 'Marley Falcon',
  studentId: '702786791',
  level: 'Sophomore',
  campus: 'Newark',
  advisor: 'Tessa Hayman',
  major: 'Cognitive Science (BS)',
  specialization: 'Pre-Professional Speech-Language Pathology',
  catalogTerm: 'Fall 2025',
  cgpa: 3.641,
  pgpa: 3.667,
  totalCreditsRequired: 124,
};

export const COMPLETED_COURSES: CompletedCourse[] = [
  // Fall 2025 - At UDel
  {
    courseCode: 'LING 101',
    title: 'Introduction to Linguistics I',
    credits: 3,
    grade: 'A-',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['major-core-ling101', 'breadth-c', 'univ-breadth-social', 'multicultural'],
  },
  {
    courseCode: 'PSYC 100',
    title: 'General Psychology',
    credits: 3,
    grade: 'A',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['major-core-psyc100', 'breadth-c'],
  },
  {
    courseCode: 'BISC 104',
    title: 'Principles of Biology with Laboratory',
    credits: 4,
    grade: 'B+',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['major-core-bio', 'univ-breadth-math-sci'],
  },
  {
    courseCode: 'MUSC 101',
    title: 'Appreciation of Music',
    credits: 3,
    grade: 'A-',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['breadth-a'],
  },
  {
    courseCode: 'UNIV 101',
    title: 'First Year Experience I',
    credits: 1,
    grade: 'P',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['fys'],
  },
  {
    courseCode: 'UNIV 166DE',
    title: 'Department Elective',
    credits: 3,
    grade: 'CR',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['free-elective'],
  },
  // Transfer Credits
  // Prior transfer credits — taken at Brookdale before starting at UDel (Summer 2024)
  {
    courseCode: 'ENGL 210',
    title: 'Introduction to Short Story',
    credits: 3,
    grade: 'T',
    status: 'transfer',
    term: 'Summer' as const,
    year: 2024,
    school: 'brookdale',
    fulfillsRequirements: ['breadth-a', 'univ-breadth-creative'],
  },
  {
    courseCode: 'ENGL 166T',
    title: 'Transfer Elective',
    credits: 3,
    grade: 'T',
    status: 'transfer',
    term: 'Summer' as const,
    year: 2024,
    school: 'brookdale',
    fulfillsRequirements: ['free-elective'],
  },
  {
    courseCode: 'HIST 166DE',
    title: 'Department Elective',
    credits: 3,
    grade: 'T',
    status: 'transfer',
    term: 'Summer' as const,
    year: 2024,
    school: 'brookdale',
    fulfillsRequirements: ['free-elective'],
  },
  {
    courseCode: 'HIST 225',
    title: 'Topics in History',
    credits: 3,
    grade: 'T',
    status: 'transfer',
    term: 'Summer' as const,
    year: 2024,
    school: 'brookdale',
    fulfillsRequirements: ['breadth-b'],
  },
  // HIST 105 — taken at Brookdale during Winter 2025
  {
    courseCode: 'HIST 105',
    title: 'U.S. History to 1865',
    credits: 3,
    grade: 'T',
    status: 'transfer',
    term: 'Winter',
    year: 2025,
    school: 'brookdale',
    fulfillsRequirements: ['breadth-b', 'univ-breadth-history'],
  },
  {
    courseCode: 'SPAN 107EX',
    title: 'SPAN107 Exemption',
    credits: 0,
    grade: 'T',
    status: 'completed',
    term: 'Fall',
    year: 2025,
    school: 'udel',
    fulfillsRequirements: ['foreign-language'],
  },
  // Spring 2026 - In Progress
  {
    courseCode: 'CGSC 170',
    title: 'Introduction to Cognitive Science',
    credits: 3,
    status: 'in_progress',
    term: 'Spring',
    year: 2026,
    school: 'udel',
    fulfillsRequirements: ['major-core-cgsc170'],
  },
  {
    courseCode: 'LING 202',
    title: 'Science of Language',
    credits: 3,
    status: 'in_progress',
    term: 'Spring',
    year: 2026,
    school: 'udel',
    fulfillsRequirements: ['major-core-computational'],
  },
  {
    courseCode: 'MATH 115',
    title: 'Pre-Calculus',
    credits: 3,
    status: 'in_progress',
    term: 'Spring',
    year: 2026,
    school: 'udel',
    fulfillsRequirements: ['college-math'],
  },
  {
    courseCode: 'ENGL 110',
    title: 'First-Year Writing',
    credits: 3,
    status: 'in_progress',
    term: 'Spring',
    year: 2026,
    school: 'udel',
    fulfillsRequirements: ['engl110'],
  },
  {
    courseCode: 'HDFS 201',
    title: 'Life Span Development',
    credits: 3,
    status: 'in_progress',
    term: 'Spring',
    year: 2026,
    school: 'udel',
    fulfillsRequirements: ['free-elective'],
  },
];

export function getCreditsCompleted(): number {
  return COMPLETED_COURSES
    .filter(c => c.status === 'completed' || c.status === 'transfer')
    .reduce((sum, c) => sum + c.credits, 0);
}

export function getCreditsInProgress(): number {
  return COMPLETED_COURSES
    .filter(c => c.status === 'in_progress')
    .reduce((sum, c) => sum + c.credits, 0);
}

export function getTotalCreditsEarned(): number {
  return getCreditsCompleted() + getCreditsInProgress();
}

export function getCreditsRemaining(): number {
  return Math.max(0, MARLEY_PROFILE.totalCreditsRequired - getTotalCreditsEarned());
}
