import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAs, categoryOf, ctx, makeUser, req, resetDb } from "../helpers";

vi.mock("@/auth", async () => ({ auth: (await import("../helpers")).authMock }));

const txRoute = await import("@/app/api/transactions/route");
const txIdRoute = await import("@/app/api/transactions/[id]/route");
const exportRoute = await import("@/app/api/transactions/export/route");
const catRoute = await import("@/app/api/categories/route");
const catIdRoute = await import("@/app/api/categories/[id]/route");
const budgetRoute = await import("@/app/api/budgets/route");
const reportRoute = await import("@/app/api/reports/[report]/route");

let user: { id: string };
let food: { id: string };
let salary: { id: string };

async function add(json: Record<string, unknown>) {
  const res = await txRoute.POST(req("/api/transactions", { method: "POST", json }));
  return { status: res.status, body: await res.json() };
}

beforeEach(async () => {
  await resetDb();
  user = await makeUser("Kamal");
  food = await categoryOf(user.id, "Food");
  salary = await categoryOf(user.id, "Salary");
  actAs(user.id);
});

describe("transactions CRUD", () => {
  it("creates, reads, updates and deletes", async () => {
    const created = await add({ type: "EXPENSE", amount: 1250.5, categoryId: food.id, description: "Groceries", date: "2026-10-02" });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      type: "EXPENSE",
      amountMinor: 125050,
      description: "Groceries",
      date: "2026-10-02",
      category: { id: food.id, name: "Food" },
    });
    const id = created.body.data.id;

    const got = await txIdRoute.GET(req(`/api/transactions/${id}`), ctx({ id }));
    expect((await got.json()).data.id).toBe(id);

    const patched = await txIdRoute.PATCH(
      req(`/api/transactions/${id}`, { method: "PATCH", json: { amount: 99.99, description: "Snacks" } }),
      ctx({ id }),
    );
    expect((await patched.json()).data).toMatchObject({ amountMinor: 9999, description: "Snacks" });

    const deleted = await txIdRoute.DELETE(req(`/api/transactions/${id}`, { method: "DELETE" }), ctx({ id }));
    expect(deleted.status).toBe(204);
    expect((await txIdRoute.GET(req(`/api/transactions/${id}`), ctx({ id }))).status).toBe(404);
  });

  it("rejects a category whose type doesn't match", async () => {
    const res = await add({ type: "INCOME", amount: 10, categoryId: food.id, description: "x", date: "2026-10-02" });
    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors.categoryId).toBeDefined();
  });

  it("returns 400 with field details for invalid input", async () => {
    const res = await add({ type: "EXPENSE", amount: "abc", categoryId: food.id, description: "", date: "yesterday" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details.fieldErrors)).toEqual(expect.arrayContaining(["amount", "description", "date"]));
  });

  it("returns 404 for malformed ids", async () => {
    const res = await txIdRoute.GET(req("/api/transactions/../../etc"), ctx({ id: "../../etc" }));
    expect(res.status).toBe(404);
  });
});

