"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { useCurrency } from "@/components/currency-provider";
import { formatMoney, fromMinor, toMinor } from "@/lib/money";
import type { CategoryBreakdown } from "@/lib/types";

const MAX_SLICES = 6;
const OTHER_COLOR = "#8a8a86";

function foldSlices(data: CategoryBreakdown[]) {
  if (data.length <= MAX_SLICES) return data;
  const head = data.slice(0, MAX_SLICES - 1);
  const tail = data.slice(MAX_SLICES - 1);
  const totalMinor = tail.reduce((a, c) => a + c.totalMinor, 0);
  return [
    ...head,
    {
      id: "__other",
      name: `Other (${tail.length})`,
      color: OTHER_COLOR,
      totalMinor,
      count: tail.reduce((a, c) => a + c.count, 0),
      share: tail.reduce((a, c) => a + c.share, 0),
    },
  ];
}

export function CategoryDonut({ data }: { data: CategoryBreakdown[] }) {
  const currency = useCurrency();
  const slices = foldSlices(data);
  const total = data.reduce((a, c) => a + c.totalMinor, 0);
  const rows = slices.map((s) => ({ name: s.name, value: fromMinor(s.totalMinor), fill: s.color }));
  const summary = slices.map((s) => `${s.name} ${Math.round(s.share * 100)}%`).join(", ");

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr] lg:grid-cols-1 xl:grid-cols-[170px_1fr]">
      <div className="relative mx-auto size-[180px]" role="img" aria-label={`Spending by category: ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="100%"
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {rows.map((r) => (
                <Cell key={r.name} fill={r.fill} />
              ))}
            </Pie>
            <Tooltip content={(p) => <ChartTooltip {...p} format={(v) => formatMoney(toMinor(v), currency)} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="tabular text-sm font-semibold">{formatMoney(total, currency, { compact: true })}</span>
        </div>
      </div>
      <ul className="grid gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="tabular text-muted-foreground">{Math.round(s.share * 100)}%</span>
            <span className="tabular w-24 text-right font-medium">{formatMoney(s.totalMinor, currency, { compact: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
