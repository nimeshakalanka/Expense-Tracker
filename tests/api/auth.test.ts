import { beforeEach, describe, expect, it, vi } from "vitest";
import { actAs, req, resetDb } from "../helpers";

vi.mock("@/auth", async () => ({ auth: (await import("../helpers")).authMock }));

const { POST: register } = await import("@/app/api/auth/register/route");
const { GET: listTx } = await import("@/app/api/transactions/route");
const { GET: getProfile, PATCH: patchProfile } = await import("@/app/api/profile/route");
const { POST: changePassword } = await import("@/app/api/profile/password/route");
const { GET: report } = await import("@/app/api/reports/[report]/route");
const { LOGIN_EMAIL_RULE, isLimited, recordAttempt, resetLimit } = await import("@/server/rate-limit");
const { verifyCredentials } = await import("@/server/services/users");
const { prisma } = await import("@/lib/db");

const body = { name: "Nimal Perera", email: "nimal@test.dev", password: "Secret123", confirmPassword: "Secret123" };

beforeEach(async () => {
  await resetDb();
  actAs(null);
});

describe("POST /api/auth/register", () => {
  it("creates the user with a hashed password and default categories", async () => {
    const res = await register(req("/api/auth/register", { method: "POST", json: body }));
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data).toEqual({ id: expect.any(String), name: "Nimal Perera", email: "nimal@test.dev" });
    expect(data).not.toHaveProperty("passwordHash");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: data.id }, include: { categories: true } });
    expect(user.passwordHash).not.toContain("Secret123");
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(user.categories.map((c) => c.name)).toEqual(
      expect.arrayContaining(["Salary", "Freelance", "Food", "Transport", "Rent", "Bills", "Shopping", "Health", "Entertainment", "Other"]),
    );
  });

  it("rejects a duplicate email (case-insensitive) with 409", async () => {
    await register(req("/api/auth/register", { method: "POST", json: body }));
    const res = await register(req("/api/auth/register", { method: "POST", json: { ...body, email: "NIMAL@test.dev" } }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");
  });

  it("returns field errors in the standard error shape for weak passwords", async () => {
    const res = await register(
      req("/api/auth/register", { method: "POST", json: { ...body, password: "weak", confirmPassword: "weak" } }),
    );
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details.fieldErrors.password).toBeDefined();
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await register(
      new Request("http://localhost/api/auth/register", { method: "POST", body: "{not json" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("BAD_REQUEST");
  });
});

describe("credentials", () => {
  it("accepts the right password and rejects wrong or unknown emails alike", async () => {
    await register(req("/api/auth/register", { method: "POST", json: body }));
    expect(await verifyCredentials("nimal@test.dev", "Secret123")).toMatchObject({ email: "nimal@test.dev" });
    expect(await verifyCredentials("nimal@test.dev", "Wrong1234")).toBeNull();
    expect(await verifyCredentials("nobody@test.dev", "Secret123")).toBeNull();
  });

  it("locks an email after 5 failed attempts and unlocks on reset", async () => {
    const key = "login:victim@test.dev";
    for (let i = 0; i < LOGIN_EMAIL_RULE.limit - 1; i++) {
      expect(await recordAttempt(key, LOGIN_EMAIL_RULE)).toBe(false);
    }
    expect(await isLimited(key)).toBe(false);
    expect(await recordAttempt(key, LOGIN_EMAIL_RULE)).toBe(true);
    expect(await isLimited(key)).toBe(true);
    await resetLimit(key);
    expect(await isLimited(key)).toBe(false);
  });

  it("starts a fresh window once the old one expires", async () => {
    const key = "login:window@test.dev";
    const t0 = new Date("2026-10-01T10:00:00Z");
    for (let i = 0; i < 4; i++) await recordAttempt(key, LOGIN_EMAIL_RULE, t0);
    const later = new Date(t0.getTime() + LOGIN_EMAIL_RULE.windowMs + 1000);
    expect(await recordAttempt(key, LOGIN_EMAIL_RULE, later)).toBe(false);
    expect((await prisma.rateLimit.findUniqueOrThrow({ where: { key } })).count).toBe(1);
  });
});

describe("authentication is required", () => {
  it.each([
    ["GET /api/transactions", () => listTx(req("/api/transactions"))],
    ["GET /api/profile", () => getProfile()],
    ["PATCH /api/profile", () => patchProfile(req("/api/profile", { method: "PATCH", json: { name: "X Y" } }))],
    ["GET /api/reports/summary", () => report(req("/api/reports/summary"), { params: Promise.resolve({ report: "summary" }) })],
  ])("%s → 401 without a session", async (_label, call) => {
    const res = await call();
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("treats a session for a deleted user as signed out", async () => {
    actAs("ckdeleteduser000000000000");
    expect((await listTx(req("/api/transactions"))).status).toBe(401);
  });
});

describe("profile", () => {
  it("updates name/currency and changes password only with the current password", async () => {
    const created = await (await register(req("/api/auth/register", { method: "POST", json: body }))).json();
    actAs(created.data.id);

    const patched = await patchProfile(req("/api/profile", { method: "PATCH", json: { name: "Nimal P", currency: "USD" } }));
    expect((await patched.json()).data).toMatchObject({ name: "Nimal P", currency: "USD" });

    const bad = await changePassword(
      req("/api/profile/password", {
        method: "POST",
        json: { currentPassword: "nope", newPassword: "NewPass123", confirmPassword: "NewPass123" },
      }),
    );
    expect(bad.status).toBe(400);

    const good = await changePassword(
      req("/api/profile/password", {
        method: "POST",
        json: { currentPassword: "Secret123", newPassword: "NewPass123", confirmPassword: "NewPass123" },
      }),
    );
    expect(good.status).toBe(204);
    expect(await verifyCredentials("nimal@test.dev", "NewPass123")).not.toBeNull();
    expect(await verifyCredentials("nimal@test.dev", "Secret123")).toBeNull();
  });
});