describe("listing", () => {
  beforeEach(async () => {
    await add({ type: "INCOME", amount: 300000, categoryId: salary.id, description: "Salary Oct", date: "2026-10-01" });
    await add({ type: "EXPENSE", amount: 500, categoryId: food.id, description: "Coffee", date: "2026-10-03" });
    await add({ type: "EXPENSE", amount: 2500, categoryId: food.id, description: "Dinner out", date: "2026-09-20" });
    await add({ type: "EXPENSE", amount: 100, categoryId: food.id, description: "coffee beans", date: "2026-08-15" });
  });

  const list = async (qs: string) => (await txRoute.GET(req(`/api/transactions${qs}`))).json();

  it("paginates newest first by default", async () => {
    const page1 = await list("?pageSize=2");
    expect(page1.meta).toMatchObject({ total: 4, page: 1, pageSize: 2, pageCount: 2 });
    expect(page1.data.map((t: { date: string }) => t.date)).toEqual(["2026-10-03", "2026-10-01"]);
    const page2 = await list("?pageSize=2&page=2");
    expect(page2.data.map((t: { date: string }) => t.date)).toEqual(["2026-09-20", "2026-08-15"]);
  });

  it("filters by type, category, date range and search (case-insensitive)", async () => {
    expect((await list("?type=INCOME")).meta.total).toBe(1);
    expect((await list(`?categoryId=${food.id}`)).meta.total).toBe(3);
    expect((await list("?from=2026-09-01&to=2026-09-30")).data[0].description).toBe("Dinner out");
    expect((await list("?q=COFFEE")).meta.total).toBe(2);
  });

  it("sorts by amount", async () => {
    const asc = await list("?sort=amount&order=asc");
    expect(asc.data.map((t: { amountMinor: number }) => t.amountMinor)).toEqual([10000, 50000, 250000, 30000000]);
  });

  it("rejects invalid query parameters", async () => {
    const res = await txRoute.GET(req("/api/transactions?sort=password"));
    expect(res.status).toBe(400);
  });

  it("exports the filtered rows as CSV with signed amounts", async () => {
    const res = await exportRoute.GET(req("/api/transactions/export?from=2026-10-01"));
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    const lines = (await res.text()).replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toBe("Date,Type,Category,Description,Amount");
    expect(lines.slice(1)).toEqual([
      "2026-10-03,Expense,Food,Coffee,-500.00",
      "2026-10-01,Income,Salary,Salary Oct,300000.00",
    ]);
  });

  it("summary totals match the data", async () => {
    const res = await reportRoute.GET(req("/api/reports/summary?from=2026-08-01&to=2026-10-31"), ctx({ report: "summary" }));
    expect((await res.json()).data.summary).toEqual({
      incomeMinor: 30000000,
      expenseMinor: 310000,
      netMinor: 29690000,
      savingsRate: 29690000 / 30000000,
      count: 4,
    });
    const byMonth = await (
      await reportRoute.GET(req("/api/reports/by-month?from=2026-08-01&to=2026-10-31"), ctx({ report: "by-month" }))
    ).json();
    expect(byMonth.data.map((m: { month: string; expenseMinor: number }) => [m.month, m.expenseMinor])).toEqual([
      ["2026-08", 10000],
      ["2026-09", 250000],
      ["2026-10", 50000],
    ]);
    const unknown = await reportRoute.GET(req("/api/reports/nope"), ctx({ report: "nope" }));
    expect(unknown.status).toBe(404);
  });
});

describe("categories", () => {
  it("creates a category and rejects duplicates by name and type", async () => {
    const make = () =>
      catRoute.POST(req("/api/categories", { method: "POST", json: { name: "Pets", type: "EXPENSE", color: "#2a78d6" } }));
    expect((await make()).status).toBe(201);
    const dup = await make();
    expect(dup.status).toBe(409);
  });

  it("blocks deleting a category with transactions, then reassigns", async () => {
    await add({ type: "EXPENSE", amount: 10, categoryId: food.id, description: "a", date: "2026-10-01" });
    await add({ type: "EXPENSE", amount: 20, categoryId: food.id, description: "b", date: "2026-10-02" });

    const blocked = await catIdRoute.DELETE(req(`/api/categories/${food.id}`, { method: "DELETE" }), ctx({ id: food.id }));
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error.details).toEqual({ transactionCount: 2 });

    const wrongType = await catIdRoute.DELETE(
      req(`/api/categories/${food.id}?reassignTo=${salary.id}`, { method: "DELETE" }),
      ctx({ id: food.id }),
    );
    expect(wrongType.status).toBe(400);

    const other = await categoryOf(user.id, "Other");
    const ok = await catIdRoute.DELETE(
      req(`/api/categories/${food.id}?reassignTo=${other.id}`, { method: "DELETE" }),
      ctx({ id: food.id }),
    );
    expect((await ok.json()).data).toEqual({ moved: 2 });
    const list = await (await txRoute.GET(req(`/api/transactions?categoryId=${other.id}`))).json();
    expect(list.meta.total).toBe(2);
  });

  it("only allows budgets on expense categories", async () => {
    const incomeBudget = await budgetRoute.PUT(
      req("/api/budgets", { method: "PUT", json: { categoryId: salary.id, monthlyLimit: 100 } }),
    );
    expect(incomeBudget.status).toBe(400);
    const ok = await budgetRoute.PUT(req("/api/budgets", { method: "PUT", json: { categoryId: food.id, monthlyLimit: 500.25 } }));
    expect((await ok.json()).data).toEqual({ categoryId: food.id, monthlyLimitMinor: 50025 });
  });
});
