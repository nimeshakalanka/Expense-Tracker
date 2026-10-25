import type { Metadata } from "next";
import { CategoriesView } from "@/components/categories/categories-view";
import { PageHeader } from "@/components/page-header";
import { getPageUser } from "@/server/auth-helpers";
import { listCategories } from "@/server/services/categories";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await getPageUser();
  const categories = await listCategories(user.id);
  return (
    <>
      <PageHeader title="Categories" description="Organise transactions and set monthly budgets for expenses." />
      <CategoriesView categories={categories} />
    </>
  );
}
