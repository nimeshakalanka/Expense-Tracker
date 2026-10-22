import { defineConfig } from "prisma/config";
import { DEFAULT_DATABASE_URL, loadEnv, providerFromUrl } from "./scripts/db-provider.mjs";

loadEnv();
const provider = providerFromUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Each provider keeps its own migration history (SQL dialects differ).
    path: `prisma/migrations/${provider}`,
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Neon/Supabase: migrations should use the direct (non-pooled) URL.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
  },
});
