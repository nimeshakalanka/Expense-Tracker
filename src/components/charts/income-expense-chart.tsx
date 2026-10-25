"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartLegend, ChartTooltip } from "@/components/charts/chart-tooltip";
import { useCurrency } from "@/components/currency-provider";
import { monthLabel } from "@/lib/dates";
import { formatMoney, fromMinor, toMinor } from "@/lib/money";
import type { MonthPoint } from "@/lib/types";

const SERIES = [
  { key: "income", label: "Income", color: "var(--chart-income)" },
  { key: "expense", label: "Expenses", color: "var(--chart-expense)" },
] as const;

export function IncomeExpenseChart({ data, height = 260 }: { data: MonthPoint[]; height?: number }) {
  const currency = useCurrency();
  const rows = data.map((p) => ({
    month: p.month,
    income: fromMinor(p.incomeMinor),
    expense: fromMinor(p.expenseMinor),
  }));
  const fmt = (v: number) => formatMoney(toMinor(v), currency);
  const summary = data
    .map((p) => `${monthLabel(p.month, true)}: income ${formatMoney(p.incomeMinor, currency)}, expenses ${formatMoney(p.expenseMinor, currency)}`)
    .join("; ");

  return (
    <figure className="grid gap-3">
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color }))} />
      <div style={{ height }} role="img" aria-label={`Income versus expenses by month. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => monthLabel(m)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              width={56}
              tickFormatter={(v: number) => formatMoney(toMinor(v), currency, { compact: true })}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={(p) => <ChartTooltip {...p} format={fmt} labelFormat={(m) => monthLabel(m, true)} />}
            />
            {SERIES.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
