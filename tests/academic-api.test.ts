import test from "node:test";
import assert from "node:assert/strict";

test("academic API enforces authentication, validation, history and compare-and-swap writes", async (t) => {
  process.env.SUPABASE_URL = "https://academic-test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key";
  process.env.ADMIN_EMAIL = "admin@example.com";
  const { PUT, GET } = await import("../src/app/api/academic-record/route");
  const originalFetch = global.fetch;
  let email = "admin@example.com";
  let race = false;
  let writes = 0;
  const original = {
    id: "seed-1",
    school: "udel",
    courseCode: "CGSC 170",
    title: "Cognitive Science",
    credits: 3,
    status: "in_progress",
    term: "Spring",
    year: 2026,
    fulfillsRequirements: ["major-core-cgsc170"],
    legacyKeys: ["udel:CGSC 170"],
  };
  let record = { courses: [original], revision: 0, updated_at: "" };
  global.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    if (url.origin !== "https://academic-test.supabase.co")
      throw new Error("Unexpected external request");
    if (url.pathname === "/auth/v1/user")
      return Response.json({
        id: "test-user",
        email,
        email_confirmed_at: "2026-01-01",
        aud: "authenticated",
      });
    assert.equal(url.pathname, "/rest/v1/academic_record");
    if (init?.method === "PATCH") {
      writes++;
      assert.equal(url.searchParams.get("revision"), `eq.${record.revision}`);
      if (race)
        return Response.json(
          {
            code: "PGRST116",
            details: "The result contains 0 rows",
            message: "Cannot coerce the result to a single JSON object",
          },
          { status: 406 },
        );
      record = { ...record, ...JSON.parse(String(init.body)) };
      return Response.json(record);
    }
    return Response.json(record);
  };
  t.after(() => {
    global.fetch = originalFetch;
  });
  const request = (
    body: unknown,
    cookie = "marley-admin=valid-test-token",
    origin = "https://planner.test",
  ) =>
    new Request("https://planner.test/api/academic-record", {
      method: "PUT",
      headers: { cookie, origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  await t.test("public reads return the current revision", async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    assert.equal((await res.json()).revision, 0);
  });
  await t.test(
    "unauthenticated and cross-origin edits never write",
    async () => {
      assert.equal(
        (await PUT(request({ courses: [], revision: 0 }, ""))).status,
        401,
      );
      assert.equal(
        (await PUT(request({}, "", "https://evil.test"))).status,
        403,
      );
      assert.equal(writes, 0);
    },
  );
  await t.test("signed-in non-admins cannot edit", async () => {
    email = "other@example.com";
    assert.equal((await PUT(request({}))).status, 403);
    email = "admin@example.com";
    assert.equal(writes, 0);
  });
  await t.test(
    "invalid credits and deletion of history are rejected",
    async () => {
      assert.equal(
        (
          await PUT(
            request({ courses: [{ ...original, credits: -1 }], revision: 0 }),
          )
        ).status,
        400,
      );
      assert.equal(
        (await PUT(request({ courses: [], revision: 0 }))).status,
        400,
      );
      assert.equal(writes, 0);
    },
  );
  await t.test("completion persists and advances revision", async () => {
    const res = await PUT(
      request({
        courses: [
          { ...original, status: "completed", legacyKeys: ["forged:key"] },
        ],
        revision: 0,
      }),
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.revision, 1);
    assert.equal(data.courses[0].status, "completed");
    assert.deepEqual(data.courses[0].legacyKeys, ["udel:CGSC 170"]);
  });
  await t.test("stale saves and racing saves return conflict", async () => {
    assert.equal(
      (await PUT(request({ courses: record.courses, revision: 0 }))).status,
      409,
    );
    race = true;
    assert.equal(
      (await PUT(request({ courses: record.courses, revision: 1 }))).status,
      409,
    );
    assert.equal(record.revision, 1);
  });
});
