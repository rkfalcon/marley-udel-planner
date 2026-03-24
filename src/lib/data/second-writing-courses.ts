// All courses approved for the CAS Second Writing Requirement
// Source: https://catalog.udel.edu/preview_program.php?catoid=90&poid=78217
// Must be taken after 60 credits earned, at UDel (not transferable from Brookdale)
// Note: No Brookdale CC transfer courses map to Second Writing approved courses —
// all 385 approved courses are 200+ level UDel courses, and Brookdale transfers
// mostly map to intro-level courses that aren't on the approved list.

export interface SecondWritingCourse {
  code: string;
  title: string;
  credits: number;
  department: string;
}

// Curated list of most relevant courses for a CGSC/PPSLP student,
// plus representative options from each department
export const SECOND_WRITING_COURSES: SecondWritingCourse[] = [
  // === Highly Relevant to CGSC / SLP ===
  { code: 'CGSC 420', title: 'Research Methods in Cognitive Science', credits: 3, department: 'Cognitive Science' },
  { code: 'CGSC 485', title: 'Seminar in Cognitive Science', credits: 3, department: 'Cognitive Science' },
  { code: 'PSYC 314', title: 'Brain and Behavior', credits: 3, department: 'Psychology' },
  { code: 'PSYC 340', title: 'Cognition', credits: 3, department: 'Psychology' },
  { code: 'PSYC 350', title: 'Developmental Psychology', credits: 3, department: 'Psychology' },
  { code: 'PSYC 380', title: 'Psychopathology', credits: 3, department: 'Psychology' },
  { code: 'PSYC 394', title: 'Cultural Psychology', credits: 3, department: 'Psychology' },
  { code: 'PSYC 402', title: 'Mindfulness and the Brain', credits: 3, department: 'Psychology' },
  { code: 'PSYC 405', title: 'Advanced Research Methods', credits: 3, department: 'Psychology' },
  { code: 'PSYC 414', title: 'Drugs and the Brain', credits: 3, department: 'Psychology' },
  { code: 'PSYC 415', title: 'History and Systems of Psychology', credits: 3, department: 'Psychology' },
  { code: 'PSYC 420', title: 'Psychotherapy: Historical Perspectives', credits: 3, department: 'Psychology' },
  { code: 'PSYC 425', title: 'Family Conflict and the Child', credits: 3, department: 'Psychology' },
  { code: 'PSYC 445', title: 'Adolescence', credits: 3, department: 'Psychology' },
  { code: 'PSYC 492', title: 'Prejudice, Stereotyping, and Discrimination', credits: 3, department: 'Psychology' },
  { code: 'NSCI 407', title: 'Hands-on Neuroscience', credits: 3, department: 'Neuroscience' },
  { code: 'NSCI 442', title: 'Social Neuroscience', credits: 3, department: 'Neuroscience' },
  { code: 'COMM 417', title: 'Communication and Management of Conflict', credits: 3, department: 'Communication' },
  { code: 'COMM 452', title: 'Communication and Persuasion', credits: 3, department: 'Communication' },
  { code: 'COMM 485', title: 'Analysis of Face-to-Face Communication', credits: 3, department: 'Communication' },

  // === Other Popular Options ===
  { code: 'ENGL 280', title: 'Approaches to Literature for Non-Majors', credits: 3, department: 'English' },
  { code: 'ENGL 301', title: 'Advanced Writing', credits: 3, department: 'English' },
  { code: 'ENGL 312', title: 'Written Communications in Business', credits: 3, department: 'English' },
  { code: 'ENGL 324', title: 'Shakespeare', credits: 3, department: 'English' },
  { code: 'HIST 300', title: 'Women in American History', credits: 3, department: 'History' },
  { code: 'HIST 314', title: 'The United States, 1914-1945', credits: 3, department: 'History' },
  { code: 'HIST 382', title: 'History of Medicine', credits: 3, department: 'History' },
  { code: 'HIST 394', title: 'Health Activism', credits: 3, department: 'History' },
  { code: 'SOCI 305', title: 'Social Class and Inequality', credits: 3, department: 'Sociology' },
  { code: 'SOCI 407', title: 'Sociology of Sex and Gender', credits: 3, department: 'Sociology' },
  { code: 'SOCI 433', title: 'Gender and Health', credits: 3, department: 'Sociology' },
  { code: 'PHIL 444', title: 'Medical Ethics', credits: 3, department: 'Philosophy' },
  { code: 'POSC 380', title: 'Introduction to Law', credits: 3, department: 'Political Science' },
  { code: 'CRJU 312', title: 'History of Crime and Criminal Justice', credits: 3, department: 'Criminal Justice' },
  { code: 'ARSC 316', title: 'Peer Tutoring/Advanced Composition', credits: 3, department: 'Arts & Sciences' },
];

