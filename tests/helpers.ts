import { vi } from "vitest";
import { prisma } from "@/lib/db";
import { createUser } from "@/server/services/users";

export const authMock = vi.fn();

export function actAs(userId: string | null) {
  authMock.mockResolvedValue(userId ? { user: { id: userId }, expires: "2099-01-01" } : null);
}

export async function resetDb() {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rateLimit.deleteMany();
}

export async function makeUser(name: string) {
  return createUser({ name, email: `${name.toLowerCase()}@test.dev`, password: "Password1" });
}

export async function categoryOf(userId: string, name: string) {
  return prisma.category.findFirstOrThrow({ where: { userId, name } });
}

export function req(path: string, init: { method?: string; json?: unknown; headers?: Record<string, string> } = {}) {
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers: { "content-type": "application/json", ...init.headers },
    body: init.json === undefined ? undefined : JSON.stringify(init.json),
  });
}

export const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });
