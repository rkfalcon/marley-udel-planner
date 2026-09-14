import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { AcademicEditor } from "../src/components/academic/academic-editor";
import {
  AcademicRecordProvider,
  useAcademicRecord,
} from "../src/components/academic/academic-record-provider";
import { COMPLETED_COURSES } from "../src/lib/data/marley-progress";
import {
  creditTotals,
  reconcilePlan,
  type AcademicRecord,
} from "../src/lib/academic-record";
import { evaluateRequirements } from "../src/lib/requirement-evaluation";
import type { Plan } from "../src/lib/types";

const nodeText = (n: ReactTestInstance): string =>
  n.children.map((c) => (typeof c === "string" ? c : nodeText(c))).join("");
function ObservedProgress() {
  const { record, courses } = useAcademicRecord();
  const plan: Plan = {
    id: "saved",
    name: "Existing plan",
    slug: "existing",
    targetGraduation: "Spring 2028",
    isEarlyGraduation: false,
    createdAt: "",
    updatedAt: "",
    semesters: [
      {
        id: "spring",
        planId: "saved",
        term: "Spring",
        year: 2026,
        school: "udel",
        sortOrder: 0,
        courses: COMPLETED_COURSES.filter((c) => c.term === "Spring").map(
          (c, i) => ({ ...c, id: `old-${i}`, planSemesterId: "spring" }),
        ),
      },
    ],
  };
  const reconciled = record ? reconcilePlan(plan, record.courses) : plan;
  return createElement(
    "output",
    null,
    JSON.stringify({
      totals: creditTotals(courses),
      requirements: evaluateRequirements(courses).totalCompleted,
      plan: creditTotals(reconciled.semesters.flatMap((s) => s.courses)),
    }),
  );
}

