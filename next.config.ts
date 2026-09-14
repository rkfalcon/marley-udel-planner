import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/cron/catalog-sync": [
      "node_modules/@sparticuz/chromium/bin/**",
      "node_modules/playwright-core/**",
    ],
    "/api/admin/catalog": [
      "node_modules/@sparticuz/chromium/bin/**",
      "node_modules/playwright-core/**",
    ],
  },
};

export default nextConfig;
