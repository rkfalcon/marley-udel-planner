import type { Course } from "../types";

// All 17 DIST entries verified in the 2026–2027 Undergraduate Catalog, September 14, 2026.
// Each course links to its source. Variable-credit courses default to the minimum.
const rows = [
  ["100", "Access: ABILITY Introductory Seminar", "1", "698112"],
  ["150", "Disability Community Engagement", "0", "702419"],
  ["166", "Special Problem", "1-3", "698113"],
  ["167", "Seminar", "1-6", "701488"],
  ["200", "Access: ABILITY Experience", "1-3", "701880"],
  [
    "250",
    "Disability Studies: A Multidisciplinary Introduction",
    "3",
    "702277",
  ],
  ["266", "Special Problem", "1-3", "698114"],
  ["267", "Seminar", "1-6", "701489"],
  ["301", "Disability Studies: Special Topics", "3", "701490"],
  ["345", "Mentoring Students: Int & Dev Disab", "3", "700919"],
  ["366", "Independent Study", "1-6", "698115"],
  ["367", "Seminar", "1-6", "701491"],
  ["400", "Access: ABILITY Senior Project", "3", "698116"],
  ["450", "Access:Ability Scholars Portfolio", "0", "702420"],
  ["465", "Seminar in Disability Studies", "3", "698117"],
  ["466", "Special Problem", "1-6", "698118"],
  ["467", "Seminar", "1-6", "701492"],
];

export const DIST_CATALOG: Course[] = rows.map(
  ([number, title, credits, coid]) => ({
    id: `catalog97-dist-${number}`,
    school: "udel",
    courseCode: `DIST ${number}`,
    title,
    credits: parseInt(credits),
    description: [
      "Disability Studies.",
      credits.includes("-")
        ? `Variable credits: ${credits}. Enter the actual enrolled credits.`
        : "",
      ["100", "150", "450"].includes(number)
        ? "Restricted to Access:Ability Scholars."
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    typicallyOffered:
      number === "250"
        ? "Fall, Winter and Spring"
        : ["150", "450", "465"].includes(number)
          ? "Fall and Spring"
          : "Verify offering with department",
    catalogUrl: `https://catalog.udel.edu/preview_course_nopop.php?catoid=97&coid=${coid}`,
  }),
);
