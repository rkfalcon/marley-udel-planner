import { readCatalogState, readSnapshot } from "@/lib/catalog/store";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const version = url.searchParams.get("version");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    if (
      (version && !/^[0-9a-f-]{36}$/.test(version)) ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset > 15000
    )
      return Response.json({ error: "Invalid catalog page." }, { status: 400 });
    const state = version ? null : await readCatalogState();
    const snapshot = await readSnapshot(version ?? state?.activeVersion);
    return Response.json(
      snapshot
        ? {
            version: snapshot.id,
            source: snapshot.source,
            courses: snapshot.courses.slice(offset, offset + 500),
            nextOffset:
              offset + 500 < snapshot.courses.length ? offset + 500 : null,
          }
        : { version: null, source: null, courses: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Catalog unavailable; keeping the last loaded course list." },
      { status: 503 },
    );
  }
}
