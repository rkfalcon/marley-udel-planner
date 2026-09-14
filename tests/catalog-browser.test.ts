import test from "node:test";
import assert from "node:assert/strict";
import type { Browser } from "playwright-core";
import { CatalogBrowserSource } from "../src/lib/catalog/browser-source";

const root = "https://catalog.udel.edu";
const home = `<html><!-- acalog ${" ".repeat(1100)} --><select name="catalog"><option value="99">2027-2028 Undergraduate Catalog</option></select><a href="content.php?catoid=99&navoid=1">Courses</a><a href="content.php?catoid=99&navoid=2">Programs</a></html>`;
function fixture(fail = false, redirect = false, fast = false, current = false) {
  const visited: string[] = [];
  const selected: string[] = [];
  let launches = 0,
    clicks = 0,
    closedPages = 0,
    closedBrowsers = 0;
  let disposedResponses = 0;
  const launch = async () => {
    launches++;
    return {
      newContext: async () => ({
        setDefaultTimeout() {},
        request: {
          get: async () =>
            fast
              ? {
                  status: () => 200,
                  text: async () => home,
                  dispose: async () => {
                    disposedResponses++;
                  },
                }
              : null,
        },
        newPage: async () => {
          let url = "";
          return {
            goto: async (target: string) => {
              visited.push(target);
              url =
                redirect && target.includes("coid")
                  ? target.replace("99", "98")
                  : target;
            },
            waitForNavigation: async () => {},
            url: () => url,
            content: async () => (fail ? "challenge" : home),
            close: async () => {
              closedPages++;
            },
            locator: () => ({
              waitFor: async () => {},
              inputValue: async () => current ? "99" : "97",
              evaluateAll: async (fn: (options: unknown[]) => unknown) =>
                fn([
                  {
                    value: "97",
                    textContent:
                      "2026-2027 Undergraduate Catalog [ARCHIVED CATALOG]",
                  },
                  { value: "98", textContent: "2027-2028 Graduate Catalog" },
                  {
                    value: "99",
                    textContent: "2027-2028 Undergraduate Catalog",
                  },
                ]),
              selectOption: async (id: string) => {
                selected.push(id);
              },
            }),
            getByRole: () => ({
              click: async () => {
                clicks++;
                url = `${root}/content.php?catoid=99&navoid=1`;
              },
            }),
          };
        },
      }),
      close: async () => {
        closedBrowsers++;
      },
    } as unknown as Browser;
  };
  return {
    source: new CatalogBrowserSource(launch),
    visited,
    selected,
    disposed: () => disposedResponses,
    counts: () => ({ launches, clicks, closedPages, closedBrowsers }),
  };
}

test("browser importer selects the newest undergraduate catalog and shares one isolated session across concurrent reads", async () => {
  const f = fixture();
  await Promise.all([
    f.source.read(`${root}/`),
    f.source.read(`${root}/preview_course_nopop.php?catoid=99&coid=1`),
  ]);
  await f.source.close();
  assert.deepEqual(f.selected, ["99"]);
  assert.deepEqual(f.visited.slice(0, 2), [
    `${root}/index.php`,
    `${root}/index.php?catoid=99`,
  ]);
  assert.deepEqual(f.counts(), {
    launches: 1,
    clicks: 1,
    closedPages: 3,
    closedBrowsers: 1,
  });
});

test("browser importer rejects challenges and cross-year redirects and closes failed pages", async () => {
  const blocked = fixture(true);
  await assert.rejects(blocked.source.read(`${root}/`), /complete catalog/);
  await blocked.source.close();
  assert.equal(blocked.counts().closedPages, 1);
  const redirected = fixture(false, true);
  await assert.rejects(
    redirected.source.read(`${root}/preview_course_nopop.php?catoid=99&coid=1`),
    /changed the requested catalog year/,
  );
  await redirected.source.close();
  assert.equal(redirected.counts().closedPages, 2);
  const invalid = fixture();
  await assert.rejects(
    invalid.source.read("https://example.com/"),
    /Unexpected/,
  );
  assert.equal(invalid.counts().launches, 0);
});

test("session HTML requests avoid rendering each course and dispose response bodies", async () => {
  const f = fixture(false, false, true);
  await f.source.read(`${root}/preview_course_nopop.php?catoid=99&coid=1`);
  await f.source.close();
  assert.equal(f.disposed(), 1);
  assert.equal(f.counts().closedPages, 1);
});

test("an already-current catalog does not submit a redundant selection navigation", async () => {
  const f = fixture(false, false, true, true);
  await f.source.read(`${root}/`);
  await f.source.close();
  assert.deepEqual(f.selected, []);
  assert.equal(f.counts().clicks, 1);
});
