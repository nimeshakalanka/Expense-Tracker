import { z } from "zod";
import { amountSchema, idSchema, isoDateSchema, txTypeSchema } from "@/lib/validators/common";

export const transactionCreateSchema = z.object({
  type: txTypeSchema,
  amount: amountSchema,
  categoryId: idSchema,
  description: z.string().trim().min(1, "Add a short description").max(200, "Keep it under 200 characters"),
  date: isoDateSchema,
});

export const transactionUpdateSchema = transactionCreateSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "Nothing to update",
});

const rangeOk = (r: { from?: string; to?: string }) => !r.from || !r.to || r.from <= r.to;
const rangeError = { path: ["to"], message: "End date must be after start date" };

const filterFields = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  type: txTypeSchema.optional(),
  categoryId: idSchema.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["date", "amount", "createdAt"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const transactionFilterSchema = filterFields.refine(rangeOk, rangeError);

export const transactionListSchema = filterFields
  .extend({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(rangeOk, rangeError);

export type TransactionCreateInput = z.output<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.output<typeof transactionUpdateSchema>;
export type TransactionFilter = z.output<typeof transactionFilterSchema>;
export type TransactionListQuery = z.output<typeof transactionListSchema>;
export type TransactionFormValues = z.input<typeof transactionCreateSchema>;
