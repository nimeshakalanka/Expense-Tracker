import { PrismaClient } from "@/generated/prisma/client";

export function createPrismaClient(url = process.env.DATABASE_URL ?? "file:./dev.db") {
  if (url.startsWith("file:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
  const max = Number(process.env.DATABASE_POOL_MAX) || undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ...(max && { max }) }) });
}

export const isPostgres = () => /^(postgres|postgresql|prisma\+postgres):\/\//.test(process.env.DATABASE_URL ?? "");
