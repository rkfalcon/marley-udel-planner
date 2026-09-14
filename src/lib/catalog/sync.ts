import { CATALOG } from "../data/catalog";
import { claimCatalog, readSnapshot, saveState, writeSnapshot } from "./store";
import {
  discoverCatalog,
  discoverProgramLinks,
  fetchSource,
  parseCourse,
  parseExpandedCourses,
  parseDocument,
  parseIndex,
  validateCatalog,
} from "./source";
import type { CatalogState, SourceDocument } from "./types";
const WEEK = 7 * 24 * 60 * 60 * 1000;
export function shouldCheck(
  state: CatalogState,
  now = Date.now(),
  force = false,
) {
  return (
    !state.paused &&
    (force ||
      !!state.error ||
      !!state.requirementsError ||
      !!state.job ||
      !state.nextCheck ||
      Date.parse(state.nextCheck) <= now)
  );
}
async function checkRequirements(
  state: CatalogState,
  readSource: (url: string) => Promise<string>,
) {
  const urls = [CATALOG.program, CATALOG.secondWriting];
  if (state.job!.source.id !== "97") {
    const newUrls = discoverProgramLinks(
      await readSource(state.job!.source.programs),
      state.job!.source.id,
    );
    if (newUrls.length < 2)
      throw new Error(
        "New catalog requirement pages could not be identified. Review required.",
      );
    urls.push(...newUrls);
  }
  const documents: SourceDocument[] = [];
  for (const url of [...new Set(urls)])
    documents.push(parseDocument(await readSource(url), url));
  const old = state.requirements?.documents;
  const changed =
    !!state.requirements?.changed ||
    state.job!.source.id !== "97" ||
    !!old?.some(
      (doc) => !documents.some((d) => d.url === doc.url && d.hash === doc.hash),
    );
  state.requirements = {
    checkedAt: new Date().toISOString(),
    documents,
    previousDocuments:
      state.requirements?.previousDocuments ?? (changed ? old : undefined),
    changed,
    message: changed
      ? "Official requirement source changed. Review the source changes before updating the assigned planning rules. Current calculations remain on the reviewed 2026–2027 rules."
      : "Official sources checked. Assigned planning rules remain 2026–2027; new catalog years never switch them automatically.",
  };
}
export async function syncCatalog(
  force = false,
  budgetMs = 230000,
  readSource = fetchSource,
  bulkDetails = false,
) {
  const lease = await claimCatalog();
  if (!lease) return { status: "busy" };
  const { token, state } = lease;
  const deadline = Date.now() + budgetMs;
  try {
    if (!shouldCheck(state, Date.now(), force)) {
      await saveState(state, token, true);
      return { status: state.paused ? "paused" : "not_due" };
    }
    state.lastAttempt = new Date().toISOString();
    delete state.error;
    if (!state.job) {
      const source = discoverCatalog(
        await readSource("https://catalog.udel.edu/"),
      );
      state.job = {
        source,
        pages: [source.courses],
        visited: [],
        prefixes: [],
        links: {},
        courses: [],
        startedAt: new Date().toISOString(),
      };
      await saveState(state, token);
    }
    if (
      !state.requirements ||
      Date.now() - Date.parse(state.requirements.checkedAt) >= WEEK ||
      force
    ) {
      try {
        await checkRequirements(state, readSource);
        delete state.requirementsError;
      } catch (e) {
        state.requirementsError =
          e instanceof Error ? e.message : "Requirement source check failed.";
      }
      await saveState(state, token);
    }
    const job = state.job;
    // Print links duplicate listings and can recursively multiply the page queue.
    job.pages = job.pages.filter(
      (page) => !new URL(page).searchParams.has("print"),
    );
    while (job.pages.length && Date.now() < deadline - 20000) {
      const page = job.pages[0];
      const parsed = parseIndex(await readSource(page), job.source);
      for (const [code, url] of Object.entries(parsed.links)) {
        if (job.links[code] && job.links[code] !== url)
          throw new Error(`Conflicting course identity: ${code}.`);
        job.links[code] = url;
      }
      job.prefixes = [...new Set([...job.prefixes, ...parsed.prefixes])];
      job.visited.push(page);
      job.pages.shift();
      job.pages = [...new Set([...job.pages, ...parsed.pages])].filter(
        (p) => !job.visited.includes(p),
      );
      if (job.visited.length > 250 || Object.keys(job.links).length > 15000)
        throw new Error("Catalog unexpectedly large; review required.");
      await saveState(state, token);
    }
    if (!job.pages.length) {
      if (bulkDetails) {
        job.expandedPages ??= [
          ...new Set(
            job.visited
              .filter((page) => !new URL(page).searchParams.has("print"))
              .map((page) => {
                const url = new URL(job.source.courses);
                url.searchParams.set(
                  "filter[cpage]",
                  new URL(page).searchParams.get("filter[cpage]") || "1",
                );
                url.searchParams.set("print", "");
                url.searchParams.set("expand", "1");
                return url.href;
              }),
          ),
        ];
        const imported = new Set(
          job.courses.map((course) => course.courseCode),
        );
        while (job.expandedPages.length && Date.now() < deadline - 20000) {
          const batch = job.expandedPages.slice(0, 4);
          const results = await Promise.allSettled(
            batch.map(async (page) =>
              parseExpandedCourses(
                await readSource(page),
                job.source,
                job.links,
              ),
            ),
          );
          let failed: unknown;
          for (const [index, result] of results.entries()) {
            if (result.status === "rejected") {
              failed = result.reason;
              continue;
            }
            for (const course of result.value)
              if (!imported.has(course.courseCode)) {
                job.courses.push(course);
                imported.add(course.courseCode);
              }
            job.expandedPages = job.expandedPages.filter(
              (page) => page !== batch[index],
            );
          }
          await saveState(state, token);
          if (failed) throw failed;
        }
      }
      const done = new Set(job.courses.map((c) => c.courseCode));
      const pending = Object.entries(job.links).filter(
        ([code]) => !done.has(code),
      );
      while (
        !job.expandedPages?.length &&
        pending.length &&
        Date.now() < deadline - 20000
      ) {
        // Small batches bound source load and preserve completed work across retries.
        const batch = pending.splice(0, 4);
        const results = await Promise.allSettled(
          batch.map(async ([code, url]) =>
            parseCourse(await readSource(url), url, code),
          ),
        );
        let failed: string | undefined;
        for (const result of results) {
          if (result.status === "fulfilled") job.courses.push(result.value);
          else
            failed =
              result.reason instanceof Error
                ? result.reason.message
                : "Course import failed.";
        }
        if (failed || job.courses.length % 32 === 0)
          await saveState(state, token);
        if (failed) throw new Error(failed);
      }
    }
    if (
      job.pages.length ||
      job.courses.length !== Object.keys(job.links).length
    ) {
      await saveState(state, token, true);
      return { status: "in_progress", courses: job.courses.length };
    }
    const previous = await readSnapshot(state.activeVersion);
    validateCatalog(job.courses, job.prefixes, previous?.courses);

    const old = new Map(previous?.courses.map((c) => [c.courseCode, c]) ?? []);
    state.changes = {
      added: job.courses.filter((c) => !old.has(c.courseCode)).length,
      removed:
        previous?.courses.filter((c) => !job.links[c.courseCode]).length ?? 0,
      changed: job.courses.filter(
        (c) =>
          old.has(c.courseCode) &&
          JSON.stringify(old.get(c.courseCode)) !== JSON.stringify(c),
      ).length,
    };
    const id = crypto.randomUUID();
    await writeSnapshot({ id, source: job.source, courses: job.courses });
    state.previousVersion = state.activeVersion;
    state.activeVersion = id;
    state.source = job.source;
    state.courseCount = job.courses.length;
    state.departmentCount = job.prefixes.length;
    state.lastSuccess = new Date().toISOString();
    state.nextCheck = new Date(Date.now() + WEEK).toISOString();
    delete state.job;
    await saveState(state, token, true);
    return { status: "published", courses: state.courseCount };
  } catch (error) {
    state.error =
      error instanceof Error
        ? error.message
        : "Catalog synchronization failed.";
    await saveState(state, token, true);
    return { status: "failed", error: state.error };
  }
}
