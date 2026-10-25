"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
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
import { apiFetch, applyFieldErrors } from "@/lib/api-client";
import { CATEGORY_COLORS } from "@/lib/categories";
import type { CategoryDTO, TxType } from "@/lib/types";
import { useReturnFocus } from "@/hooks/use-return-focus";
import { categoryCreateSchema, type CategoryCreateInput } from "@/lib/validators/categories";

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDTO | null;
  defaultType: TxType;
}) {
  const focusProps = useReturnFocus();
  const router = useRouter();
  const isEdit = !!category;
  const form = useForm<CategoryCreateInput>({ resolver: zodResolver(categoryCreateSchema) });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? { name: category.name, type: category.type, color: category.color }
          : { name: "", type: defaultType, color: CATEGORY_COLORS[0] },
      );
    }
  }, [open, category, defaultType, form]);

  async function onSubmit(values: CategoryCreateInput) {
    try {
      if (isEdit) {
        await apiFetch(`/api/categories/${category.id}`, {
          method: "PATCH",
          json: { name: values.name, color: values.color },
        });
        toast.success("Category updated");
      } else {
        await apiFetch("/api/categories", { method: "POST", json: values });
        toast.success("Category created");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) {
        toast.error(err instanceof Error ? err.message : "Could not save the category");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...focusProps} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Rename it or pick a different colour." : "Group your transactions the way you think about money."}
          </DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
          {!isEdit && (
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => <TypeToggle name="category-type" value={field.value} onChange={field.onChange} />}
            />
          )}
          <FormField id="cat-name" label="Name" error={errors.name?.message}>
            {(p) => <Input {...p} maxLength={40} placeholder="e.g. Groceries" {...form.register("name")} />}
          </FormField>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Colour</legend>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c, i) => (
                    <label
                      key={c}
                      className="relative flex size-9 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background has-checked:ring-2 has-checked:ring-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring"
                      style={{ background: c }}
                    >
                      <input
                        type="radio"
                        name="category-color"
                        value={c}
                        checked={field.value === c}
                        onChange={() => field.onChange(c)}
                        className="sr-only"
                        aria-label={`Colour ${i + 1}`}
                      />
                      {field.value === c && <Check className="size-4 text-white" aria-hidden />}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.color && <p className="text-xs font-medium text-destructive">{errors.color.message}</p>}
          </fieldset>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
