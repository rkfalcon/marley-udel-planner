/** Build a reviewable copy only; never writes to the source plan or database. */
import fs from 'node:fs';
import { reconcilePlan } from '../src/lib/academic-record';
import { clonePathway, pathwayAudit } from '../src/lib/complete-slp';
import { suggestedRequirements } from '../src/lib/requirement-evaluation';
import { MARLEY_PROFILE } from '../src/lib/data/marley-progress';
import type { Plan, Course, Term, PlanCourse } from '../src/lib/types';
const folder='output/complete-slp';
const source:Plan=JSON.parse(fs.readFileSync(`${folder}/source.json`,'utf8'));
const savedClone:Plan=JSON.parse(fs.readFileSync(`${folder}/clone.json`,'utf8'));
if(source.slug===savedClone.slug)throw Error('A distinct clone is required.');
const record=JSON.parse(fs.readFileSync(`${folder}/record.json`,'utf8'));
const catalog:Course[]=JSON.parse(fs.readFileSync('/tmp/marley-catalog-published.json','utf8')).courses;
const plan=reconcilePlan(clonePathway(source,savedClone.id,savedClone.slug),record.courses);
plan.name=savedClone.name;plan.createdAt=savedClone.createdAt;plan.updatedAt=new Date().toISOString();plan.targetGraduation='Fall 2028';
const gradProgram='https://catalog.udel.edu/preview_program.php?catoid=96&poid=96141';
const sequence='https://www.udel.edu/content/dam/udelImages/chs/Documents/CSCD/CHS-CSCD-UDCSCD-Plan_of_Study.pdf';
const notes=[
 'Proposed advising roadmap, not a registration guarantee or admission/degree decision. Future course sections and the 2028–2030 cohort sequence are not yet confirmed.',
 'Spring 2028 course-requirement completion and 109-credit transition are separate from the Fall 2028 BS award target. BS award depends on successful Fall coursework and authorization to share 15 credits while still an undergraduate.',
 'The current 2026–2027 MA catalog requires 60 credits. The department-linked 2025–2027 sequence lists CSCD610 as 2 credits plus CSCD710 (1). This plan follows the current catalog: CSCD610 is 3 credits; CSCD710 is not in the core and is omitted.',
 'CSCD615: department sequence places it in winter, but the current course catalog says typically fall. Winter 2029 placement is provisional; ask the director to reconcile this before registration.',
 'CSCD650 is included alongside each CSCD651 enrollment. CSCD750 is included alongside CSCD751 in Fall 2029 and Spring 2030, plus the winter seminar shown in the department sequence. The program policy explicitly schedules Winter-2 CSCD750, although the course catalog lists a CSCD751 corequisite; confirm registration handling with the director.',
 'Shared candidates: all 15 credits in Fall 2028, course level 600+. Policy eligibility is supported by the 3+2 catalog; individual allocation and course sharing still need advisor approval; the program policy explicitly places the BS award after successful Fall year-4 completion. They are stored once, with proposed BS applicability.',
 'Overall GPA 3.641 and program GPA 3.667 are preserved from the existing profile as historical reported values, not current verified application GPAs. Confirm that program GPA equals the required Cognitive Science major GPA. Missing grades prevent an independent current GPA audit.',
 'Before MA entry: confirm the four prerequisite subject areas, chemistry/physics certification preparation, and 25 signed clinical observation hours. Major and concentration grades must meet catalog minimums; inherited requirement statuses do not independently verify all grades.',
 'Non-thesis MA track. Required practicum credits: CSCD651 8, CSCD751 8; CSCD780 2. Before CSCD751: complete 8 CSCD651 credits (approximately 100 direct clinical hours). Before graduation: 375 approved direct hours, all knowledge/skills competencies, clinical exit verification, and the comprehensive project/presentation. Program policy limits simulation to 75 and telepractice to 125 of the direct hours. These remain unverified, separate from credits. Graduate GPA/grade and standing rules require program review. Post-degree clinical fellowship/licensure is not an MA semester in this plan.',
 'Winter year labels follow the app convention: Winter 2028 is calendar January 2029; Winter 2029 is calendar January 2030.',
 'No extra undergraduate summer/winter classes are needed in this proposal. Seven clinically relevant elective selections supply the credits still necessary to reach 109, rather than credits beyond that minimum.',
];
plan.pathway={type:'3+2-slp',sourceSlug:source.slug,catalogYear:'2026–2027',bsAward:'Fall 2028',maAward:'Spring 2030',sharedApproval:false,graduateRequirements:[],notes,profileSnapshot:{...MARLEY_PROFILE}};
function add(term:Term,year:number,course:Omit<PlanCourse,'id'|'planSemesterId'>){
 let semester=plan.semesters.find(s=>s.term===term&&s.year===year&&s.school==='udel');
 if(!semester){semester={id:`${plan.id}-${term}-${year}`,planId:plan.id,term,year,school:'udel',sortOrder:plan.semesters.length,courses:[]};plan.semesters.push(semester);}
 if(semester.courses.some(c=>c.courseCode===course.courseCode))throw Error(`Duplicate enrollment ${course.courseCode} ${term} ${year}`);
 semester.courses.push({...course,id:`${semester.id}-${course.courseCode.replace(/ /g,'-')}`,planSemesterId:semester.id});
}
const ug:[Term,number,string,string][]=[
 ['Spring',2027,'CGSC 378','SLP anatomy requirement; CGSC350 is scheduled for completion in Fall 2026.'],
 ['Spring',2027,'LING 480','SLP restricted elective; spring offering and LING101 prerequisite already completed.'],
 ['Spring',2027,'CHEM 101','Physical-science preparation for SLP certification; contributes necessary BS elective credit. No lab is assumed necessary for this certification subject area.'],
 ['Spring',2027,'PSYC 325','Child development background for pediatric clinical work; necessary BS elective credit.'],
 ['Spring',2027,'ENGL 312','Second Writing requirement and professional written communication; ENGL110 already completed.'],
 ['Fall',2027,'CGSC 379','SLP audiology requirement; catalog indicates fall offering.'],
 ['Fall',2027,'CGSC 402','Advanced Cognition requirement; neurobiology preparation for MA coursework.'],
 ['Fall',2027,'PSYC 334','Mental-health literacy for clinical populations; necessary BS elective credit.'],
 ['Fall',2027,'ASLC 105','Visual communication and Deaf cultural awareness; necessary BS elective credit.'],
 ['Fall',2027,'HDFS 202','Family diversity and culturally responsive care; necessary BS elective credit and prerequisite for HDFS328.'],
 ['Spring',2028,'CGSC 380','SLP concentration capstone and university capstone; completes clinical undergraduate preparation.'],
 ['Spring',2028,'HLTH 241','Healthcare ethics preparation; necessary BS elective credit.'],
 ['Spring',2028,'HDFS 328','Research literacy preparation; necessary BS elective credit. HDFS201 complete and HDFS202 planned in Fall 2027.'],
 ['Spring',2028,'HDFS 330','Helping relationships and counseling communication; necessary BS elective credit.'],
];
for(const [term,year,code,rationale] of ug){
 const c=catalog.find(c=>c.courseCode===code&&c.school==='udel');if(!c)throw Error(`Missing catalog course ${code}`);
 const reqs=suggestedRequirements(c);
 add(term,year,{courseCode:code,title:c.title,credits:c.credits,school:'udel',status:'planned',program:'undergraduate',fulfillsRequirements:reqs,prerequisites:c.prerequisites??'No formal prerequisite listed in the imported catalog; confirm restrictions.',sourceUrls:[c.catalogUrl!],verification:`2026–2027 course metadata verified. Typically offered: ${c.typicallyOffered??'not specified'}. Future section availability unconfirmed.`,rationale,requirementRole:reqs.some(r=>r.startsWith('ppslp')||r==='major-core-advanced'||r==='second-writing')?'required':'elective',courseKind:'academic'});
}
// Current catalog core and credits; repeat enrollments reflect the department sequence.
const definitions:Record<number,[string,number,string,PlanCourse['courseKind']]>={
610:['Introduction to Clinical Assessment',3,'694033','academic'],611:['Language Disorders in Children (Birth to 5)',3,'694034','academic'],612:['Acquired Language Disorders',3,'694035','academic'],613:['Speech Sound Disorders',3,'694036','academic'],615:['Cultural Humility in Clinical Practice',2,'696691','academic'],620:['Professional Practice in Speech-Language Pathology',2,'694037','academic'],621:['Fluency Disorders',2,'694038','academic'],622:['Language Disorders in Children—School Age',3,'694039','academic'],623:['Acquired Cognitive-Communication Disorders',3,'694040','academic'],624:['Dysphagia',2,'694041','academic'],625:['Voice and Resonance Disorders',3,'694042','academic'],626:['Augmentative and Alternative Communication',2,'696845','academic'],627:['Communication in Autism Spectrum Disorders',1,'694044','academic'],628:['Aural Rehabilitation',2,'694045','academic'],629:['Clinical Grand Rounds',1,'696887','academic'],650:['Clinical Practicum Seminar',0,'696556','seminar'],651:['Clinical Practicum',1,'694047','clinical'],665:['Counseling Skills for Speech-Language Pathologists',1,'696462','academic'],711:['Neurogenic Disorders of Speech',2,'694048','academic'],713:['Seminar: Special Topics',1,'694046','academic'],715:['Interprofessional Practice in a Specialty Area',1,'697000','academic'],716:['Complex Cases',1,'697001','academic'],717:['Management of Individuals with Voice and Resonance Disorders',1,'696999','academic'],750:['Advanced Clinical Practicum Seminar',0,'694051','seminar'],751:['Advanced Clinical Practicum',4,'694052','clinical'],780:['Comprehensive Academic-Clinical Project',1,'694053','project']};
const grad:[Term,number,(number|[number,number])[]][]=[
 ['Fall',2028,[610,611,612,613,627,629,650,[651,1]]],
 ['Winter',2028,[615,620,650,[651,1]]],
 ['Spring',2029,[625,621,622,623,650,[651,3],711]],
 ['Summer',2029,[624,626,650,[651,3]]],
 ['Fall',2029,[665,715,717,750,[751,4],780]],
 ['Winter',2029,[750]],
 ['Spring',2030,[628,716,713,750,[751,4],780]],
];
for(const [term,year,rows] of grad)for(const row of rows){
 const number=Array.isArray(row)?row[0]:row;const [title,baseCredits,coid,kind]=definitions[number];const credits=Array.isArray(row)?row[1]:baseCredits;
 const code=`CSCD ${number}`;
 const conflict=number===615?'Winter placement conflicts with catalog typical Fall offering; director confirmation needed.':number===750&&term==='Winter'?'PDF winter seminar conflicts with CSCD751 corequisite timing; director confirmation needed.':number===610?'Current catalog 3 credits supersedes older PDF 2 credits + CSCD710.':'Course/credits verified in 2026–2027 catalog; semester follows department sequence, pending 2028 cohort confirmation.';
 add(term,year,{courseCode:code,title,credits,school:'udel',status:'planned',program:'graduate',sharedBsCredits:term==='Fall'&&year===2028?credits:0,fulfillsRequirements:[],requirementRole:'required',courseKind:kind,sourceUrls:[`https://catalog.udel.edu/preview_course_nopop.php?catoid=96&coid=${coid}`,gradProgram,sequence],prerequisites:number===751?'CSCD651; admission and clinical placement clearance.':'No course-specific prerequisite listed; MA admission/enrollment restrictions apply.',corequisites:number===650?'CSCD651':number===750?'CSCD751':number===751?'CSCD750':number===651?'CSCD650 (paired seminar)':'No additional course corequisite listed.',verification:conflict,rationale:kind==='clinical'?'Required supervised clinical experience.':kind==='project'?'Required MA comprehensive academic-clinical project.':'Required non-thesis MA curriculum.'});
}
for(const number of Object.keys(definitions).map(Number)){
 const cs=plan.semesters.flatMap(s=>s.courses).filter(c=>c.program==='graduate'&&c.courseCode===`CSCD ${number}`);
 plan.pathway.graduateRequirements.push({code:`CSCD ${number}`,credits:cs.reduce((n,c)=>n+c.credits,0),occurrences:cs.length});
}
plan.semesters.sort((a,b)=>(a.year*12+({Spring:3,Summer:6,Fall:9,Winter:13}[a.term]))-(b.year*12+({Spring:3,Summer:6,Fall:9,Winter:13}[b.term])));
const audit=pathwayAudit(plan);
if(audit.undergraduateCredits!==109||audit.maCredits!==60||audit.shared!==15||audit.uniqueCredits!==169||audit.bsRequirements.totalFulfilled!==audit.bsRequirements.totalRequirements)throw Error(JSON.stringify({ug:audit.undergraduateCredits,ma:audit.maCredits,shared:audit.shared,requirements:audit.bsRequirements.requirementsWithStatus.filter(r=>!r.projectedFulfilled)}));
fs.writeFileSync(`${folder}/populated.json`,JSON.stringify(plan,null,2));
console.log(JSON.stringify({slug:plan.slug,ug:audit.undergraduateCredits,bs:audit.bsProjected,ma:audit.maCredits,shared:audit.shared,unique:audit.uniqueCredits,requirements:audit.bsRequirements.totalFulfilled,gradRequirements:audit.graduateRequirements.length}));
