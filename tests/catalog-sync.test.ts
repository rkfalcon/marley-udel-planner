import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  discoverCatalog,
  parseCourse,
  parseIndex,
  sourceUrl,
  validateCatalog,
} from "../src/lib/catalog/source";
const root = "https://catalog.udel.edu";
const prefixes = Array.from(
  { length: 50 },
  (_, i) =>
    String.fromCharCode(65 + Math.floor(i / 26)) +
    String.fromCharCode(65 + (i % 26)),
);
const codes = prefixes.flatMap((p) =>
  Array.from({ length: 20 }, (_, i) => `${p} ${100 + i}`),
);
const shell = (body: string) =>
  `<html><body><!-- acalog ${" ".repeat(1100)} -->${body}</body></html>`;
const home = shell(
  '<select name="catalog"><option value="97">2026-2027 Undergraduate Catalog</option></select><a href="/content.php?catoid=97&navoid=35898">Courses</a><a href="/content.php?catoid=97&navoid=35890">Programs</a>',
);
const source = discoverCatalog(home);
const index = shell(
  `<span id="acalog-catalog-name">2026-2027 Undergraduate Catalog</span><select id="courseprefix">${prefixes.map((p) => `<option>${p}</option>`).join("")}</select>${codes.map((code, i) => `<a href="/preview_course_nopop.php?catoid=97&coid=${i}">${code} - Course ${i}</a>`).join("")}`,
);
const courseHtml = (code: string, credit = "3") =>
  shell(
    `<table><tr><td class="block_content"><h1 id="course_preview_title">${code} - Test course</h1><strong>Credit(s):</strong> ${credit}<hr><strong>PREREQ:</strong> AA 100.<br><strong>Course Typically Offered:</strong> Fall and Spring<hr></td></tr></table>`,
  );
test("catalog parser validates identity, credits, year, coverage and source boundaries", () => {
  assert.equal(source.year, "2026-2027");
  assert.equal(Object.keys(parseIndex(index, source).links).length, 1000);
  assert.equal(
    parseCourse(
      courseHtml("AA 100", "0"),
      `${root}/preview_course_nopop.php?catoid=97&coid=1`,
      "AA 100",
    ).credits,
    0,
  );
  const variable = parseCourse(
    courseHtml("AA 100", "1-6"),
    `${root}/preview_course_nopop.php?catoid=97&coid=1`,
    "AA 100",
  );
  assert.match(variable.description!, /Variable credits: 1–6/);
  assert.equal(variable.prerequisites, "AA 100.");
  assert.throws(
    () =>
      parseCourse(
        courseHtml("AA 101"),
        `${root}/preview_course_nopop.php?catoid=97&coid=1`,
        "AA 100",
      ),
    /identity/,
  );
  assert.throws(
    () => parseIndex(index.replace("2026-2027", "2025-2026"), source),
    /different catalog/,
  );
  assert.throws(() => sourceUrl("https://example.com/private"), /Unexpected/);
  assert.throws(() => validateCatalog([variable], prefixes), /incomplete/);
  const all = codes.map((courseCode, i) => ({
    ...variable,
    id: String(i),
    courseCode,
  }));
  validateCatalog(all, prefixes);
  assert.throws(
    () => validateCatalog(all, [...prefixes, "ZZ"]),
    /Missing departments/,
  );
  assert.throws(
    () => validateCatalog([...all.slice(1), all[1]], prefixes),
    /Duplicate/,
  );
});

