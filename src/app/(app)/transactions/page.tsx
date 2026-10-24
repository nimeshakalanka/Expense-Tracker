import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { transactionListSchema } from "@/lib/validators/transactions";
import { getPageUser } from "@/server/auth-helpers";
import { listCategoryRefs } from "@/server/services/categories";
import { listTransactions } from "@/server/services/transactions";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const user = await getPageUser();
  const raw = Object.fromEntries(
    Object.entries(await searchParams).flatMap(([k, v]) => {
      const value = Array.isArray(v) ? v[0] : v;
      return value ? [[k, value]] : [];
    }),
  );
  const parsed = transactionListSchema.safeParse(raw);
  const query = parsed.success ? parsed.data : transactionListSchema.parse({});

  const [result, categories] = await Promise.all([listTransactions(user.id, query), listCategoryRefs(user.id)]);

  return (
    <>
      <PageHeader title="Transactions" description="Every income and expense, searchable and filterable." />
      <TransactionsView result={result} query={query} categories={categories} />
    </>
  );
}
