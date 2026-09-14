import { syncCatalogInBrowser as syncCatalog } from "@/lib/catalog/browser-sync";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncCatalog();
    return Response.json(result, {
      status: result.status === "failed" ? 502 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Catalog worker unavailable." },
      { status: 503 },
    );
  }
}
