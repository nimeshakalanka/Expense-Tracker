import { Receipt } from "lucide-react";
import { Amount } from "@/components/amount";
import { EmptyState } from "@/components/empty-state";
import { CategoryLabel } from "@/components/transactions/category-label";
import { formatDay } from "@/lib/dates";
import type { TransactionDTO } from "@/lib/types";

export function RecentTransactions({ items }: { items: TransactionDTO[] }) {
  if (items.length === 0) {
    return <EmptyState icon={Receipt} title="No transactions yet" description="Add your first income or expense to see it here." />;
  }
  return (
    <ul className="divide-y">
      {items.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t.description}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <CategoryLabel category={t.category} />
              <span aria-hidden>·</span>
              <time dateTime={t.date} className="whitespace-nowrap">{formatDay(t.date)}</time>
            </p>
          </div>
          <Amount minor={t.amountMinor} type={t.type} className="text-sm font-semibold" />
        </li>
      ))}
    </ul>
  );
}