test("admin saves persist immediately and update shared progress and existing plans", async (t) => {
  const globals = globalThis as unknown as Record<string, unknown>;
  const previous = {
    window: globals.window,
    document: globals.document,
    act: globals.IS_REACT_ACT_ENVIRONMENT,
    fetch: global.fetch,
  };
  const win = Object.assign(new EventTarget(), {
    confirm: () => true,
    BroadcastChannel,
  });
  globals.window = win;
  globals.document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  let memory: AcademicRecord;
  let writes: number;
  let failure = false;
  let refreshed: (() => void) | undefined;
  global.fetch = async (_input, init) => {
    if (init?.method === "PUT") {
      writes++;
      if (failure)
        return Response.json(
          { error: "Save failed; try again." },
          { status: 503 },
        );
      const data = JSON.parse(String(init.body));
      assert.equal(data.revision, memory.revision);
      memory = {
        courses: data.courses,
        revision: memory.revision + 1,
        updatedAt: "saved",
      };
    }
    if (init?.method !== "PUT" && memory.revision > 0) refreshed?.();
    return Response.json(memory);
  };
  t.after(() => {
    globals.window = previous.window;
    globals.document = previous.document;
    globals.IS_REACT_ACT_ENVIRONMENT = previous.act;
    global.fetch = previous.fetch;
  });
  async function mount() {
    memory = {
      courses: COMPLETED_COURSES.map((c, i) => ({
        ...c,
        id: `seed-${i}`,
        legacyKeys: [],
      })),
      revision: 0,
      updatedAt: "",
    };
    writes = 0;
    failure = false;
    let root: ReactTestRenderer;
    await act(async () => {
      root = create(
        createElement(
          AcademicRecordProvider,
          null,
          createElement(AcademicEditor, {
            initialRecord: memory,
            canSave: true,
            onSessionExpired: () => {},
          }),
          createElement(ObservedProgress),
        ),
      );
    });
    return root!;
  }
  await t.test(
    "Complete selected saves the whole Spring semester without a second save button",
    async () => {
      const root = await mount();
      try {
        const spring = root.root
          .findAllByType("input")
          .filter((n) => n.props.type === "checkbox" && !n.props.disabled);
        for (const n of spring)
          await act(async () =>
            n.props.onChange({ target: { checked: true } }),
          );
        const button = root.root
          .findAllByType("button")
          .find((n) => nodeText(n).startsWith("Complete selected"))!;
        await act(async () => {
          button.props.onClick();
        });
        assert.equal(
          memory!.courses
            .filter((c) => c.term === "Spring" && c.year === 2026)
            .every((c) => c.status === "completed"),
          true,
        );
        assert.equal(writes!, 1);
        const result = JSON.parse(nodeText(root.root.findByType("output")));
        assert.equal(result.totals.completed, 47);
        assert.equal(result.totals.inProgress, 0);
        assert.equal(result.plan.completed, 47);
        assert.equal(result.plan.inProgress, 0);
        assert.equal(result.requirements, 17);
      } finally {
        await act(async () => root.unmount());
      }
    },
  );
  await t.test(
    "saving one edited course persists before closing the editor",
    async () => {
      const root = await mount();
      try {
        await act(async () =>
          root.root
            .findAllByType("button")
            .find((n) => n.props["aria-label"] === "Edit CGSC 170")!
            .props.onClick(),
        );
        const status = root.root
          .findAllByType("select")
          .find((n) => nodeText(n).includes("Transfer accepted"))!;
        await act(async () =>
          status.props.onChange({ target: { value: "completed" } }),
        );
        await act(async () => {
          await root.root
            .findByType("form")
            .props.onSubmit({ preventDefault() {} });
        });
        assert.equal(
          memory!.courses.find((c) => c.courseCode === "CGSC 170")?.status,
          "completed",
        );
        assert.equal(writes!, 1);
        assert.equal(root.root.findAllByType("form").length, 0);
      } finally {
        await act(async () => root.unmount());
      }
    },
  );
  await t.test(
    "failed saves keep edits visible and do not change published totals",
    async () => {
      const root = await mount();
      try {
        await act(async () =>
          root.root
            .findAllByType("button")
            .find((n) => n.props["aria-label"] === "Edit CGSC 170")!
            .props.onClick(),
        );
        const status = root.root
          .findAllByType("select")
          .find((n) => nodeText(n).includes("Transfer accepted"))!;
        await act(async () =>
          status.props.onChange({ target: { value: "completed" } }),
        );
        failure = true;
        await act(async () => {
          await root.root
            .findByType("form")
            .props.onSubmit({ preventDefault() {} });
        });
        assert.equal(writes!, 1);
        assert.equal(root.root.findAllByType("form").length, 1);
        assert.equal(
          root.root
            .findAllByType("select")
            .find((n) => nodeText(n).includes("Transfer accepted"))!.props
            .value,
          "completed",
        );
        assert.equal(
          JSON.parse(nodeText(root.root.findByType("output"))).totals.completed,
          32,
        );
      } finally {
        await act(async () => root.unmount());
      }
    },
  );
  await t.test(
    "a save refreshes progress and graduation calculations in another open tab",
    async () => {
      const first = await mount();
      let second: ReactTestRenderer;
      await act(async () => {
        second = create(
          createElement(
            AcademicRecordProvider,
            null,
            createElement(ObservedProgress),
          ),
        );
      });
      try {
        const selected = first.root
          .findAllByType("input")
          .find((n) => n.props["aria-label"] === "Select CGSC 170")!;
        await act(async () =>
          selected.props.onChange({ target: { checked: true } }),
        );
        const updateReceived = new Promise<void>((resolve) => {
          refreshed = resolve;
        });
        await act(async () => {
          first.root
            .findAllByType("button")
            .find((n) => nodeText(n).startsWith("Complete selected"))!
            .props.onClick();
          await Promise.race([
            updateReceived,
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Other tab did not refresh after save")),
                1000,
              ),
            ),
          ]);
        });
        const result = JSON.parse(nodeText(second!.root.findByType("output")));
        assert.equal(result.totals.completed, 35);
        assert.equal(result.plan.completed, 35);
        assert.equal(result.plan.inProgress, 12);
      } finally {
        refreshed = undefined;
        await act(async () => {
          first.unmount();
          second!.unmount();
        });
      }
    },
  );
});
