"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Amount } from "@/components/amount";
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
import { apiFetch } from "@/lib/api-client";
import { useReturnFocus } from "@/hooks/use-return-focus";
import type { TransactionDTO } from "@/lib/types";

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
}: {
  transaction: TransactionDTO | null;
  onOpenChange: (open: boolean) => void;
}) {
  const focusProps = useReturnFocus();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!transaction) return;
    setPending(true);
    try {
      await apiFetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      toast.success("Transaction deleted");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the transaction");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={!!transaction} onOpenChange={onOpenChange}>
      <AlertDialogContent {...focusProps}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction && (
              <>
                “{transaction.description}” (<Amount minor={transaction.amountMinor} type={transaction.type} />) will be
                permanently removed. This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
