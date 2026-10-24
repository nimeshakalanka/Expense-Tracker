"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CategoryOption, TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

export function AddTransactionButton({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Add transaction
      </Button>
      <TransactionFormDialog open={open} onOpenChange={setOpen} categories={categories} />
    </>
  );
}
