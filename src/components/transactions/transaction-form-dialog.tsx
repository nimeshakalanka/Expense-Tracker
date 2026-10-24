"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { TypeToggle } from "@/components/transactions/type-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, applyFieldErrors } from "@/lib/api-client";
import { toISODate, todayUTC } from "@/lib/dates";
import { fromMinor } from "@/lib/money";
import { useReturnFocus } from "@/hooks/use-return-focus";
import type { CategoryRef, TransactionDTO, TxType } from "@/lib/types";
import {
  transactionCreateSchema,
  type TransactionCreateInput,
  type TransactionFormValues,
} from "@/lib/validators/transactions";

export type CategoryOption = CategoryRef & { type: TxType };

function defaults(tx?: TransactionDTO | null, type: TxType = "EXPENSE"): TransactionFormValues {
  return tx
    ? {
        type: tx.type,
        amount: String(fromMinor(tx.amountMinor)),
        categoryId: tx.category.id,
        description: tx.description,
        date: tx.date,
      }
    : { type, amount: "", categoryId: "", description: "", date: toISODate(todayUTC()) };
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  transaction,
  defaultType = "EXPENSE",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  transaction?: TransactionDTO | null;
  defaultType?: TxType;
}) {
  const focusProps = useReturnFocus();
  const router = useRouter();
  const isEdit = !!transaction;
  const form = useForm<TransactionFormValues, unknown, TransactionCreateInput>({
    resolver: zodResolver(transactionCreateSchema),
    defaultValues: defaults(transaction, defaultType),
  });
  const { errors, isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const options = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (open) form.reset(defaults(transaction, defaultType));
  }, [open, transaction, defaultType, form]);

  async function onSubmit(values: TransactionCreateInput) {
    try {
      if (isEdit) {
        await apiFetch(`/api/transactions/${transaction.id}`, { method: "PATCH", json: values });
        toast.success("Transaction updated");
      } else {
        await apiFetch("/api/transactions", { method: "POST", json: values });
        toast.success(values.type === "INCOME" ? "Income added" : "Expense added");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) {
        toast.error(err instanceof Error ? err.message : "Could not save the transaction");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...focusProps} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details and save." : "Record money coming in or going out."}
          </DialogDescription>
        </DialogHeader>

        <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <TypeToggle
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  form.setValue("categoryId", "");
                }}
              />
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="tx-amount" label="Amount" error={errors.amount?.message}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="decimal"
                  placeholder="0.00"
                  autoComplete="off"
                  className="tabular"
                  {...form.register("amount")}
                />
              )}
            </FormField>
            <FormField id="tx-date" label="Date" error={errors.date?.message}>
              {(p) => <Input {...p} type="date" {...form.register("date")} />}
            </FormField>
          </div>

          <FormField id="tx-category" label="Category" error={errors.categoryId?.message}>
            {(p) => (
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...p} className="w-full" onBlur={field.onBlur}>
                      <SelectValue placeholder={options.length ? "Choose a category" : "No categories yet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span aria-hidden className="size-2.5 rounded-full" style={{ background: c.color }} />
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField id="tx-description" label="Description" error={errors.description?.message}>
            {(p) => <Input {...p} placeholder="e.g. Groceries at Keells" maxLength={200} {...form.register("description")} />}
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="transaction-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {isEdit ? "Save changes" : "Add transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