test("worker resumes, publishes atomically, preserves good data on source failure, and rejects overlapping workers", async (t) => {
  let state: Record<string, unknown> = {};
  let lease: string | null = null;
  const versions: Record<string, unknown>[] = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    const url = new URL(req.url!, "http://localhost");
    const send = (data: unknown, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    if (url.pathname === "/auth/v1/user")
      return send({
        id: "admin",
        email: "admin@example.com",
        email_confirmed_at: "2026-01-01",
      });
    if (url.pathname.endsWith("/rpc/claim_catalog_sync")) {
      if (lease) return send([]);
      lease = JSON.parse(body).token;
      return send([{ state }]);
    }
    if (url.pathname.endsWith("/catalog_sync")) {
      if (req.method === "PATCH") {
        if (url.searchParams.get("lease_token") !== `eq.${lease}`)
          return send([]);
        const patch = JSON.parse(body);
        state = patch.state;
        if (patch.lease_token === null) lease = null;
        return send([{ id: "udel" }]);
      }
      return send({ state });
    }
    if (url.pathname.endsWith("/catalog_versions")) {
      if (req.method === "POST") {
        versions.push(JSON.parse(body));
        return send(null, 201);
      }
      return send(
        versions.find((v) => `eq.${v.id}` === url.searchParams.get("id")),
      );
    }
    send({ error: "unexpected" }, 404);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  process.env.SUPABASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  let blocked = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (!url.startsWith(root)) return originalFetch(input, init);
    if (blocked) return new Response("", { status: 202 });
    const u = new URL(url);
    if (u.pathname === "/") return new Response(home);
    if (u.pathname === "/content.php") return new Response(index);
    if (u.pathname === "/preview_course_nopop.php")
      return new Response(
        courseHtml(codes[Number(u.searchParams.get("coid"))]),
      );
    return new Response(
      shell(
        `<table><tr><td class="block_content"><h1>Degree requirements</h1>${"Verified requirement text. ".repeat(30)}</td></tr></table>`,
      ),
    );
  };
  try {
    const { syncCatalog } = await import("../src/lib/catalog/sync");
    await t.test(
      "interrupted run checkpoints and next run resumes to one complete publication",
      async () => {
        assert.equal((await syncCatalog(true, 0)).status, "in_progress");
        assert.ok(state.job);
        assert.equal(versions.length, 0);
        assert.equal((await syncCatalog(true, 60000)).status, "published");
        assert.equal(versions.length, 1);
        assert.equal(state.courseCount, 1000);
        assert.equal(state.job, undefined);
      },
    );
    await t.test("weekly due date avoids unnecessary imports", async () => {
      assert.equal((await syncCatalog()).status, "not_due");
      assert.equal(versions.length, 1);
    });
    await t.test(
      "source challenge keeps the active catalog intact",
      async () => {
        const previous = state.activeVersion;
        blocked = true;
        assert.equal((await syncCatalog(true)).status, "failed");
        assert.equal(state.activeVersion, previous);
        assert.equal(versions.length, 1);
        assert.match(String(state.error), /HTTP 202/);
        blocked = false;
      },
    );
    await t.test("pause and concurrent lease prevent work", async () => {
      state.paused = true;
      assert.equal((await syncCatalog(true)).status, "paused");
      state.paused = false;
      lease = "another-worker";
      assert.equal((await syncCatalog(true)).status, "busy");
      lease = null;
    });
    await t.test(
      "cron fails closed without the secret and admin controls require login",
      async () => {
        const cron = await import("../src/app/api/cron/catalog-sync/route");
        delete process.env.CRON_SECRET;
        assert.equal(
          (
            await cron.GET(
              new Request("http://localhost/api/cron/catalog-sync", {
                headers: { authorization: "Bearer undefined" },
              }),
            )
          ).status,
          401,
        );
        process.env.CRON_SECRET = "secret";
        assert.equal(
          (
            await cron.GET(
              new Request("http://localhost/api/cron/catalog-sync", {
                headers: { authorization: "Bearer wrong" },
              }),
            )
          ).status,
          401,
        );
        process.env.ADMIN_EMAIL = "admin@example.com";
        const admin = await import("../src/app/api/admin/catalog/route");
        assert.equal(
          (await admin.GET(new Request("http://localhost/api/admin/catalog")))
            .status,
          401,
        );
        assert.equal(
          (
            await admin.POST(
              new Request("http://localhost/api/admin/catalog", {
                method: "POST",
                headers: { origin: "https://other.example" },
              }),
            )
          ).status,
          403,
        );
      },
    );
    await t.test(
      "published pages are versioned and rollback restores the previous snapshot",
      async () => {
        const before = state.activeVersion;
        assert.equal((await syncCatalog(true)).status, "published");
        assert.notEqual(state.activeVersion, before);
        const catalog = await import("../src/app/api/catalog/route");
        const page = await (
          await catalog.GET(new Request("http://localhost/api/catalog"))
        ).json();
        assert.equal(page.courses.length, 500);
        assert.equal(page.nextOffset, 500);
        const next = await (
          await catalog.GET(
            new Request(
              `http://localhost/api/catalog?version=${page.version}&offset=500`,
            ),
          )
        ).json();
        assert.equal(next.version, page.version);
        assert.equal(next.courses.length, 500);
        assert.equal(next.nextOffset, null);
        const admin = await import("../src/app/api/admin/catalog/route");
        const response = await admin.POST(
          new Request("http://localhost/api/admin/catalog", {
            method: "POST",
            headers: {
              origin: "http://localhost",
              cookie: "marley-admin=test-token",
              "content-type": "application/json",
            },
            body: JSON.stringify({ action: "rollback" }),
          }),
        );
        assert.equal(response.status, 200);
        assert.equal(state.activeVersion, before);
        assert.equal(state.paused, true);
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
