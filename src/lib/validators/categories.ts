import { z } from "zod";
import { amountSchema, hexColorSchema, idSchema, txTypeSchema } from "@/lib/validators/common";

const categoryName = z.string().trim().min(1, "Name is required").max(40, "Keep it under 40 characters");

export const categoryCreateSchema = z.object({
  name: categoryName,
  type: txTypeSchema,
  color: hexColorSchema,
});

export const categoryUpdateSchema = z
  .object({ name: categoryName.optional(), color: hexColorSchema.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

export const categoryDeleteSchema = z.object({ reassignTo: idSchema.optional() });

export const categoryListSchema = z.object({ type: txTypeSchema.optional() });

export const budgetUpsertSchema = z.object({
  categoryId: idSchema,
  monthlyLimit: amountSchema,
});

export const budgetDeleteSchema = z.object({ categoryId: idSchema });

export type CategoryCreateInput = z.output<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.output<typeof categoryUpdateSchema>;
export type BudgetUpsertInput = z.output<typeof budgetUpsertSchema>;
