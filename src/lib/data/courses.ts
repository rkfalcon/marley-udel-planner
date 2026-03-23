import { Course } from '../types';

// Courses relevant to Marley's degree requirements
export const COURSES: Course[] = [
  // === COGNITIVE SCIENCE CORE ===
  { id: 'c-1', school: 'udel', courseCode: 'CGSC 170', title: 'Introduction to Cognitive Science', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-2', school: 'udel', courseCode: 'LING 101', title: 'Introduction to Linguistics I', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group C', 'Multicultural', 'Social & Behavioral Sciences'] },
  { id: 'c-3', school: 'udel', courseCode: 'PSYC 100', title: 'General Psychology', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group C', 'Social & Behavioral Sciences'] },
  { id: 'c-4', school: 'udel', courseCode: 'BISC 104', title: 'Principles of Biology with Laboratory', credits: 4, typicallyOffered: 'Fall, Spring', attributes: ['Math, Natural Sciences & Technology'] },
  { id: 'c-5', school: 'udel', courseCode: 'BISC 207', title: 'Introductory Biology I', credits: 4, typicallyOffered: 'Fall, Spring' },

  // === COMPUTATIONAL OPTIONS ===
  { id: 'c-6', school: 'udel', courseCode: 'CISC 101', title: 'Principles of Computing in the era of AI', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-7', school: 'udel', courseCode: 'CISC 103', title: 'Intro to Computer Science with Web Applications', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-8', school: 'udel', courseCode: 'CISC 106', title: 'General Computer Science for Engineers and Scientists', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-9', school: 'udel', courseCode: 'CISC 108', title: 'Introduction to Computer Science I', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-10', school: 'udel', courseCode: 'CISC 181', title: 'Introduction to Computer Science II', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-11', school: 'udel', courseCode: 'LING 202', title: 'Science of Language', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-12', school: 'udel', courseCode: 'PHIL 205', title: 'Logic', credits: 3, typicallyOffered: 'Fall, Spring' },

  // === STATISTICS OPTIONS ===
  { id: 'c-13', school: 'udel', courseCode: 'MATH 202', title: 'Introduction to Statistical Methods II', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-14', school: 'udel', courseCode: 'MATH 205', title: 'Statistical Methods', credits: 4, typicallyOffered: 'Fall, Spring' },
  { id: 'c-15', school: 'udel', courseCode: 'PSYC 209', title: 'Measurement and Statistics', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-16', school: 'udel', courseCode: 'SOCI 301', title: 'Research Methods and Statistics', credits: 4, typicallyOffered: 'Fall, Spring' },
  { id: 'c-17', school: 'udel', courseCode: 'STAT 200', title: 'Basic Statistical Practice', credits: 3, typicallyOffered: 'Fall, Spring' },

  // === ADVANCED PSYC/CGSC OPTIONS ===
  { id: 'c-18', school: 'udel', courseCode: 'CGSC 410', title: 'Embodied Cognition', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-19', school: 'udel', courseCode: 'CGSC 420', title: 'Research Methods in Cognitive Science', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-20', school: 'udel', courseCode: 'CGSC 451', title: 'Topics in Cognitive Science', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-21', school: 'udel', courseCode: 'CGSC 470', title: 'Elements of Cognitive Science', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-22', school: 'udel', courseCode: 'PSYC 314', title: 'Brain and Behavior', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-23', school: 'udel', courseCode: 'PSYC 340', title: 'Cognition', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-24', school: 'udel', courseCode: 'PSYC 350', title: 'Developmental Psychology', credits: 3, typicallyOffered: 'Fall, Spring' },

  // === PPSLP CORE ===
  { id: 'c-25', school: 'udel', courseCode: 'CGSC 375', title: 'Introduction to Communication Disorders in Children', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-26', school: 'udel', courseCode: 'CGSC 376', title: 'Introduction to Communication Disorders of Adulthood', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-27', school: 'udel', courseCode: 'CGSC 378', title: 'Anatomy & Physiology of Speech, Language & Hearing', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-28', school: 'udel', courseCode: 'CGSC 379', title: 'Introduction to Audiology', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-29', school: 'udel', courseCode: 'LING 353', title: 'Introduction to Speech and Hearing Science', credits: 3, typicallyOffered: 'Fall' },

  // === PPSLP ELECTIVES ===
  { id: 'c-30', school: 'udel', courseCode: 'EDUC 462', title: 'Language Acquisition', credits: 4, typicallyOffered: 'Fall, Spring' },
  { id: 'c-31', school: 'udel', courseCode: 'LING 444', title: 'First Language Development', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-32', school: 'udel', courseCode: 'CGSC 433', title: 'Introduction to Acoustic Phonetics', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-33', school: 'udel', courseCode: 'LING 403', title: 'Introduction to Phonology', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-34', school: 'udel', courseCode: 'CGSC 496', title: 'Psycholinguistics', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-35', school: 'udel', courseCode: 'LING 480', title: 'Sociolinguistics', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-36', school: 'udel', courseCode: 'CGSC 365', title: 'Speech Sound Disorders', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-37', school: 'udel', courseCode: 'CGSC 380', title: 'Clinical Principles and Procedures in Speech Pathology', credits: 3, typicallyOffered: 'Spring', attributes: ['Capstone'] },

  // === MATH ===
  { id: 'c-38', school: 'udel', courseCode: 'MATH 115', title: 'Pre-Calculus', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-39', school: 'udel', courseCode: 'MATH 117', title: 'Pre-Calculus for Scientists and Engineers', credits: 4, typicallyOffered: 'Fall, Spring' },

  // === UNIVERSITY REQUIREMENTS ===
  { id: 'c-40', school: 'udel', courseCode: 'ENGL 110', title: 'First-Year Writing', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-41', school: 'udel', courseCode: 'UNIV 101', title: 'First Year Experience I', credits: 1, typicallyOffered: 'Fall' },
  { id: 'c-42', school: 'udel', courseCode: 'MUSC 101', title: 'Appreciation of Music', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group A', 'Creative Arts & Humanities'] },
  { id: 'c-43', school: 'udel', courseCode: 'ENGL 210', title: 'Introduction to Short Story', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group A', 'Creative Arts & Humanities'] },
  { id: 'c-44', school: 'udel', courseCode: 'HIST 105', title: 'U.S. History to 1865', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group B', 'History & Cultural Change'] },
  { id: 'c-45', school: 'udel', courseCode: 'HIST 225', title: 'Topics in History', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group B'] },
  { id: 'c-46', school: 'udel', courseCode: 'HDFS 201', title: 'Life Span Development', credits: 3, typicallyOffered: 'Fall, Spring' },

  // === COMMON ELECTIVES ===
  { id: 'c-47', school: 'udel', courseCode: 'COMM 100', title: 'Foundations of Communication', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-48', school: 'udel', courseCode: 'COMM 212', title: 'Public Speaking & Professional Presentation', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-49', school: 'udel', courseCode: 'SOCI 201', title: 'Introduction to Sociology', credits: 3, typicallyOffered: 'Fall, Spring', attributes: ['Group C'] },
  { id: 'c-50', school: 'udel', courseCode: 'PSYC 390', title: 'Social Psychology', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-51', school: 'udel', courseCode: 'PSYC 370', title: 'Research in Personality', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-52', school: 'udel', courseCode: 'HDFS 223', title: 'Foundations of Child Development', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-53', school: 'udel', courseCode: 'LING 102', title: 'Language, Mind and Society', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-54', school: 'udel', courseCode: 'LING 404', title: 'Structure of Language', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-55', school: 'udel', courseCode: 'LING 418', title: 'Meaning and Language Use', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-56', school: 'udel', courseCode: 'CGSC 327', title: 'Diversity, Ethics, and Society', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-57', school: 'udel', courseCode: 'CGSC 402', title: 'Neurobiology of Language', credits: 3, typicallyOffered: 'Spring', attributes: ['Capstone'] },
  { id: 'c-58', school: 'udel', courseCode: 'CGSC 485', title: 'Seminar in Cognitive Science', credits: 3, typicallyOffered: 'Fall', attributes: ['Capstone'] },
  { id: 'c-59', school: 'udel', courseCode: 'CGSC 490', title: 'Philosophy of Language', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-60', school: 'udel', courseCode: 'CGSC 421', title: 'Philosophy, Biology, Society', credits: 3, typicallyOffered: 'Spring' },
  { id: 'c-61', school: 'udel', courseCode: 'CGSC 404', title: 'Animal Minds', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-62', school: 'udel', courseCode: 'NSCI 320', title: 'Introduction to Neuroscience', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-63', school: 'udel', courseCode: 'ANTH 205', title: 'What is Human Nature?', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'c-64', school: 'udel', courseCode: 'PHIL 320', title: 'Theory of Knowledge', credits: 3, typicallyOffered: 'Fall' },
  { id: 'c-65', school: 'udel', courseCode: 'PHIL 330', title: 'Philosophy of Mind', credits: 3, typicallyOffered: 'Spring' },

  // === BROOKDALE CC COURSES (commonly transferable for elective credits) ===
  { id: 'bc-1', school: 'brookdale', courseCode: 'MATH 131', title: 'Statistics', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-2', school: 'brookdale', courseCode: 'ECON 225', title: 'Business Statistics', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-3', school: 'brookdale', courseCode: 'PSYC 247', title: 'Quantitative Methods in Psychology', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'bc-4', school: 'brookdale', courseCode: 'COMM 101', title: 'Communication', credits: 3, typicallyOffered: 'Fall, Spring, Summer, Winter' },
  { id: 'bc-5', school: 'brookdale', courseCode: 'SPCH 115', title: 'Public Speaking', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-6', school: 'brookdale', courseCode: 'SOCI 101', title: 'Principles of Sociology', credits: 3, typicallyOffered: 'Fall, Spring, Summer, Winter' },
  { id: 'bc-7', school: 'brookdale', courseCode: 'PSYC 206', title: 'Human Growth & Development I', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-8', school: 'brookdale', courseCode: 'PSYC 217', title: 'Social Psychology', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'bc-9', school: 'brookdale', courseCode: 'PSYC 105', title: 'Introduction to Psychology I', credits: 3, typicallyOffered: 'Fall, Spring, Summer, Winter' },
  { id: 'bc-10', school: 'brookdale', courseCode: 'PSYC 106', title: 'Introduction to Psychology II', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-11', school: 'brookdale', courseCode: 'ANTH 116', title: 'Intro to Physical Anthropology', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'bc-12', school: 'brookdale', courseCode: 'HESC 115', title: 'Nutrition and Health', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-13', school: 'brookdale', courseCode: 'PSYC 225', title: 'Human Sexuality', credits: 3, typicallyOffered: 'Fall, Spring' },
  { id: 'bc-14', school: 'brookdale', courseCode: 'ECON 107', title: 'Economics', credits: 3, typicallyOffered: 'Fall, Spring, Summer' },
  { id: 'bc-15', school: 'brookdale', courseCode: 'POLI 225', title: 'International Relations', credits: 3, typicallyOffered: 'Fall, Spring' },
];

export function getCourseByCode(code: string, school?: string): Course | undefined {
  return COURSES.find(c => c.courseCode === code && (!school || c.school === school));
}

export function searchCourses(query: string, school?: string): Course[] {
  const q = query.toLowerCase();
  return COURSES.filter(c => {
    const matchesSchool = !school || c.school === school;
    const matchesQuery =
      c.courseCode.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q);
    return matchesSchool && matchesQuery;
  });
}
