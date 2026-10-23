import "server-only";
import { prisma } from "@/lib/db";
import { endOfMonthUTC, startOfMonthUTC, todayUTC } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";
import type { CategoryDTO, CategoryRef, TxType } from "@/lib/types";
import type { BudgetUpsertInput, CategoryCreateInput, CategoryUpdateInput } from "@/lib/validators/categories";
import { AppError, notFound } from "@/server/http";

const duplicateName = () =>
  new AppError("CONFLICT", "You already have a category with this name", {
    fieldErrors: { name: ["Name already used"] },
  });

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function listCategories(userId: string, type?: TxType): Promise<CategoryDTO[]> {
  const today = todayUTC();
  const [categories, monthTotals] = await Promise.all([
    prisma.category.findMany({
      where: { userId, ...(type && { type }) },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } }, budget: { select: { monthlyLimitMinor: true } } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: startOfMonthUTC(today), lte: endOfMonthUTC(today) } },
      _sum: { amountMinor: true },
    }),
  ]);
  const totals = new Map(monthTotals.map((t) => [t.categoryId, t._sum.amountMinor ?? 0]));
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    type: c.type,
    transactionCount: c._count.transactions,
    monthTotalMinor: totals.get(c.id) ?? 0,
    budgetMinor: c.budget?.monthlyLimitMinor ?? null,
  }));
}

export async function listCategoryRefs(userId: string): Promise<(CategoryRef & { type: TxType })[]> {
  return prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, color: true, type: true },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(userId: string, input: CategoryCreateInput): Promise<CategoryRef & { type: TxType }> {
  try {
    return await prisma.category.create({
      data: { userId, ...input },
      select: { id: true, name: true, color: true, type: true },
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw duplicateName();
    throw e;
  }
}

export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryUpdateInput,
): Promise<CategoryRef & { type: TxType }> {
  const existing = await prisma.category.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw notFound("Category");
  try {
    return await prisma.category.update({
      where: { id },
      data: input,
      select: { id: true, name: true, color: true, type: true },
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw duplicateName();
    throw e;
  }
}

export async function deleteCategory(userId: string, id: string, reassignTo?: string): Promise<{ moved: number }> {
  const category = await prisma.category.findFirst({
    where: { id, userId },
    select: { id: true, type: true, _count: { select: { transactions: true } } },
  });
  if (!category) throw notFound("Category");

  const count = category._count.transactions;
  if (count > 0 && !reassignTo) {
    throw new AppError(
      "CONFLICT",
      `This category has ${count} transaction${count === 1 ? "" : "s"}. Move them to another category first.`,
      { transactionCount: count },
    );
  }

  if (count > 0 && reassignTo) {
    if (reassignTo === id) throw new AppError("BAD_REQUEST", "Choose a different category to move transactions to");
    const target = await prisma.category.findFirst({ where: { id: reassignTo, userId }, select: { type: true } });
    if (!target) throw notFound("Target category");
    if (target.type !== category.type) {
      throw new AppError("BAD_REQUEST", "Transactions can only move to a category of the same type");
    }
    const [moved] = await prisma.$transaction([
      prisma.transaction.updateMany({ where: { userId, categoryId: id }, data: { categoryId: reassignTo } }),
      prisma.category.delete({ where: { id } }),
    ]);
    return { moved: moved.count };
  }

  await prisma.category.delete({ where: { id } });
  return { moved: 0 };
}

export async function upsertBudget(userId: string, input: BudgetUpsertInput) {
  const category = await prisma.category.findFirst({
    where: { id: input.categoryId, userId },
    select: { type: true },
  });
  if (!category) throw notFound("Category");
  if (category.type !== "EXPENSE") throw new AppError("BAD_REQUEST", "Budgets can only be set on expense categories");

  const monthlyLimitMinor = toMinor(input.monthlyLimit);
  return prisma.budget.upsert({
    where: { categoryId: input.categoryId },
    create: { userId, categoryId: input.categoryId, monthlyLimitMinor },
    update: { monthlyLimitMinor },
    select: { categoryId: true, monthlyLimitMinor: true },
  });
}

export async function deleteBudget(userId: string, categoryId: string): Promise<void> {
  const { count } = await prisma.budget.deleteMany({ where: { userId, categoryId } });
  if (count === 0) throw notFound("Budget");
}
