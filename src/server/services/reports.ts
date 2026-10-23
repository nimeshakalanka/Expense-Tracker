import "server-only";
import { prisma } from "@/lib/db";
import {
  addMonthsUTC,
  endOfMonthUTC,
  fromISODate,
  monthRange,
  startOfMonthUTC,
  toISODate,
  todayUTC,
} from "@/lib/dates";
import { balanceTrend, groupByCategory, groupByMonth, percentChange, summarize, type TxRow } from "@/lib/reports";
import type { BudgetStatus, CategoryBreakdown, MonthPoint, Summary, TransactionDTO, TrendPoint, TxType } from "@/lib/types";
import { listCategoryRefs } from "@/server/services/categories";
import { getRecentTransactions } from "@/server/services/transactions";

export type ResolvedRange = { from: Date; to: Date };

export function resolveRange(range: { from?: string; to?: string }, now = new Date()): ResolvedRange {
  const to = range.to ? fromISODate(range.to) : endOfMonthUTC(todayUTC(now));
  const from = range.from ? fromISODate(range.from) : addMonthsUTC(startOfMonthUTC(to), -5);
  return { from, to };
}

async function rowsInRange(userId: string, { from, to }: ResolvedRange): Promise<TxRow[]> {
  return prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { type: true, amountMinor: true, date: true, categoryId: true },
  });
}

async function openingBalance(userId: string, before: Date): Promise<number> {
  const sums = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { lt: before } },
    _sum: { amountMinor: true },
  });
  return sums.reduce((acc, s) => acc + (s.type === "INCOME" ? 1 : -1) * (s._sum.amountMinor ?? 0), 0);
}

export type MonthComparison = {
  current: Summary;
  previous: Summary;
  change: { income: number | null; expense: number | null; net: number | null };
};

async function monthComparison(userId: string, now = new Date()): Promise<MonthComparison> {
  const thisStart = startOfMonthUTC(todayUTC(now));
  const lastStart = addMonthsUTC(thisStart, -1);
  const rows = await rowsInRange(userId, { from: lastStart, to: endOfMonthUTC(thisStart) });
  const current = summarize(rows.filter((r) => r.date >= thisStart));
  const previous = summarize(rows.filter((r) => r.date < thisStart));
  return {
    current,
    previous,
    change: {
      income: percentChange(current.incomeMinor, previous.incomeMinor),
      expense: percentChange(current.expenseMinor, previous.expenseMinor),
      net: percentChange(current.netMinor, previous.netMinor),
    },
  };
}

export async function getSummary(userId: string, range: { from?: string; to?: string }) {
  const r = resolveRange(range);
  const [rows, months] = await Promise.all([rowsInRange(userId, r), monthComparison(userId)]);
  return { range: { from: toISODate(r.from), to: toISODate(r.to) }, summary: summarize(rows), months };
}

export async function getByCategory(
  userId: string,
  range: { from?: string; to?: string },
  type: TxType = "EXPENSE",
): Promise<CategoryBreakdown[]> {
  const r = resolveRange(range);
  const [rows, categories] = await Promise.all([rowsInRange(userId, r), listCategoryRefs(userId)]);
  return groupByCategory(rows, categories, type);
}

export async function getByMonth(userId: string, range: { from?: string; to?: string }): Promise<MonthPoint[]> {
  const r = resolveRange(range);
  return groupByMonth(await rowsInRange(userId, r), monthRange(r.from, r.to));
}

export async function getTrend(userId: string, range: { from?: string; to?: string }): Promise<TrendPoint[]> {
  const r = resolveRange(range);
  const [rows, opening] = await Promise.all([rowsInRange(userId, r), openingBalance(userId, r.from)]);
  return balanceTrend(rows, monthRange(r.from, r.to), opening);
}

export async function getTopExpenses(userId: string, range: { from?: string; to?: string }, take = 5) {
  const r = resolveRange(range);
  const rows = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", date: { gte: r.from, lte: r.to } },
    orderBy: [{ amountMinor: "desc" }, { date: "desc" }],
    take,
    select: {
      id: true,
      amountMinor: true,
      description: true,
      date: true,
      category: { select: { id: true, name: true, color: true } },
    },
  });
  return rows.map((t) => ({ ...t, date: toISODate(t.date) }));
}

async function getBudgetStatus(userId: string, now = new Date()): Promise<BudgetStatus[]> {
  const start = startOfMonthUTC(todayUTC(now));
  const [budgets, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      select: { monthlyLimitMinor: true, category: { select: { id: true, name: true, color: true } } },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: start, lte: endOfMonthUTC(start) } },
      _sum: { amountMinor: true },
    }),
  ]);
  const spentBy = new Map(spent.map((s) => [s.categoryId, s._sum.amountMinor ?? 0]));
  return budgets
    .map((b) => {
      const spentMinor = spentBy.get(b.category.id) ?? 0;
      return { ...b.category, limitMinor: b.monthlyLimitMinor, spentMinor, ratio: spentMinor / b.monthlyLimitMinor };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export type DashboardData = {
  months: MonthComparison;
  balanceMinor: number;
  byMonth: MonthPoint[];
  trend: TrendPoint[];
  byCategory: CategoryBreakdown[];
  budgets: BudgetStatus[];
  recent: TransactionDTO[];
};

export async function getDashboard(userId: string, now = new Date()): Promise<DashboardData> {
  const r = resolveRange({}, now);
  const thisMonth = startOfMonthUTC(todayUTC(now));
  const [rows, categories, opening, months, budgets, recent] = await Promise.all([
    rowsInRange(userId, r),
    listCategoryRefs(userId),
    openingBalance(userId, r.from),
    monthComparison(userId, now),
    getBudgetStatus(userId, now),
    getRecentTransactions(userId, 6),
  ]);
  const keys = monthRange(r.from, r.to);
  const trend = balanceTrend(rows, keys, opening);
  return {
    months,
    balanceMinor: trend.at(-1)?.balanceMinor ?? opening,
    byMonth: groupByMonth(rows, keys),
    trend,
    byCategory: groupByCategory(
      rows.filter((x) => x.date >= thisMonth),
      categories,
      "EXPENSE",
    ),
    budgets,
    recent,
  };
}
