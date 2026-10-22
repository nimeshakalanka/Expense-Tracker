// Shared by prisma7.config.ts and scripts/prisma-schema.mjs.
// The database provider is derived from DATABASE_URL so that switching from
// local SQLite to hosted Postgres is a one-line env change.

export const DEFAULT_DATABASE_URL = "file:./dev.db";

/** @param {string | undefined} url */
export function providerFromUrl(url) {
  // Fresh clones run `npm install` before creating .env; fall back to SQLite.
  if (!url) return "sqlite";
  if (url.startsWith("file:")) return "sqlite";
  if (/^(postgres|postgresql|prisma\+postgres):\/\//.test(url)) return "postgresql";
  throw new Error(`Unsupported DATABASE_URL scheme: ${url.split(":")[0]}`);
}

/** Loads .env when present (Vercel injects env vars directly, so it is optional). */
export function loadEnv() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // no .env file — rely on the real environment
  }
}
