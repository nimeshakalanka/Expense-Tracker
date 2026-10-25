"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { useReturnFocus } from "@/hooks/use-return-focus";
import type { CategoryDTO } from "@/lib/types";

export function DeleteCategoryDialog({
  category,
  categories,
  onOpenChange,
}: {
  category: CategoryDTO | null;
  categories: CategoryDTO[];
  onOpenChange: (open: boolean) => void;
}) {
  const focusProps = useReturnFocus();
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const needsTarget = !!category && category.transactionCount > 0;
  const targets = categories.filter((c) => category && c.type === category.type && c.id !== category.id);

  async function confirm() {
    if (!category) return;
    setPending(true);
    try {
      const qs = needsTarget ? `?reassignTo=${encodeURIComponent(target)}` : "";
      const res = await apiFetch<{ moved: number }>(`/api/categories/${category.id}${qs}`, { method: "DELETE" });
      toast.success(
        res.moved ? `Deleted ${category.name} and moved ${res.moved} transactions` : `Deleted ${category.name}`,
      );
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the category");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={!!category}
      onOpenChange={(o) => {
        if (!o) setTarget("");
        onOpenChange(o);
      }}
    >
      <AlertDialogContent {...focusProps}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{category?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {needsTarget
              ? `This category has ${category.transactionCount} transaction${category.transactionCount === 1 ? "" : "s"}. Choose where to move them before deleting.`
              : "This category has no transactions and will be removed permanently."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {needsTarget && (
          <div className="grid gap-1.5">
            <Label htmlFor="reassign-to">Move transactions to</Label>
            {targets.length ? (
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger id="reassign-to" className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span aria-hidden className="size-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Create another category of this type first.</p>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending || (needsTarget && !target)}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {needsTarget ? "Move & delete" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
