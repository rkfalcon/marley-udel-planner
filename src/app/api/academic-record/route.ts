import {
  ApiError,
  apiError,
  readJson,
  requireAdmin,
  requireSameOrigin,
} from "@/lib/admin-auth";
import { prepareCourses, type AcademicCourse } from "@/lib/academic-record";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try {
    if (!isSupabaseAdminConfigured())
      throw new ApiError(
        503,
        "The academic record database is not configured.",
      );
    const { data, error } = await createAdminClient()
      .from("academic_record")
      .select("courses, revision, updated_at")
      .eq("id", "marley")
      .single();
    if (error || !data)
      throw new ApiError(
        503,
        "The academic record is unavailable. Please check database setup or try again.",
      );
    return Response.json(
      {
        courses: data.courses,
        revision: data.revision,
        updatedAt: data.updated_at,
      },
      { headers },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdmin(request);
    const body = (await readJson(request)) as {
      courses?: unknown;
      revision?: unknown;
    } | null;
    if (
      !body ||
      !Number.isSafeInteger(body.revision) ||
      Number(body.revision) < 0
    )
      throw new ApiError(400, "Invalid record revision.");
    const db = createAdminClient();
    const { data: previous, error: readError } = await db
      .from("academic_record")
      .select("courses, revision")
      .eq("id", "marley")
      .single();
    if (readError || !previous)
      throw new ApiError(
        503,
        "The academic record is unavailable. Your changes have not been saved.",
      );
    if (previous.revision !== body.revision)
      throw new ApiError(
        409,
        "The record changed in another session. Reload the latest record before saving.",
      );
    let courses: AcademicCourse[];
    try {
      courses = prepareCourses(
        body.courses,
        previous.courses as AcademicCourse[],
      );
    } catch (e) {
      throw new ApiError(
        400,
        e instanceof Error ? e.message : "Invalid courses.",
      );
    }
    const { data, error } = await db
      .from("academic_record")
      .update({
        courses,
        revision: previous.revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "marley")
      .eq("revision", previous.revision)
      .select("courses, revision, updated_at")
      .maybeSingle();
    if (error)
      throw new ApiError(
        503,
        "Unable to save. Your draft is preserved; please try again.",
      );
    if (!data)
      throw new ApiError(
        409,
        "The record changed in another session. Reload the latest record before saving.",
      );
    return Response.json(
      {
        courses: data.courses,
        revision: data.revision,
        updatedAt: data.updated_at,
      },
      { headers },
    );
  } catch (e) {
    return apiError(e);
  }
}
