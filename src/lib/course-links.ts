import type { Course, PlanCourse } from './types';
import { CATALOG } from './data/catalog';
import { SLP_GRADUATE_COURSE_URLS } from './data/slp-graduate-course-urls';

export type LinkedCourse = Pick<PlanCourse, 'courseCode' | 'school' | 'program' | 'catalogUrl' | 'sourceUrls'>;

function safeUrl(value?: string) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : undefined; }
  catch { return undefined; }
}

export function courseLink(course: LinkedCourse, catalog: Course[], undergraduateCourses = CATALOG.courses) {
  const saved = safeUrl(course.catalogUrl) ?? course.sourceUrls?.map(safeUrl).find(url => url && /\/preview_course(?:_nopop)?\.php\?/.test(url));
  if (saved) return { href: saved, direct: true };
  const match = catalog.find(c => c.school === course.school && c.courseCode === course.courseCode);
  const published = safeUrl(match?.catalogUrl);
  if (published) return { href: published, direct: true };
  if (course.school === 'brookdale') {
    if (match && /^[A-Z]+ \d{3}$/.test(course.courseCode)) {
      return { href: `https://catalog.brookdalecc.edu/courses/${course.courseCode.replace(' ', '')}`, direct: true };
    }
    return { href: 'https://catalog.brookdalecc.edu/courses', direct: false };
  }
  const graduate = course.program === 'graduate' || Number(course.courseCode.match(/\b(\d{3})\b/)?.[1]) >= 600;
  if (graduate && SLP_GRADUATE_COURSE_URLS[course.courseCode]) {
    return { href: SLP_GRADUATE_COURSE_URLS[course.courseCode], direct: true };
  }
  const search = new URL(graduate ? 'https://catalog.udel.edu/content.php?catoid=96&navoid=35419' : undergraduateCourses);
  const [prefix, ...number] = course.courseCode.split(' ');
  search.searchParams.set('filter[27]', prefix);
  search.searchParams.set('filter[29]', number.join(' '));
  search.searchParams.set('filter[32]', '1');
  search.searchParams.set('cur_cat_oid', search.searchParams.get('catoid') ?? '97');
  search.searchParams.set('search_database', 'Filter');
  return { href: search.href, direct: false };
}
