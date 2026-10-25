import { Amount } from "@/components/amount";
import { CategoryLabel } from "@/components/transactions/category-label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoryBreakdown } from "@/lib/types";

export function BreakdownTable({ rows, totalLabel }: { rows: CategoryBreakdown[]; totalLabel: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Nothing recorded in this period.</p>;
  const total = rows.reduce((a, r) => a + r.totalMinor, 0);
  const count = rows.reduce((a, r) => a + r.count, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden" aria-hidden>
              #
            </span>
            <span className="sr-only sm:hidden">Transactions</span>
          </TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="hidden text-right sm:table-cell">{totalLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="max-w-[140px] sm:max-w-none">
              <CategoryLabel category={r} />
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted sm:hidden" aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${r.share * 100}%`, background: r.color }} />
              </div>
            </TableCell>
            <TableCell className="tabular text-right">{r.count}</TableCell>
            <TableCell className="text-right font-medium">
              <Amount minor={r.totalMinor} />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${r.share * 100}%`, background: r.color }} />
                </div>
                <span className="tabular w-10 text-right">{(r.share * 100).toFixed(0)}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="tabular text-right font-semibold">{count}</TableCell>
          <TableCell className="text-right font-semibold">
            <Amount minor={total} />
          </TableCell>
          <TableCell className="tabular hidden text-right font-semibold sm:table-cell">100%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