// All department codes that have approved second writing courses
export const SECOND_WRITING_ALL_CODES = [
  'AFRA 250','AFRA 304','AFRA 305','AFRA 306','AFRA 314','AFRA 325','AFRA 329','AFRA 363','AFRA 370','AFRA 398','AFRA 421','AFRA 434','AFRA 440','AFRA 442','AFRA 443','AFRA 445','AFRA 484',
  'ANTH 326','ANTH 486','ANTH 487','ANTH 488','ANTH 489',
  'ART 315','ART 324',
  'ARTH 301','ARTH 302','ARTH 303','ARTH 310','ARTH 311','ARTH 314','ARTH 320','ARTH 323','ARTH 332','ARTH 333','ARTH 334','ARTH 335','ARTH 380','ARTH 402','ARTH 403','ARTH 405','ARTH 406','ARTH 413','ARTH 417','ARTH 419','ARTH 423','ARTH 429','ARTH 431','ARTH 433','ARTH 435','ARTH 440','ARTH 444','ARTH 445','ARTH 456',
  'ARSC 316',
  'BISC 452','BISC 498','BISC 615','BISC 625','BISC 639',
  'CHEM 410','CHEM 412',
  'CGSC 420','CGSC 485',
  'COMM 306','COMM 311','COMM 329','COMM 417','COMM 423','COMM 424','COMM 427','COMM 452','COMM 485',
  'CRJU 312','CRJU 417','CRJU 424','CRJU 452','CRJU 460','CRJU 489',
  'ENEP 410','ENEP 425','ENEP 426','ENEP 427','ENEP 468','ENEP 470','ENEP 472',
  'ENGL 225','ENGL 280','ENGL 300','ENGL 301','ENGL 304','ENGL 305','ENGL 306','ENGL 307','ENGL 308','ENGL 309','ENGL 312','ENGL 314','ENGL 315','ENGL 317','ENGL 318','ENGL 321','ENGL 322','ENGL 324','ENGL 325','ENGL 328','ENGL 331','ENGL 332','ENGL 334','ENGL 338','ENGL 340','ENGL 341','ENGL 342','ENGL 344','ENGL 345','ENGL 347','ENGL 348','ENGL 350','ENGL 351','ENGL 352','ENGL 356','ENGL 365','ENGL 368','ENGL 371','ENGL 372','ENGL 373','ENGL 374','ENGL 376','ENGL 380','ENGL 381','ENGL 382','ENGL 384','ENGL 385','ENGL 386','ENGL 409','ENGL 410','ENGL 411','ENGL 412','ENGL 413','ENGL 418','ENGL 430','ENGL 450','ENGL 476','ENGL 480','ENGL 491',
  'GAME 410',
  'GEOG 346','GEOG 445',
  'GEOL 401',
  'HIST 250','HIST 300','HIST 307','HIST 308','HIST 309','HIST 310','HIST 314','HIST 318','HIST 319','HIST 334','HIST 335','HIST 337','HIST 338','HIST 340','HIST 341','HIST 348','HIST 349','HIST 350','HIST 352','HIST 353','HIST 354','HIST 357','HIST 359','HIST 360','HIST 361','HIST 363','HIST 365','HIST 368','HIST 369','HIST 370','HIST 373','HIST 374','HIST 375','HIST 377','HIST 378','HIST 380','HIST 382','HIST 387','HIST 388','HIST 392','HIST 394','HIST 395','HIST 397','HIST 400','HIST 411','HIST 439','HIST 460','HIST 471','HIST 473','HIST 474','HIST 475','HIST 477','HIST 479',
  'LLCU 321','LLCU 327','LLCU 328','LLCU 329','LLCU 330','LLCU 332','LLCU 335','LLCU 338','LLCU 340','LLCU 375','LLCU 380','LLCU 383','LLCU 416','LLCU 430','LLCU 490','LLCU 495',
  'MCST 402',
  'MATH 308','MATH 419','MATH 512',
  'MUSC 312','MUSC 313','MUSC 345','MUSC 407','MUSC 411',
  'NSCI 407','NSCI 442',
  'PHIL 300','PHIL 444','PHIL 465',
  'PHYS 460','PHYS 480','PHYS 626','PHYS 650',
  'POSC 380','POSC 387','POSC 408','POSC 411','POSC 413','POSC 414','POSC 415','POSC 417','POSC 419','POSC 426','POSC 429','POSC 433','POSC 436','POSC 437','POSC 443','POSC 446','POSC 448','POSC 450','POSC 459','POSC 470','POSC 472','POSC 473','POSC 482',
  'PSYC 314','PSYC 340','PSYC 350','PSYC 380','PSYC 394','PSYC 402','PSYC 405','PSYC 414','PSYC 415','PSYC 416','PSYC 420','PSYC 425','PSYC 445','PSYC 492',
  'SOCI 305','SOCI 407','SOCI 415','SOCI 418','SOCI 425','SOCI 428','SOCI 433','SOCI 444','SOCI 449','SOCI 450','SOCI 470',
  'THEA 340',
  'UAPP 230','UAPP 401',
  'UNIV 402','HONR 490','UNIV 491','HONR 495',
  'WOMS 308','WOMS 313',
];
