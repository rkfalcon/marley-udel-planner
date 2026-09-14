import { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  isApprovedAdmin,
  readJson,
  requireAdmin,
  requireSameOrigin,
  SESSION_COOKIE,
} from "@/lib/admin-auth";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request);
    return Response.json(
      { email: user.email },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!isSupabaseAdminConfigured() || !process.env.ADMIN_EMAIL?.trim())
      throw new ApiError(503, "Admin access has not been configured yet.");
    const body = (await readJson(request, 4096)) as {
      email?: unknown;
      password?: unknown;
    } | null;
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      body.email.length > 254 ||
      body.password.length > 1024
    )
      throw new ApiError(400, "Enter your email and password.");
    const { data, error } = await createAdminClient().auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });
    if (error || !data.session || !isApprovedAdmin(data.user))
      throw new ApiError(
        401,
        "Unable to sign in. Check your credentials and admin access.",
      );
    const response = NextResponse.json(
      { email: data.user!.email },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: data.session.expires_in,
    });
    return response;
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (e) {
    return apiError(e);
  }
}
