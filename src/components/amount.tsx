"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { TxType } from "@/lib/types";
import { useCurrency } from "@/components/currency-provider";

export function Amount({
  minor,
  type,
  className,
  compact,
  whole,
}: {
  minor: number;
  type?: TxType;
  className?: string;
  compact?: boolean;
  whole?: boolean;
}) {
  const currency = useCurrency();
  const signed = type ? (type === "INCOME" ? minor : -minor) : minor;
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap",
        type === "INCOME" && "text-income",
        type === "EXPENSE" && "text-expense",
        className,
      )}
    >
      {formatMoney(signed, currency, { signed: !!type, compact, whole })}
    </span>
  );
}
