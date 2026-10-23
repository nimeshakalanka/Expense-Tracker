import { monthKey } from "@/lib/dates";
import type { CategoryBreakdown, CategoryRef, MonthPoint, Summary, TrendPoint, TxType } from "@/lib/types";

export type TxRow = { type: TxType; amountMinor: number; date: Date; categoryId: string };

export function savingsRate(incomeMinor: number, expenseMinor: number): number | null {
  if (incomeMinor <= 0) return null;
  return (incomeMinor - expenseMinor) / incomeMinor;
}

export function summarize(rows: readonly TxRow[]): Summary {
  let incomeMinor = 0;
  let expenseMinor = 0;
  for (const r of rows) {
    if (r.type === "INCOME") incomeMinor += r.amountMinor;
    else expenseMinor += r.amountMinor;
  }
  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
    savingsRate: savingsRate(incomeMinor, expenseMinor),
    count: rows.length,
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function groupByCategory(
  rows: readonly TxRow[],
  categories: readonly CategoryRef[],
  type: TxType = "EXPENSE",
): CategoryBreakdown[] {
  const totals = new Map<string, { totalMinor: number; count: number }>();
  let grand = 0;
  for (const r of rows) {
    if (r.type !== type) continue;
    const t = totals.get(r.categoryId) ?? { totalMinor: 0, count: 0 };
    t.totalMinor += r.amountMinor;
    t.count += 1;
    totals.set(r.categoryId, t);
    grand += r.amountMinor;
  }
  const byId = new Map(categories.map((c) => [c.id, c]));
  return [...totals.entries()]
    .map(([id, t]) => {
      const c = byId.get(id) ?? { id, name: "Unknown", color: "#64748b" };
      return { id: c.id, name: c.name, color: c.color, ...t, share: grand ? t.totalMinor / grand : 0 };
    })
    .sort((a, b) => b.totalMinor - a.totalMinor);
}

export function groupByMonth(rows: readonly TxRow[], months: readonly string[]): MonthPoint[] {
  const points = new Map(months.map((m) => [m, { month: m, incomeMinor: 0, expenseMinor: 0, netMinor: 0 }]));
  for (const r of rows) {
    const p = points.get(monthKey(r.date));
    if (!p) continue;
    if (r.type === "INCOME") p.incomeMinor += r.amountMinor;
    else p.expenseMinor += r.amountMinor;
  }
  for (const p of points.values()) p.netMinor = p.incomeMinor - p.expenseMinor;
  return [...points.values()];
}

export function balanceTrend(
  rows: readonly TxRow[],
  months: readonly string[],
  openingMinor = 0,
): TrendPoint[] {
  let balance = openingMinor;
  return groupByMonth(rows, months).map((p) => {
    balance += p.netMinor;
    return { month: p.month, balanceMinor: balance };
  });
}
