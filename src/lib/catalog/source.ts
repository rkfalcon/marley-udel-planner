import { load } from "cheerio";
import { createHash } from "node:crypto";
import type { Course } from "../types";
import type { CatalogSource, SourceDocument } from "./types";
const ORIGIN = "https://catalog.udel.edu";
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
export function sourceUrl(href: string, base = ORIGIN): string {
  const url = new URL(href, base);
  if (
    url.origin !== ORIGIN ||
    ![
      "/",
      "/index.php",
      "/content.php",
      "/preview_course_nopop.php",
      "/preview_program.php",
    ].includes(url.pathname)
  )
    throw new Error("Unexpected catalog source URL.");
  url.hash = "";
  return url.href;
}
export async function fetchSource(url: string): Promise<string> {
  const response = await fetch(sourceUrl(url), {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "text/html" },
  });
  const html = await response.text();
  if (response.status !== 200 || html.length < 1000 || !html.includes("acalog"))
    throw new Error(
      `UDel catalog access failed (HTTP ${response.status}). The source may be blocking automated requests; the published catalog is unchanged.`,
    );
  return html;
}
export function discoverCatalog(html: string): CatalogSource {
  const $ = load(html);
  const options = $('select[name="catalog"] option')
    .toArray()
    .map((el) => ({
      id: $(el).attr("value") || "",
      title: clean($(el).text()),
    }))
    .filter((o) => /^\d{4}-\d{4} Undergraduate Catalog$/.test(o.title))
    .sort((a, b) => b.title.localeCompare(a.title));
  if (!options.length)
    throw new Error("Cannot identify the current undergraduate catalog.");
  const current = options[0];
  const link = (label: string) => {
    const href = $("a")
      .toArray()
      .find((el) => clean($(el).text()).toLowerCase() === label)?.attribs.href;
    if (!href) throw new Error(`Missing ${label} catalog link.`);
    const url = sourceUrl(href);
    if (new URL(url).searchParams.get("catoid") !== current.id)
      throw new Error("Catalog year and navigation do not match.");
    return url;
  };
  return {
    id: current.id,
    year: current.title.slice(0, 9),
    home: sourceUrl(`/index.php?catoid=${current.id}`),
    courses: link("courses"),
    programs: link("programs"),
  };
}
export function parseIndex(html: string, source: CatalogSource) {
  const $ = load(html);
  const catalogName = clean(
    $("#acalog-catalog-name, .acalog_catalog_name").first().text(),
  );
  if (!catalogName.includes(source.year))
    throw new Error("Course listing belongs to a different catalog year.");
  const links: Record<string, string> = {};
  const pages: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")!;
    if (href.includes("preview_course_nopop.php")) {
      const url = sourceUrl(href);
      if (new URL(url).searchParams.get("catoid") !== source.id)
        throw new Error("Mixed catalog years in course listing.");
      const code = clean($(el).text()).match(
        /^([A-Z]{2,6} \d{3}[A-Z]*)\s*[-–]/,
      )?.[1];
      if (!code)
        throw new Error("Unrecognized course code in catalog listing.");
      if (links[code] && links[code] !== url)
        throw new Error(`Conflicting catalog entries for ${code}.`);
      links[code] = url;
    }
    if (href.includes("cpage") && href.includes("content.php"))
      pages.push(sourceUrl(href));
  });
  if (!Object.keys(links).length)
    throw new Error("Empty course listing; import stopped.");
  const prefixes = $("#courseprefix option")
    .toArray()
    .map((el) => clean($(el).text()))
    .filter((s) => /^[A-Z]{2,6}$/.test(s));
  return { links, pages: [...new Set(pages)], prefixes };
}
export function parseCourse(
  html: string,
  url: string,
  expectedCode: string,
): Course {
  const $ = load(html);
  const heading = clean($("#course_preview_title").text());
  const prefix = `${expectedCode} - `;
  const normalized = heading.replace(/\s*[-–]\s*/, " - ");
  if (!normalized.startsWith(prefix))
    throw new Error(`Course identity mismatch for ${expectedCode}.`);
  const content = $("td.block_content").first();
  content.find("br, hr").replaceWith("\n");
  const text = content.text();
  const credit = text.match(
    /Credit\(s\):\s*(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?/,
  );
  if (!credit || +credit[1] > 30 || (credit[2] && +credit[2] > 30))
    throw new Error(`Missing or invalid credits for ${expectedCode}.`);
  const field = (label: string) => {
    const strong = content
      .find("strong")
      .toArray()
      .find((el) => clean($(el).text()) === label);
    if (!strong) return undefined;
    let value = "";
    for (
      let node = strong.nextSibling;
      node && !(node.type === "tag" && node.name === "strong");
      node = node.nextSibling
    )
      value += $.text([node]);
    return clean(value).slice(0, 800);
  };
  const designations = field("Requirement Designations:");
  const description = clean(
    text.match(
      /Component:[^\n]*\n([\s\S]*?)(?:Repeatable for Credit:|PREREQ:|Requirement Designations:|General Education Objectives:)/,
    )?.[1] ?? "",
  ).slice(0, 500);
  return {
    id: `catalog-${new URL(url).searchParams.get("catoid")}-${expectedCode.replace(/ /g, "-")}`,
    school: "udel",
    courseCode: expectedCode,
    title: normalized.slice(prefix.length),
    credits: +credit[1],
    catalogUrl: sourceUrl(url),
    description: [
      credit[2]
        ? `Variable credits: ${credit[1]}–${credit[2]}. Enter enrolled credits.`
        : "",
      description,
      field("RESTRICTIONS:"),
    ]
      .filter(Boolean)
      .join(" "),
    prerequisites: field("PREREQ:"),
    typicallyOffered: field("Course Typically Offered:"),
    attributes: [field("University Breadth:"), designations].filter(
      (s): s is string => !!s,
    ),
  };
}
export function parseDocument(html: string, url: string): SourceDocument {
  const $ = load(html);
  const content = $("td.block_content").first();
  content.find("script,style,.gateway-toolbar").remove();
  const title = clean(content.find("h1").first().text());
  const text = clean(content.text()).replace(
    /Share this Page.*?Help \(opens a new window\)/g,
    "",
  );
  if (!title || text.length < 300)
    throw new Error("Requirement source is incomplete.");
  return {
    url: sourceUrl(url),
    title,
    text,
    hash: createHash("sha256").update(text).digest("hex"),
  };
}
export function discoverProgramLinks(html: string, id: string): string[] {
  const $ = load(html);
  return [
    ...new Set(
      $("a[href]")
        .toArray()
        .filter((el) =>
          /Cognitive Science.*Speech.Language Pathology|Courses Approved for Second Writing/i.test(
            clean($(el).text()),
          ),
        )
        .map((el) => sourceUrl($(el).attr("href")!))
        .filter((url) => new URL(url).searchParams.get("catoid") === id),
    ),
  ];
}
export function validateCatalog(
  courses: Course[],
  prefixes: string[],
  previous: Course[] = [],
) {
  if (courses.length < 1000 || prefixes.length < 50)
    throw new Error("Catalog is incomplete: too few courses or departments.");
  const codes = new Set(courses.map((c) => c.courseCode));
  if (codes.size !== courses.length)
    throw new Error("Duplicate course codes in import.");
  const present = new Set(courses.map((c) => c.courseCode.split(" ")[0]));
  const missing = prefixes.filter((p) => !present.has(p));
  if (missing.length)
    throw new Error(`Missing departments: ${missing.join(", ")}.`);
  if (previous.length && courses.length < previous.length * 0.9)
    throw new Error(
      "More than 10% of the previous catalog is missing; publication stopped for review.",
    );
  if (JSON.stringify(courses).length > 15_000_000)
    throw new Error(
      "Catalog exceeds the publication size limit; review required.",
    );
}
