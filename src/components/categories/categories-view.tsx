"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Tags, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Amount } from "@/components/amount";
import { BudgetDialog } from "@/components/categories/budget-dialog";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import type { CategoryDTO, TxType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoriesView({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TxType>("EXPENSE");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [budgetFor, setBudgetFor] = useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  async function removeBudget(c: CategoryDTO) {
    try {
      await apiFetch(`/api/budgets?categoryId=${c.id}`, { method: "DELETE" });
      toast.success(`Budget removed from ${c.name}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove budget");
    }
  }

  const renderGrid = (type: TxType) => {
    const items = categories.filter((c) => c.type === type);
    if (!items.length) {
      return (
        <EmptyState
          icon={Tags}
          title={`No ${type === "INCOME" ? "income" : "expense"} categories`}
          description="Create one to start organising your transactions."
        />
      );
    }
    return (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c, i) => {
          const ratio = c.budgetMinor ? c.monthTotalMinor / c.budgetMinor : 0;
          const pct = Math.round(ratio * 100);
          return (
            <FadeIn as="li" key={c.id} index={i} className="h-full">
              <Card className="h-full gap-3">
                <CardContent className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    <span className="size-3 rounded-full" style={{ background: c.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {c.transactionCount} transaction{c.transactionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil aria-hidden /> Edit
                      </DropdownMenuItem>
                      {c.type === "EXPENSE" && (
                        <DropdownMenuItem onSelect={() => setBudgetFor(c)}>
                          <Target aria-hidden /> {c.budgetMinor ? "Edit budget" : "Set budget"}
                        </DropdownMenuItem>
                      )}
                      {c.budgetMinor !== null && (
                        <DropdownMenuItem onSelect={() => removeBudget(c)}>
                          <X aria-hidden /> Remove budget
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}>
                        <Trash2 aria-hidden /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
                <CardContent className="grid gap-2">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">This month</span>
                    <Amount minor={c.monthTotalMinor} className="font-semibold" />
                  </div>
                  {c.budgetMinor !== null && (
                    <>
                      <div
                        role="progressbar"
                        aria-label={`${c.name} budget used`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(pct, 100)}
                        aria-valuetext={`${pct}% of budget used`}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className={cn(
                            "h-full rounded-full",
                            ratio > 1 ? "bg-expense" : ratio > 0.8 ? "bg-chart-4" : "bg-primary",
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className={cn("text-xs", ratio > 1 ? "font-medium text-expense" : "text-muted-foreground")}>
                        {ratio > 1 ? `Over budget by ${pct - 100}% · ` : `${pct}% of `}
                        <Amount minor={c.budgetMinor} /> budget
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TxType)} className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="EXPENSE">Expense ({categories.filter((c) => c.type === "EXPENSE").length})</TabsTrigger>
            <TabsTrigger value="INCOME">Income ({categories.filter((c) => c.type === "INCOME").length})</TabsTrigger>
          </TabsList>
          <Button
            size="lg"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus aria-hidden /> New category
          </Button>
        </div>
        <TabsContent value="EXPENSE">{renderGrid("EXPENSE")}</TabsContent>
        <TabsContent value="INCOME">{renderGrid("INCOME")}</TabsContent>
      </Tabs>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        category={editing}
        defaultType={tab}
      />
      <BudgetDialog category={budgetFor} onOpenChange={(o) => !o && setBudgetFor(null)} />
      <DeleteCategoryDialog category={deleting} categories={categories} onOpenChange={(o) => !o && setDeleting(null)} />
    </>
  );
}
