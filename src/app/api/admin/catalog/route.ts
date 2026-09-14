import {
  apiError,
  ApiError,
  readJson,
  requireAdmin,
  requireSameOrigin,
} from "@/lib/admin-auth";
import {
  claimCatalog,
  readCatalogState,
  readSnapshot,
  saveState,
} from "@/lib/catalog/store";
import { syncCatalog } from "@/lib/catalog/sync";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const state = await readCatalogState();
    return Response.json(
      {
        ...state,
        job: state.job
          ? {
              year: state.job.source.year,
              startedAt: state.job.startedAt,
              pages: state.job.visited.length,
              pendingPages: state.job.pages.length,
              discovered: Object.keys(state.job.links).length,
              imported: state.job.courses.length,
            }
          : undefined,
        cronConfigured: !!process.env.CRON_SECRET,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin(request);
    const body = (await readJson(request)) as { action?: string };
    if (body?.action === "retry") return Response.json(await syncCatalog(true));
    if (!["pause", "resume", "rollback"].includes(body?.action ?? ""))
      throw new ApiError(400, "Unknown catalog action.");
    const lease = await claimCatalog();
    if (!lease)
      throw new ApiError(
        409,
        "A catalog check is running. Try again when it finishes.",
      );
    const { state, token } = lease;
    try {
      if (body.action === "rollback") {
        if (!state.previousVersion)
          throw new ApiError(400, "There is no earlier published catalog.");
        const previous = await readSnapshot(state.previousVersion);
        const current = state.activeVersion;
        state.activeVersion = state.previousVersion;
        state.previousVersion = current;
        state.source = previous!.source;
        state.courseCount = previous!.courses.length;
        state.departmentCount = new Set(
          previous!.courses.map((c) => c.courseCode.split(" ")[0]),
        ).size;
        state.paused = true;
        delete state.job;
      } else state.paused = body.action === "pause";
      await saveState(state, token, true);
      return Response.json({ status: "saved" });
    } catch (e) {
      await saveState(state, token, true);
      throw e;
    }
  } catch (e) {
    return apiError(e);
  }
}
