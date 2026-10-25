import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { TEST_DATABASE_URL } from "./test-db";

export default function setup() {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: "" };
  const sqlite = TEST_DATABASE_URL.startsWith("file:");
  if (sqlite) rmSync("test.db", { force: true });
  execSync("node scripts/prisma-schema.mjs", { env, stdio: "ignore" });
  execSync("npx prisma generate", { env, stdio: "ignore" });
  execSync("npx prisma migrate deploy", { env, stdio: "ignore" });

  return () => {
    if (sqlite) rmSync("test.db", { force: true });
    execSync("node scripts/prisma-schema.mjs", { stdio: "ignore" });
    execSync("npx prisma generate", { stdio: "ignore" });
  };
}
