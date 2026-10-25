import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": r("./src"),
      // `server-only` throws outside a React Server Components bundle.
      "server-only": r("./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // API tests share one SQLite file, so run test files one at a time.
    fileParallelism: false,
    env: {
      // Keep in sync with tests/test-db.ts.
      DATABASE_URL: process.env.TEST_DATABASE_URL || "file:./test.db",
      AUTH_SECRET: "test-secret-not-used-in-production",
    },
  },
});
