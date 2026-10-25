import { describe, expect, it } from "vitest";
import { csvCell } from "@/lib/csv";
import { presetRange } from "@/lib/date-presets";
import { formatMoney, fromMinor, toMinor } from "@/lib/money";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { transactionCreateSchema, transactionListSchema } from "@/lib/validators/transactions";

describe("money", () => {
  it("converts to minor units without float drift", () => {
    expect(toMinor(1250.5)).toBe(125050);
    expect(toMinor(1.005)).toBe(101);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(-19.99)).toBe(-1999);
    expect(fromMinor(125050)).toBe(1250.5);
  });

  it("formats with the chosen currency", () => {
    expect(formatMoney(125050, "USD")).toBe("$1,250.50");
    expect(formatMoney(-500, "USD", { signed: true })).toBe("-$5.00");
    expect(formatMoney(500, "USD", { signed: true })).toBe("+$5.00");
    expect(formatMoney(125_000_000, "USD", { compact: true })).toBe("$1.3M");
    expect(formatMoney(125050, "LKR")).toMatch(/1,250\.50/);
  });
});

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('Dinner, "fancy"')).toBe('"Dinner, ""fancy"""');
    expect(csvCell("plain")).toBe("plain");
  });
  it("neutralises spreadsheet formulas in text", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("leaves numbers (including negatives) untouched", () => {
    expect(csvCell(-12.5)).toBe("-12.5");
  });
});

describe("presetRange", () => {
  const now = new Date(2026, 9, 22);
  it("covers whole months", () => {
    expect(presetRange("this-month", now)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("last-month", now)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetRange("last-3-months", now)).toEqual({ from: "2026-08-01", to: "2026-10-31" });
  });
});

describe("validators", () => {
  const validTx = { type: "EXPENSE", amount: "12.50", categoryId: "abc123", description: "Lunch", date: "2026-10-01" };

  it("accepts a valid transaction and coerces the amount", () => {
    expect(transactionCreateSchema.parse(validTx).amount).toBe(12.5);
  });

  it.each([
    ["negative amount", { amount: -5 }],
    ["zero amount", { amount: 0 }],
    ["three decimals", { amount: 1.234 }],
    ["huge amount", { amount: 1e12 }],
    ["impossible date", { date: "2026-02-30" }],
    ["bad type", { type: "TRANSFER" }],
    ["empty description", { description: "   " }],
    ["injection-looking id", { categoryId: "x' OR 1=1" }],
  ])("rejects %s", (_label, patch) => {
    expect(transactionCreateSchema.safeParse({ ...validTx, ...patch }).success).toBe(false);
  });

  it("applies list defaults and caps page size", () => {
    expect(transactionListSchema.parse({})).toMatchObject({ page: 1, pageSize: 20, sort: "date", order: "desc" });
    expect(transactionListSchema.safeParse({ pageSize: "1000" }).success).toBe(false);
    expect(transactionListSchema.safeParse({ from: "2026-10-10", to: "2026-10-01" }).success).toBe(false);
  });

  it("enforces password rules and matching confirmation on register", () => {
    const base = { name: "Ann", email: "ANN@Example.com ", password: "abcdefg1", confirmPassword: "abcdefg1" };
    expect(registerSchema.parse(base).email).toBe("ann@example.com");
    expect(registerSchema.safeParse({ ...base, password: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "allletters", confirmPassword: "allletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, confirmPassword: "different1" }).success).toBe(false);
  });

  it("login only requires shape, not strength", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});
