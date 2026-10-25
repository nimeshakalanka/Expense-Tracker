"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { useCurrency } from "@/components/currency-provider";
import { monthLabel } from "@/lib/dates";
import { formatMoney, fromMinor, toMinor } from "@/lib/money";
import type { TrendPoint } from "@/lib/types";

export function BalanceTrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  const currency = useCurrency();
  const rows = data.map((p) => ({ month: p.month, balance: fromMinor(p.balanceMinor) }));
  const summary = data.map((p) => `${monthLabel(p.month, true)} ${formatMoney(p.balanceMinor, currency)}`).join("; ");

  return (
    <div style={{ height }} role="img" aria-label={`Balance at the end of each month. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
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
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
            content={(p) => (
              <ChartTooltip
                {...p}
                format={(v) => formatMoney(toMinor(v), currency)}
                labelFormat={(m) => monthLabel(m, true)}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="balance"
            isAnimationActive={false}
            name="Balance"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
