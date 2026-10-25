"use client";

type TooltipEntry = { name?: unknown; value?: unknown; dataKey?: unknown; color?: string; payload?: unknown };

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: unknown;
  format: (v: number) => string;
  labelFormat?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label !== undefined && (
        <p className="mb-1 font-medium">{labelFormat ? labelFormat(String(label)) : String(label)}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-sm"
              style={{ background: (p.payload as { fill?: string })?.fill ?? p.color }}
            />
            <span className="text-muted-foreground">{String(p.name)}</span>
            <span className="tabular ml-auto pl-3 font-medium">{format(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
