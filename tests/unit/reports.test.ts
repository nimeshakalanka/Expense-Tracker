import { describe, expect, it } from "vitest";
import { monthRange } from "@/lib/dates";
import {
  balanceTrend,
  groupByCategory,
  groupByMonth,
  percentChange,
  savingsRate,
  summarize,
  type TxRow,
} from "@/lib/reports";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const rows: TxRow[] = [
  { type: "INCOME", amountMinor: 300_000_00, date: d("2026-08-01"), categoryId: "salary" },
  { type: "EXPENSE", amountMinor: 85_000_00, date: d("2026-08-02"), categoryId: "rent" },
  { type: "EXPENSE", amountMinor: 15_000_50, date: d("2026-08-20"), categoryId: "food" },
  { type: "INCOME", amountMinor: 300_000_00, date: d("2026-10-01"), categoryId: "salary" },
  { type: "EXPENSE", amountMinor: 5_000_25, date: d("2026-10-31"), categoryId: "food" },
];
const categories = [
  { id: "salary", name: "Salary", color: "#1baf7a" },
  { id: "rent", name: "Rent", color: "#2a78d6" },
  { id: "food", name: "Food", color: "#eb6834" },
];

describe("summarize", () => {
  it("totals income, expenses, net and count", () => {
    expect(summarize(rows)).toEqual({
      incomeMinor: 600_000_00,
      expenseMinor: 105_000_75,
      netMinor: 494_999_25,
      savingsRate: 494_999_25 / 600_000_00,
      count: 5,
    });
  });

  it("handles an empty list", () => {
    expect(summarize([])).toEqual({ incomeMinor: 0, expenseMinor: 0, netMinor: 0, savingsRate: null, count: 0 });
  });
});

describe("savingsRate", () => {
  it("is null without income (avoids dividing by zero)", () => {
    expect(savingsRate(0, 500)).toBeNull();
  });
  it("can be negative when spending exceeds income", () => {
    expect(savingsRate(1000, 1500)).toBe(-0.5);
  });
  it("is 1 when nothing is spent", () => {
    expect(savingsRate(1000, 0)).toBe(1);
  });
});

describe("percentChange", () => {
  it("computes relative change", () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(80, 100)).toBeCloseTo(-0.2);
  });
  it("is null when the previous value is zero", () => {
    expect(percentChange(50, 0)).toBeNull();
  });
  it("uses the absolute previous value for negative bases", () => {
    expect(percentChange(-50, -100)).toBeCloseTo(0.5);
  });
});

describe("groupByCategory", () => {
  it("sums one type per category, sorted by total, with shares", () => {
    const result = groupByCategory(rows, categories, "EXPENSE");
    expect(result.map((r) => [r.name, r.totalMinor, r.count])).toEqual([
      ["Rent", 85_000_00, 1],
      ["Food", 20_000_75, 2],
    ]);
    expect(result.reduce((a, r) => a + r.share, 0)).toBeCloseTo(1);
  });

  it("labels unknown categories instead of dropping them", () => {
    const [row] = groupByCategory([{ ...rows[1], categoryId: "gone" }], categories);
    expect(row.name).toBe("Unknown");
  });
});

describe("groupByMonth", () => {
  it("returns every month in range, including empty ones", () => {
    const months = monthRange(d("2026-08-15"), d("2026-10-15"));
    expect(months).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(groupByMonth(rows, months)).toEqual([
      { month: "2026-08", incomeMinor: 300_000_00, expenseMinor: 100_000_50, netMinor: 199_999_50 },
      { month: "2026-09", incomeMinor: 0, expenseMinor: 0, netMinor: 0 },
      { month: "2026-10", incomeMinor: 300_000_00, expenseMinor: 5_000_25, netMinor: 294_999_75 },
    ]);
  });

  it("buckets by UTC date (31 Oct stays in October)", () => {
    const [oct] = groupByMonth([rows[4]], ["2026-10"]);
    expect(oct.expenseMinor).toBe(5_000_25);
  });
});

describe("balanceTrend", () => {
  it("accumulates net per month on top of the opening balance", () => {
    const trend = balanceTrend(rows, ["2026-08", "2026-09", "2026-10"], 10_000_00);
    expect(trend.map((p) => p.balanceMinor)).toEqual([209_999_50, 209_999_50, 504_999_25]);
  });
});
