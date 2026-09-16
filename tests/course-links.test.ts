import test from 'node:test';
import assert from 'node:assert/strict';
import { courseLink } from '../src/lib/course-links';
import type { Course } from '../src/lib/types';
const undergraduate:Course={id:'378',school:'udel',courseCode:'CGSC 378',title:'Anatomy',credits:3,catalogUrl:'https://catalog.udel.edu/preview_course_nopop.php?catoid=97&coid=698412'};

test('existing and newly selected undergraduate courses use their exact catalog page',()=>{
 assert.equal(courseLink({school:'udel',courseCode:'CGSC 378'},[undergraduate]).href,undergraduate.catalogUrl);
 assert.equal(courseLink({school:'udel',courseCode:'CGSC 378',catalogUrl:undergraduate.catalogUrl},[]).href,undergraduate.catalogUrl);
});
test('graduate courses use the graduate catalog and retain saved year-specific URLs',()=>{
 const grad=courseLink({school:'udel',courseCode:'CSCD 610',program:'graduate'},[]);
 assert.equal(grad.href,'https://catalog.udel.edu/preview_course_nopop.php?catoid=96&coid=694033');
 const saved='https://catalog.udel.edu/preview_course_nopop.php?catoid=96&coid=694033';
 assert.equal(courseLink({school:'udel',courseCode:'CSCD 610',sourceUrls:[saved]},[]).href,saved);
});
test('unmatched courses use the correct catalog search, not a fabricated course ID',()=>{
 const result=courseLink({school:'udel',courseCode:'CSCD 999',program:'graduate'},[]);
 assert.equal(result.direct,false);assert.equal(new URL(result.href).searchParams.get('catoid'),'96');
 assert.equal(new URL(result.href).searchParams.get('filter[29]'),'999');
 const exemption=courseLink({school:'udel',courseCode:'SPAN 107EX'},[]);
 assert.equal(exemption.direct,false);assert.equal(new URL(exemption.href).searchParams.get('catoid'),'97');
});
test('unsafe URLs cannot become course links',()=>{
 const result=courseLink({school:'udel',courseCode:'CGSC 378',catalogUrl:'javascript:alert(1)'},[undergraduate]);
 assert.equal(result.href,undergraduate.catalogUrl);
});
