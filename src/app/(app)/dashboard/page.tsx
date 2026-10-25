import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { Amount } from "@/components/amount";
import { BalanceTrendChart } from "@/components/charts/balance-trend-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { BudgetList } from "@/components/dashboard/budget-list";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
import { PageHeader } from "@/components/page-header";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageUser } from "@/server/auth-helpers";
import { listCategoryRefs } from "@/server/services/categories";
import { getDashboard } from "@/server/services/reports";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const user = await getPageUser();
  const [data, categories] = await Promise.all([getDashboard(user.id), listCategoryRefs(user.id)]);
  const { current, change } = data.months;
  const firstName = user.name.split(" ")[0];
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
  const savingsChange =
    current.savingsRate !== null && data.months.previous.savingsRate !== null
      ? current.savingsRate - data.months.previous.savingsRate
      : null;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`Here's how ${monthName} is going.`}
        actions={<AddTransactionButton categories={categories} />}
      />

      <h2 className="sr-only">This month at a glance</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FadeIn index={0}>
          <KpiCard label="Income this month" value={<Amount minor={current.incomeMinor} whole />} icon={ArrowDownLeft} change={change.income} />
        </FadeIn>
        <FadeIn index={1}>
          <KpiCard
            label="Expenses this month"
            value={<Amount minor={current.expenseMinor} whole />}
            icon={ArrowUpRight}
            change={change.expense}
            goodWhenUp={false}
          />
        </FadeIn>
        <FadeIn index={2}>
          <KpiCard
            label="Net balance"
            value={<Amount minor={data.balanceMinor} whole />}
            icon={Wallet}
            footnote={<>This month: <Amount minor={current.netMinor} /> net</>}
          />
        </FadeIn>
        <FadeIn index={3}>
          <KpiCard
            label="Savings rate"
            value={current.savingsRate === null ? "—" : `${Math.round(current.savingsRate * 100)}%`}
            icon={PiggyBank}
            change={savingsChange}
            changeUnit=" pts"
            footnote={current.savingsRate === null ? "Add income to see your savings rate" : undefined}
          />
        </FadeIn>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <FadeIn index={4} className="lg:col-span-2">
          <Card className="h-full sm:[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base">Income vs expenses</CardTitle>
              <CardDescription>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={data.byMonth} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn index={5}>
          <Card className="h-full sm:[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base">Spending by category</CardTitle>
              <CardDescription>{monthName}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byCategory.length ? (
                <CategoryDonut data={data.byCategory} />
              ) : (
                <EmptyState icon={PiggyBank} title="No spending yet" description="Expenses you add this month appear here." />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn index={6} className="lg:col-span-2">
          <Card className="h-full sm:[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base">Balance trend</CardTitle>
              <CardDescription>Running balance at each month end</CardDescription>
            </CardHeader>
            <CardContent>
              <BalanceTrendChart data={data.trend} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn index={7}>
          <Card className="h-full sm:[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base">Budgets</CardTitle>
              <CardDescription>{monthName} spending vs limits</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetList budgets={data.budgets} />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn index={8} className="lg:col-span-3">
          <Card className="sm:[--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base">Recent transactions</CardTitle>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transactions">View all</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <RecentTransactions items={data.recent} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}
