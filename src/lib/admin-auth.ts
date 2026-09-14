import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "./supabase/server";
export const SESSION_COOKIE = "marley-admin";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function isApprovedAdmin(
  user: { email?: string; email_confirmed_at?: string | null } | null,
  configuredEmail = process.env.ADMIN_EMAIL,
) {
  return !!(
    configuredEmail?.trim() &&
    user?.email_confirmed_at &&
    user.email?.toLowerCase() === configuredEmail.trim().toLowerCase()
  );
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new ApiError(403, "This request must come from this site.");
}
export async function requireAdmin(request: Request) {
  if (!isSupabaseAdminConfigured() || !process.env.ADMIN_EMAIL?.trim())
    throw new ApiError(503, "Admin access has not been configured yet.");
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!token) throw new ApiError(401, "Sign in as an admin to save changes.");
  const { data, error } = await createAdminClient().auth.getUser(token);
  if (error || !data.user)
    throw new ApiError(
      401,
      "Your session has expired. Sign in again; your draft is preserved.",
    );
  if (!isApprovedAdmin(data.user))
    throw new ApiError(403, "This account does not have admin access.");
  return data.user;
}
export async function readJson(
  request: Request,
  limit = 500_000,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send JSON data.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Missing request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, "Request is too large.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  console.error(
    "Academic record request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  return Response.json(
    { error: "Unable to reach the academic record. Please try again." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
