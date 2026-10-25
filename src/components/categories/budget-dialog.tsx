"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useCurrency } from "@/components/currency-provider";
import { FormField } from "@/components/form-field";
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
import { apiFetch, applyFieldErrors } from "@/lib/api-client";
import { fromMinor } from "@/lib/money";
import type { CategoryDTO } from "@/lib/types";
import { useReturnFocus } from "@/hooks/use-return-focus";
import { amountSchema } from "@/lib/validators/common";

const schema = z.object({ monthlyLimit: amountSchema });
type Values = z.input<typeof schema>;

export function BudgetDialog({
  category,
  onOpenChange,
}: {
  category: CategoryDTO | null;
  onOpenChange: (open: boolean) => void;
}) {
  const focusProps = useReturnFocus();
  const router = useRouter();
  const currency = useCurrency();
  const form = useForm<Values, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema) });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (category) form.reset({ monthlyLimit: category.budgetMinor ? String(fromMinor(category.budgetMinor)) : "" });
  }, [category, form]);

  async function onSubmit({ monthlyLimit }: z.output<typeof schema>) {
    if (!category) return;
    try {
      await apiFetch("/api/budgets", { method: "PUT", json: { categoryId: category.id, monthlyLimit } });
      toast.success(`Budget saved for ${category.name}`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) toast.error(err instanceof Error ? err.message : "Could not save budget");
    }
  }

  return (
    <Dialog open={!!category} onOpenChange={onOpenChange}>
      <DialogContent {...focusProps} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Monthly budget</DialogTitle>
          <DialogDescription>Set how much you plan to spend on {category?.name} each month.</DialogDescription>
        </DialogHeader>
        <form id="budget-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField id="budget-amount" label={`Limit (${currency})`} error={errors.monthlyLimit?.message}>
            {(p) => <Input {...p} inputMode="decimal" placeholder="0.00" className="tabular" {...form.register("monthlyLimit")} />}
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="budget-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
