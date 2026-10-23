import "server-only";
import { prisma } from "@/lib/db";
import { isPostgres } from "@/lib/prisma-client";
import { fromISODate, toISODate } from "@/lib/dates";
import { csvCell } from "@/lib/csv";
import { toMinor } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";
import type { Paginated, TransactionDTO, TxType } from "@/lib/types";
import type {
  TransactionCreateInput,
  TransactionFilter,
  TransactionListQuery,
  TransactionUpdateInput,
} from "@/lib/validators/transactions";
import { AppError, notFound } from "@/server/http";

const select = {
  id: true,
  type: true,
  amountMinor: true,
  description: true,
  date: true,
  createdAt: true,
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TransactionSelect;

type Row = Prisma.TransactionGetPayload<{ select: typeof select }>;

function toDTO(t: Row): TransactionDTO {
  return {
    id: t.id,
    type: t.type,
    amountMinor: t.amountMinor,
    description: t.description,
    date: toISODate(t.date),
    category: t.category,
    createdAt: t.createdAt.toISOString(),
  };
}

function buildWhere(userId: string, f: Partial<TransactionFilter>): Prisma.TransactionWhereInput {
  return {
    userId,
    ...(f.type && { type: f.type }),
    ...(f.categoryId && { categoryId: f.categoryId }),
    ...((f.from || f.to) && {
      date: {
        ...(f.from && { gte: fromISODate(f.from) }),
        ...(f.to && { lte: fromISODate(f.to) }),
      },
    }),
    ...(f.q && {
      description: { contains: f.q, ...(isPostgres() && { mode: "insensitive" as const }) },
    }),
  };
}

function buildOrderBy(f: Pick<TransactionFilter, "sort" | "order">): Prisma.TransactionOrderByWithRelationInput[] {
  const field = f.sort === "amount" ? "amountMinor" : f.sort;
  return [{ [field]: f.order }, { createdAt: f.order }, { id: f.order }];
}

async function assertCategory(userId: string, categoryId: string, type: TxType) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId }, select: { type: true } });
  if (!category) {
    throw new AppError("VALIDATION_ERROR", "Choose one of your categories", {
      fieldErrors: { categoryId: ["Category not found"] },
    });
  }
  if (category.type !== type) {
    throw new AppError("VALIDATION_ERROR", "Category does not match the transaction type", {
      fieldErrors: { categoryId: [`Pick an ${type.toLowerCase()} category`] },
    });
  }
}

export async function listTransactions(userId: string, q: TransactionListQuery): Promise<Paginated<TransactionDTO>> {
  const where = buildWhere(userId, q);
  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      select,
      orderBy: buildOrderBy(q),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return {
    items: rows.map(toDTO),
    total,
    page: q.page,
    pageSize: q.pageSize,
    pageCount: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export async function getTransaction(userId: string, id: string): Promise<TransactionDTO> {
  const row = await prisma.transaction.findFirst({ where: { id, userId }, select });
  if (!row) throw notFound("Transaction");
  return toDTO(row);
}

export async function getRecentTransactions(userId: string, take = 5): Promise<TransactionDTO[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId },
    select,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(toDTO);
}

export async function createTransaction(userId: string, input: TransactionCreateInput): Promise<TransactionDTO> {
  await assertCategory(userId, input.categoryId, input.type);
  const row = await prisma.transaction.create({
    data: {
      userId,
      categoryId: input.categoryId,
      type: input.type,
      amountMinor: toMinor(input.amount),
      description: input.description,
      date: fromISODate(input.date),
    },
    select,
  });
  return toDTO(row);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionUpdateInput,
): Promise<TransactionDTO> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId }, select: { type: true, categoryId: true } });
  if (!existing) throw notFound("Transaction");

  const type = input.type ?? existing.type;
  const categoryId = input.categoryId ?? existing.categoryId;
  if (input.type || input.categoryId) await assertCategory(userId, categoryId, type);

  const row = await prisma.transaction.update({
    where: { id },
    data: {
      type,
      categoryId,
      ...(input.amount !== undefined && { amountMinor: toMinor(input.amount) }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.date !== undefined && { date: fromISODate(input.date) }),
    },
    select,
  });
  return toDTO(row);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const { count } = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (count === 0) throw notFound("Transaction");
}

const EXPORT_LIMIT = 10_000;

export async function exportTransactionsCsv(userId: string, f: TransactionFilter): Promise<string> {
  const rows = await prisma.transaction.findMany({
    where: buildWhere(userId, f),
    select,
    orderBy: buildOrderBy(f),
    take: EXPORT_LIMIT,
  });
  const header = ["Date", "Type", "Category", "Description", "Amount"];
  const lines = rows.map((r) => {
    const text = [toISODate(r.date), r.type === "INCOME" ? "Income" : "Expense", r.category.name, r.description];
    const amount = (((r.type === "INCOME" ? 1 : -1) * r.amountMinor) / 100).toFixed(2);
    return [...text.map(csvCell), amount].join(",");
  });
  return "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n";
}
