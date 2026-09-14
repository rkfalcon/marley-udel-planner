import test from "node:test";
import assert from "node:assert/strict";
import {
  isApprovedAdmin,
  requireSameOrigin,
  readJson,
} from "../src/lib/admin-auth";
test("only the configured confirmed email is an admin", () => {
  assert.equal(
    isApprovedAdmin(
      { email: "admin@example.com", email_confirmed_at: "2026" },
      "ADMIN@example.com",
    ),
    true,
  );
  assert.equal(
    isApprovedAdmin(
      { email: "other@example.com", email_confirmed_at: "2026" },
      "admin@example.com",
    ),
    false,
  );
  assert.equal(
    isApprovedAdmin({ email: "admin@example.com" }, "admin@example.com"),
    false,
  );
  assert.equal(
    isApprovedAdmin(
      { email: "admin@example.com", email_confirmed_at: "2026" },
      "",
    ),
    false,
  );
});
test("cross-origin and originless mutations are rejected", () => {
  assert.throws(() =>
    requireSameOrigin(
      new Request("https://planner.test/api", {
        headers: { origin: "https://evil.test" },
      }),
    ),
  );
  assert.throws(() =>
    requireSameOrigin(new Request("https://planner.test/api")),
  );
  assert.doesNotThrow(() =>
    requireSameOrigin(
      new Request("https://planner.test/api", {
        headers: { origin: "https://planner.test" },
      }),
    ),
  );
});
test("body limits do not trust the content-length header", async () => {
  await assert.rejects(
    readJson(
      new Request("https://planner.test/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ large: "x".repeat(100) }),
      }),
      20,
    ),
  );
});
