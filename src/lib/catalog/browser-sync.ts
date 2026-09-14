import { syncCatalog } from "./sync";

export async function syncCatalogInBrowser(force = false) {
  const { CatalogBrowserSource } = await import("./browser-source");
  const source = new CatalogBrowserSource();
  try {
    return await syncCatalog(force, 230000, source.read, true);
  } finally {
    await source.close();
  }
}
