import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright-core";
import { discoverCatalog, sourceUrl } from "./source";

/** One isolated browser session per import invocation; never uses an admin's cookies. */
export class CatalogBrowserSource {
  private browser?: Browser;
  private context?: BrowserContext;
  private ready?: Promise<void>;
  private home = "https://catalog.udel.edu/index.php";

  constructor(private launch: () => Promise<Browser> = launchCatalogBrowser) {}

  private async initialize() {
    this.browser = await this.launch();
    this.context = await this.browser.newContext();
    this.context.setDefaultTimeout(30000);
    const page = await this.context.newPage();
    try {
      await page.goto(this.home, { waitUntil: "domcontentloaded" });
      await page
        .locator('select[name="catalog"]')
        .waitFor({ state: "attached" });
      const current = await page
        .locator('select[name="catalog"] option')
        .evaluateAll(
          (options) =>
            options
              .map((option) => ({
                id: (option as HTMLOptionElement).value,
                title: option.textContent?.trim() ?? "",
              }))
              .filter((option) =>
                /^\d{4}-\d{4} Undergraduate Catalog$/.test(option.title),
              )
              .sort((a, b) => b.title.localeCompare(a.title))[0],
        );
      if (!current)
        throw new Error("Cannot identify the current undergraduate catalog.");
      const selector = page.locator('select[name="catalog"]');
      if (await selector.inputValue() !== current.id) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
          selector.selectOption(current.id, { force: true }),
        ]);
      }
      // The catalog's selection handler returns to its homepage.
      this.home = sourceUrl(`/index.php?catoid=${current.id}`);
      discoverCatalog(await this.html(page));
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
        page.getByRole("link", { name: /^courses$/i }).click(),
      ]);
      await this.html(page);
    } finally {
      await page.close();
    }
  }

  private async html(page: Page) {
    await page.locator('select[name="catalog"]').waitFor({ state: "attached" });
    const html = await page.content();
    sourceUrl(page.url());
    if (html.length < 1000 || !html.includes("acalog"))
      throw new Error(
        "UDel did not return a complete catalog page in the browser session.",
      );
    return html;
  }

  read = async (url: string): Promise<string> => {
    const target = sourceUrl(url);
    await (this.ready ??= this.initialize());
    const destination =
      target === "https://catalog.udel.edu/" ? this.home : target;
    // BrowserContext's request client shares the session's cookies. Use it for
    // ordinary HTML responses, rendering a page when the source needs JavaScript.
    const response = await this.context!.request.get(destination, {
      headers: { Referer: this.home },
      timeout: 10000,
      maxRedirects: 0,
    }).catch(() => null);
    if (response) {
      try {
        const html = await response.text();
        if (
          response.status() === 200 &&
          html.length > 1000 &&
          html.includes('name="catalog"') &&
          html.includes("acalog")
        )
          return html;
      } finally {
        await response.dispose();
      }
    }
    const page = await this.context!.newPage();
    try {
      await page.goto(destination, {
        referer: this.home,
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      const html = await this.html(page);
      const expectedYear = new URL(target).searchParams.get("catoid");
      if (
        expectedYear &&
        new URL(page.url()).searchParams.get("catoid") !== expectedYear
      )
        throw new Error(
          "Browser navigation changed the requested catalog year.",
        );
      return html;
    } finally {
      await page.close();
    }
  };

  async close() {
    await this.browser?.close();
  }
}

async function launchCatalogBrowser(): Promise<Browser> {
  const binary =
    process.platform === "linux"
      ? (await import("@sparticuz/chromium")).default
      : undefined;
  return chromium.launch({
    headless: true,
    ...(binary
      ? { executablePath: await binary.executablePath(), args: binary.args }
      : { channel: "chrome" }),
  });
}
