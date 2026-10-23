import { z } from "zod";
import { MAX_AMOUNT_MAJOR } from "@/lib/money";

export const txTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const idSchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9]+$/i, "Invalid id");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return y >= 2000 && y <= 2100 && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "Enter a valid date");

export const amountSchema = z.coerce
  .number({ error: "Enter an amount" })
  .positive("Amount must be greater than zero")
  .max(MAX_AMOUNT_MAJOR, `Amount must be at most ${MAX_AMOUNT_MAJOR.toLocaleString("en-US")}`)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Use at most two decimal places");

export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a colour");

export const dateRangeSchema = z
  .object({ from: isoDateSchema.optional(), to: isoDateSchema.optional() })
  .refine((r) => !r.from || !r.to || r.from <= r.to, { path: ["to"], message: "End date must be after start date" });
