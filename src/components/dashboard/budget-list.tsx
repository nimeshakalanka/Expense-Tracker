import Link from "next/link";
import { Target } from "lucide-react";
import { Amount } from "@/components/amount";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { BudgetStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BudgetList({ budgets }: { budgets: BudgetStatus[] }) {
  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No budgets set"
        description="Set monthly limits on expense categories to track your spending."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">Set a budget</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ul className="grid gap-4">
      {budgets.map((b) => {
        const pct = Math.round(b.ratio * 100);
        const over = b.ratio > 1;
        return (
          <li key={b.id} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
                <span className="truncate">{b.name}</span>
              </span>
              <span className={cn("tabular text-xs", over ? "font-medium text-expense" : "text-muted-foreground")}>
                {over ? `Over by ${pct - 100}%` : `${pct}%`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${b.name} budget used`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(pct, 100)}
              aria-valuetext={`${pct}% of budget used`}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn("h-full rounded-full", over ? "bg-expense" : b.ratio > 0.8 ? "bg-chart-4" : "bg-primary")}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              <Amount minor={b.spentMinor} /> of <Amount minor={b.limitMinor} />
            </p>
          </li>
        );
      })}
    </ul>
  );
}
