import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, ChartColumn, PiggyBank, Wallet } from "lucide-react";
import { Amount } from "@/components/amount";
import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { BreakdownTable } from "@/components/reports/breakdown-table";
import { RangePicker } from "@/components/reports/range-picker";
import { CategoryLabel } from "@/components/transactions/category-label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { presetRange } from "@/lib/date-presets";
import { formatDay } from "@/lib/dates";
import { dateRangeSchema } from "@/lib/validators/common";
import { getPageUser } from "@/server/auth-helpers";
import { getByCategory, getByMonth, getSummary, getTopExpenses } from "@/server/services/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const user = await getPageUser();
  const sp = await searchParams;
  const parsed = dateRangeSchema.safeParse({
    from: typeof sp.from === "string" ? sp.from : undefined,
    to: typeof sp.to === "string" ? sp.to : undefined,
  });
  const fallback = presetRange("last-3-months");
  const range = {
    from: (parsed.success && parsed.data.from) || fallback.from,
    to: (parsed.success && parsed.data.to) || fallback.to,
  };

  const [{ summary }, expenses, income, byMonth, top] = await Promise.all([
    getSummary(user.id, range),
    getByCategory(user.id, range, "EXPENSE"),
    getByCategory(user.id, range, "INCOME"),
    getByMonth(user.id, range),
    getTopExpenses(user.id, range),
  ]);
  const rangeLabel = `${formatDay(range.from)} – ${formatDay(range.to)}`;

  return (
    <>
      <PageHeader title="Reports" description="Analyse your income and spending over any period." />
      <RangePicker range={range} />

      {summary.count === 0 ? (
        <div className="mt-6">
          <EmptyState icon={ChartColumn} title="No transactions in this period" description="Pick a different date range." />
        </div>
      ) : (
        <>
          <h2 className="sr-only">Totals for {rangeLabel}</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Income" value={<Amount minor={summary.incomeMinor} whole />} icon={ArrowDownLeft} footnote={rangeLabel} />
            <KpiCard label="Expenses" value={<Amount minor={summary.expenseMinor} whole />} icon={ArrowUpRight} footnote={rangeLabel} />
            <KpiCard label="Net" value={<Amount minor={summary.netMinor} whole />} icon={Wallet} footnote={`${summary.count} transactions`} />
            <KpiCard
              label="Savings rate"
              value={summary.savingsRate === null ? "—" : `${Math.round(summary.savingsRate * 100)}%`}
              icon={PiggyBank}
              footnote="Share of income not spent"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <Card className="lg:col-span-2 sm:[--card-spacing:--spacing(5)]">
              <CardHeader>
                <CardTitle className="text-base">Income vs expenses by month</CardTitle>
                <CardDescription>{rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart data={byMonth} />
              </CardContent>
            </Card>
            <Card className="sm:[--card-spacing:--spacing(5)]">
              <CardHeader>
                <CardTitle className="text-base">Spending by category</CardTitle>
                <CardDescription>{rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length ? (
                  <CategoryDonut data={expenses} />
                ) : (
                  <p className="text-sm text-muted-foreground">No expenses in this period.</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 sm:[--card-spacing:--spacing(5)]">
              <CardHeader>
                <CardTitle className="text-base">Expense breakdown</CardTitle>
                <CardDescription>Each category&apos;s share of total spending</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownTable rows={expenses} totalLabel="% of expenses" />
              </CardContent>
            </Card>
            <Card className="sm:[--card-spacing:--spacing(5)]">
              <CardHeader>
                <CardTitle className="text-base">Top 5 expenses</CardTitle>
                <CardDescription>Largest single purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="divide-y">
                  {top.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description}</p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <CategoryLabel category={t.category} />
                          <span aria-hidden>·</span>
                          <time dateTime={t.date} className="whitespace-nowrap">
                            {formatDay(t.date)}
                          </time>
                        </p>
                      </div>
                      <Amount minor={t.amountMinor} type="EXPENSE" className="text-sm font-semibold" />
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 sm:[--card-spacing:--spacing(5)]">
              <CardHeader>
                <CardTitle className="text-base">Income by source</CardTitle>
                <CardDescription>{rangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownTable rows={income} totalLabel="% of income" />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
