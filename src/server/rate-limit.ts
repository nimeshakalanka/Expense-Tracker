import "server-only";
import { prisma } from "@/lib/db";

export type LimitRule = { limit: number; windowMs: number; lockMs: number };

export const LOGIN_EMAIL_RULE: LimitRule = { limit: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };
export const LOGIN_IP_RULE: LimitRule = { limit: 20, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };
export const REGISTER_IP_RULE: LimitRule = { limit: 10, windowMs: 60 * 60_000, lockMs: 60 * 60_000 };

export async function isLimited(key: string, now = new Date()): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  return !!row?.lockedUntil && row.lockedUntil > now;
}

export async function recordAttempt(key: string, rule: LimitRule, now = new Date()): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  const windowExpired = !row || now.getTime() - row.windowStart.getTime() > rule.windowMs;
  const count = windowExpired ? 1 : row.count + 1;
  const lockedUntil = count >= rule.limit ? new Date(now.getTime() + rule.lockMs) : null;

  await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count, windowStart: now, lockedUntil },
    update: { count, lockedUntil, ...(windowExpired && { windowStart: now }) },
  });
  return lockedUntil !== null;
}

export async function resetLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
