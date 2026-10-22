import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { AppError } from "@/server/http";
import type { ChangePasswordInput, ProfileInput } from "@/lib/validators/auth";

const BCRYPT_COST = 12;

const publicUser = { id: true, name: true, email: true, currency: true, createdAt: true } as const;

export type PublicUser = { id: string; name: string; email: string; currency: string; createdAt: Date };

let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("dummy-password-1", BCRYPT_COST));

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function createUser(input: { name: string; email: string; password: string }): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new AppError("CONFLICT", "An account with this email already exists");

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      categories: { create: DEFAULT_CATEGORIES },
    },
    select: publicUser,
  });
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await bcrypt.compare(password, getDummyHash());
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, name: user.name, email: user.email, currency: user.currency, createdAt: user.createdAt };
}

export async function getUser(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUser });
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<PublicUser> {
  return prisma.user.update({ where: { id: userId }, data: input, select: publicUser });
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in");
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("VALIDATION_ERROR", "Current password is incorrect", {
      fieldErrors: { currentPassword: ["Current password is incorrect"] },
    });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}
