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
const { prisma } = await import("@/lib/db");

let a: { id: string };
let b: { id: string };
let aTxId: string;
let aFood: { id: string };

beforeEach(async () => {
  await resetDb();
  a = await makeUser("Alice");
  b = await makeUser("Bob");
  aFood = await categoryOf(a.id, "Food");

  actAs(a.id);
  const res = await txRoute.POST(
    req("/api/transactions", {
      method: "POST",
      json: { type: "EXPENSE", amount: 4321.5, categoryId: aFood.id, description: "Alice secret dinner", date: "2026-10-05" },
    }),
  );
  aTxId = (await res.json()).data.id;
  actAs(b.id);
});

describe("transactions", () => {
  it("B cannot read A's transaction (404, not 403)", async () => {
    const res = await txIdRoute.GET(req(`/api/transactions/${aTxId}`), ctx({ id: aTxId }));
    expect(res.status).toBe(404);
  });

  it("B cannot update A's transaction", async () => {
    const res = await txIdRoute.PATCH(
      req(`/api/transactions/${aTxId}`, { method: "PATCH", json: { amount: 1 } }),
      ctx({ id: aTxId }),
    );
    expect(res.status).toBe(404);
    expect((await prisma.transaction.findUniqueOrThrow({ where: { id: aTxId } })).amountMinor).toBe(432150);
  });

  it("B cannot delete A's transaction", async () => {
    const res = await txIdRoute.DELETE(req(`/api/transactions/${aTxId}`, { method: "DELETE" }), ctx({ id: aTxId }));
    expect(res.status).toBe(404);
    expect(await prisma.transaction.count({ where: { id: aTxId } })).toBe(1);
  });

  it("B's list, search and CSV export never include A's rows", async () => {
    const list = await (await txRoute.GET(req("/api/transactions?q=secret"))).json();
    expect(list.data).toEqual([]);
    expect(list.meta.total).toBe(0);

    const byCat = await (await txRoute.GET(req(`/api/transactions?categoryId=${aFood.id}`))).json();
    expect(byCat.meta.total).toBe(0);

    const csv = await (await exportRoute.GET(req("/api/transactions/export"))).text();
    expect(csv).not.toContain("Alice");
  });

  it("B cannot file a transaction under A's category", async () => {
    const res = await txRoute.POST(
      req("/api/transactions", {
        method: "POST",
        json: { type: "EXPENSE", amount: 10, categoryId: aFood.id, description: "sneaky", date: "2026-10-05" },
      }),
    );
    expect(res.status).toBe(400);
    expect(await prisma.transaction.count({ where: { categoryId: aFood.id } })).toBe(1);
  });

  it("B cannot move their own transaction into A's category", async () => {
    const bFood = await categoryOf(b.id, "Food");
    const created = await (
      await txRoute.POST(
        req("/api/transactions", {
          method: "POST",
          json: { type: "EXPENSE", amount: 10, categoryId: bFood.id, description: "mine", date: "2026-10-05" },
        }),
      )
    ).json();
    const res = await txIdRoute.PATCH(
      req(`/api/transactions/${created.data.id}`, { method: "PATCH", json: { categoryId: aFood.id } }),
      ctx({ id: created.data.id }),
    );
    expect(res.status).toBe(400);
  });
});

describe("categories and budgets", () => {
  it("B only sees their own categories", async () => {
    const { data } = await (await catRoute.GET(req("/api/categories"))).json();
    const ids = await prisma.category.findMany({ where: { userId: b.id }, select: { id: true } });
    expect(data.map((c: { id: string }) => c.id).sort()).toEqual(ids.map((c) => c.id).sort());
    expect(data.find((c: { id: string }) => c.id === aFood.id)).toBeUndefined();
  });

  it("B cannot rename or delete A's category", async () => {
    const patch = await catIdRoute.PATCH(
      req(`/api/categories/${aFood.id}`, { method: "PATCH", json: { name: "Hacked" } }),
      ctx({ id: aFood.id }),
    );
    expect(patch.status).toBe(404);
    const del = await catIdRoute.DELETE(req(`/api/categories/${aFood.id}`, { method: "DELETE" }), ctx({ id: aFood.id }));
    expect(del.status).toBe(404);
    expect((await prisma.category.findUniqueOrThrow({ where: { id: aFood.id } })).name).toBe("Food");
  });

  it("B cannot move their transactions into A's category when deleting", async () => {
    const bOther = await categoryOf(b.id, "Other");
    await txRoute.POST(
      req("/api/transactions", {
        method: "POST",
        json: { type: "EXPENSE", amount: 5, categoryId: bOther.id, description: "x", date: "2026-10-05" },
      }),
    );
    const res = await catIdRoute.DELETE(
      req(`/api/categories/${bOther.id}?reassignTo=${aFood.id}`, { method: "DELETE" }),
      ctx({ id: bOther.id }),
    );
    expect(res.status).toBe(404);
    expect(await prisma.transaction.count({ where: { categoryId: aFood.id } })).toBe(1);
  });

  it("B cannot set a budget on A's category", async () => {
    const res = await budgetRoute.PUT(
      req("/api/budgets", { method: "PUT", json: { categoryId: aFood.id, monthlyLimit: 100 } }),
    );
    expect(res.status).toBe(404);
  });
});

describe("reports", () => {
  it("B's summary and breakdowns are unaffected by A's spending", async () => {
    const range = "?from=2026-10-01&to=2026-10-31";
    const summary = await (
      await reportRoute.GET(req(`/api/reports/summary${range}`), ctx({ report: "summary" }))
    ).json();
    expect(summary.data.summary).toMatchObject({ incomeMinor: 0, expenseMinor: 0, count: 0 });

    const byCat = await (
      await reportRoute.GET(req(`/api/reports/by-category${range}`), ctx({ report: "by-category" }))
    ).json();
    expect(byCat.data).toEqual([]);

    actAs(a.id);
    const aSummary = await (
      await reportRoute.GET(req(`/api/reports/summary${range}`), ctx({ report: "summary" }))
    ).json();
    expect(aSummary.data.summary.expenseMinor).toBe(432150);
  });
});
