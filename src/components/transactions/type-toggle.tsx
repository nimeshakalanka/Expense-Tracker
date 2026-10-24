"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TypeToggle({
  value,
  onChange,
  name = "type",
}: {
  value: TxType;
  onChange: (v: TxType) => void;
  name?: string;
}) {
  const options = [
    { value: "EXPENSE" as const, label: "Expense", icon: ArrowUpRight, active: "bg-card text-expense shadow-sm" },
    { value: "INCOME" as const, label: "Income", icon: ArrowDownLeft, active: "bg-card text-income shadow-sm" },
  ];
  return (
    <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            value === o.value && o.active,
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          <o.icon className="size-4" aria-hidden />
          {o.label}
        </label>
      ))}
    </div>
  );
}
