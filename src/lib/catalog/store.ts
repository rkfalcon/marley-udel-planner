import { createAdminClient } from "../supabase/server";
import type { CatalogState, CatalogSnapshot } from "./types";
export async function readCatalogState(): Promise<CatalogState> {
  const { data, error } = await createAdminClient()
    .from("catalog_sync")
    .select("state")
    .eq("id", "udel")
    .single();
  if (error || !data)
    throw new Error("Catalog automation database is unavailable.");
  return data.state as CatalogState;
}
export async function readSnapshot(
  id?: string,
): Promise<CatalogSnapshot | null> {
  if (!id) return null;
  const { data, error } = await createAdminClient()
    .from("catalog_versions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("Published catalog is unavailable.");
  return data as CatalogSnapshot;
}
export async function claimCatalog() {
  const token = crypto.randomUUID();
  const { data, error } = await createAdminClient().rpc("claim_catalog_sync", {
    token,
  });
  if (error) throw new Error("Cannot acquire catalog synchronization lease.");
  if (!data?.length) return null;
  return { token, state: data[0].state as CatalogState };
}
export async function saveState(
  state: CatalogState,
  token: string,
  release = false,
) {
  const { data, error } = await createAdminClient()
    .from("catalog_sync")
    .update({
      state,
      ...(release ? { lease_token: null, lease_until: null } : {}),
    })
    .eq("id", "udel")
    .eq("lease_token", token)
    .gt("lease_until", new Date().toISOString())
    .select("id");
  if (error || !data?.length)
    throw new Error("Catalog lease expired; stale update rejected.");
}
export async function writeSnapshot(
  snapshot: Omit<CatalogSnapshot, "created_at">,
) {
  const { error } = await createAdminClient()
    .from("catalog_versions")
    .insert(snapshot);
  if (error) throw new Error("Cannot save verified catalog version.");
}
