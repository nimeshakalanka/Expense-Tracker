import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  goodWhenUp = true,
  footnote,
  changeUnit = "%",
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  change?: number | null;
  goodWhenUp?: boolean;
  footnote?: React.ReactNode;
  changeUnit?: string;
}) {
  const hasChange = change !== undefined && change !== null && Number.isFinite(change);
  const up = hasChange && change > 0;
  const flat = hasChange && Math.abs(change) < 0.005;
  const good = flat ? null : up === goodWhenUp;
  const ChangeIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="h-full gap-3 sm:[--card-spacing:--spacing(5)]">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-2 text-2xl font-semibold tracking-tight break-words">{value}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4.5" aria-hidden />
        </span>
      </CardContent>
      <CardContent className="text-xs text-muted-foreground">
        {hasChange ? (
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                good === true && "bg-income/10 text-income",
                good === false && "bg-expense/10 text-expense",
                good === null && "bg-muted",
              )}
            >
              <ChangeIcon className="size-3.5" aria-hidden />
              {flat ? `0${changeUnit}` : `${up ? "+" : "−"}${Math.abs(change * 100).toFixed(0)}${changeUnit}`}
            </span>
            vs last month
          </span>
        ) : (
          <span>{footnote ?? "No data for last month"}</span>
        )}
      </CardContent>
    </Card>
  );
}
