"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Search,
  SearchX,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Amount } from "@/components/amount";
import { EmptyState } from "@/components/empty-state";
import { CategoryLabel } from "@/components/transactions/category-label";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { type CategoryOption, TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import type { Paginated, TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TransactionListQuery } from "@/lib/validators/transactions";

const SORTS = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Largest amount",
  "amount-asc": "Smallest amount",
} as const;

const FILTER_KEYS = ["q", "type", "categoryId", "from", "to"] as const;

export function TransactionsView({
  result,
  query,
  categories,
}: {
  result: Paginated<TransactionDTO>;
  query: TransactionListQuery;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionDTO | null>(null);
  const [deleting, setDeleting] = useState<TransactionDTO | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = FILTER_KEYS.some((k) => query[k]);
  const sortKey = `${query.sort === "createdAt" ? "date" : query.sort}-${query.order}` as keyof typeof SORTS;

  function update(changes: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams();
    const next = { ...query, ...(resetPage && { page: 1 }), ...changes } as Record<string, unknown>;
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "" || v === "all") continue;
      if ((k === "page" && v === 1) || (k === "pageSize" && v === 20)) continue;
      if ((k === "sort" && v === "date") || (k === "order" && v === "desc")) continue;
      params.set(k, String(v));
    }
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }

  useEffect(() => {
    if (search === (query.q ?? "")) return;
    const t = setTimeout(() => update({ q: search.trim() || undefined }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportParams = new URLSearchParams(
    Object.entries({ ...query }).flatMap(([k, v]) =>
      v !== undefined && !["page", "pageSize"].includes(k) ? [[k, String(v)]] : [],
    ),
  );
  const categoryOptions = categories.filter((c) => !query.type || c.type === query.type);
  const first = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const last = Math.min(result.page * result.pageSize, result.total);

  const openEdit = (t: TransactionDTO) => {
    setEditing(t);
    setFormOpen(true);
  };

  const rowActions = (t: TransactionDTO) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${t.description}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => openEdit(t)}>
          <Pencil aria-hidden /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(t)}>
          <Trash2 aria-hidden /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="lg" asChild>
          <a href={`/api/transactions/export?${exportParams}`} download>
            <Download aria-hidden /> Export CSV
          </a>
        </Button>
        <Button
          size="lg"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden /> Add transaction
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <form
          role="search"
          aria-label="Filter transactions"
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6"
        >
          <div className="grid gap-1.5 sm:col-span-2 xl:col-span-2">
            <Label htmlFor="f-search">Search</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="f-search"
                  type="search"
                  placeholder="Search descriptions"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="md:hidden"
                aria-expanded={showFilters}
                aria-controls="more-filters"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal aria-hidden /> Filters
                {hasFilters && (
                  <>
                    <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                    <span className="sr-only">(active)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div id="more-filters" className={cn("contents", !showFilters && "max-md:hidden")}>
            <div className="grid gap-1.5">
              <Label htmlFor="f-type">Type</Label>
              <Select value={query.type ?? "all"} onValueChange={(v) => update({ type: v, categoryId: undefined })}>
                <SelectTrigger id="f-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-category">Category</Label>
              <Select value={query.categoryId ?? "all"} onValueChange={(v) => update({ categoryId: v })}>
                <SelectTrigger id="f-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span aria-hidden className="size-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-from">From</Label>
              <Input
                id="f-from"
                type="date"
                value={query.from ?? ""}
                max={query.to}
                onChange={(e) => update({ from: e.target.value || undefined })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-to">To</Label>
              <Input
                id="f-to"
                type="date"
                value={query.to ?? ""}
                min={query.from}
                onChange={(e) => update({ to: e.target.value || undefined })}
              />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-2 sm:col-span-2 xl:col-span-6">
              <div className="grid gap-1.5">
                <Label htmlFor="f-sort">Sort by</Label>
                <Select
                  value={sortKey}
                  onValueChange={(v) => {
                    const [sort, order] = v.split("-");
                    update({ sort, order });
                  }}
                >
                  <SelectTrigger id="f-sort" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SORTS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])));
                  }}
                >
                  <X aria-hidden /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      <div aria-busy={pending} className={cn("transition-opacity", pending && "opacity-60")}>
        <p className="sr-only" aria-live="polite">
          {pending ? "Loading transactions" : `${result.total} transactions found`}
        </p>
        {result.total === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No matching transactions"
              description="Try a different search or clear the filters."
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Add your first income or expense to start tracking."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <Plus aria-hidden /> Add transaction
                </Button>
              }
            />
          )
        ) : (
          <Card className="gap-0 py-0">
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">
                      <time dateTime={t.date}>{formatDay(t.date)}</time>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate font-medium">{t.description}</TableCell>
                    <TableCell>
                      <CategoryLabel category={t.category} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.type === "INCOME" ? "text-income" : "text-expense"}>
                        {t.type === "INCOME" ? "Income" : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Amount minor={t.amountMinor} type={t.type} />
                    </TableCell>
                    <TableCell className="pr-4">{rowActions(t)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <ul className="divide-y md:hidden">
              {result.items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <CategoryLabel category={t.category} />
                      <span aria-hidden>·</span>
                      <time dateTime={t.date} className="whitespace-nowrap">
                        {formatDay(t.date)}
                      </time>
                    </p>
                  </div>
                  <Amount minor={t.amountMinor} type={t.type} className="text-sm font-semibold" />
                  {rowActions(t)}
                </li>
              ))}
            </ul>

            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground"
            >
              <span>
                Showing{" "}
                <span className="tabular font-medium text-foreground">
                  {first}–{last}
                </span>{" "}
                of <span className="tabular font-medium text-foreground">{result.total}</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Previous page"
                  disabled={result.page <= 1 || pending}
                  onClick={() => update({ page: String(result.page - 1) }, false)}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <span className="tabular px-2">
                  {result.page} / {result.pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Next page"
                  disabled={result.page >= result.pageCount || pending}
                  onClick={() => update({ page: String(result.page + 1) }, false)}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            </nav>
          </Card>
        )}
      </div>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        categories={categories}
        transaction={editing}
      />
      <DeleteTransactionDialog transaction={deleting} onOpenChange={(o) => !o && setDeleting(null)} />
    </div>
  );
}
