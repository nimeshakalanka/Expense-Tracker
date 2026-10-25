# Requirements checklist

Every requirement from the assignment brief, mapped to where it is implemented and how it was verified.

## Key features

| Key feature | Where | Verified by |
|---|---|---|
| **Expense tracking** — add/edit/delete, categories, dates, descriptions | `src/components/transactions/*` (form dialog, table, delete confirmation), `src/app/(app)/transactions/page.tsx`, `src/server/services/transactions.ts`, `src/app/api/transactions/**` | `tests/api/transactions.test.ts`; browser E2E (add → edit → delete) |
| **Income management** — income transactions and income categories (Salary, Freelance, Other Income) | same transaction flow with `type = INCOME`; `src/lib/categories.ts` defaults; Categories page *Income* tab | `tests/api/transactions.test.ts`; E2E (income added, totals) |
| **Financial reports** — totals, by category, by month, trends, CSV | `src/lib/reports.ts` (pure maths), `src/server/services/reports.ts`, `src/app/api/reports/[report]/route.ts`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/reports/page.tsx`, `src/components/charts/*`, `src/app/api/transactions/export/route.ts` | `tests/unit/reports.test.ts`; API summary/by-month/CSV tests; E2E dashboard totals |
| **User authentication** — register, login, logout, protected routes | `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/app/api/auth/**`, `src/app/(auth)/**`, `src/server/auth-helpers.ts`, `src/server/rate-limit.ts` | `tests/api/auth.test.ts`; E2E (redirects, lockout, sign out) |

## Workflow steps

### Step 0 — Plan
- [x] Architecture, schema, routes and folder structure proposed and approved (plan mode).
- [x] `CLAUDE.md` (stack, commands, conventions) and `DESIGN.md`.

### Step 1 — Design
- [x] `DESIGN.md`: palette with contrast notes, typography, layout, motion, accessibility, wireframes for Login, Register, Dashboard, Transactions, Categories, Reports, Settings.
- [x] Sidebar ≥1024px, top bar + bottom tab bar below — `src/components/layout/app-shell.tsx`.
- [x] All pages screenshotted at 360 / 768 / 1024 / 1440px in light and dark; no horizontal overflow, no console errors.

### Step 2 — Expense management APIs (Route Handlers throughout)
- [x] Transactions: create, list (pagination, date range, type, category, search, sort), get, update, delete — `src/app/api/transactions/**`.
- [x] Categories: create, list, update, delete with 409 block or `?reassignTo=` — `src/app/api/categories/**`, `deleteCategory()` in `src/server/services/categories.ts`.
- [x] Reports: summary (totals, this vs last month), by-category, by-month, trend, top-expenses — `src/app/api/reports/[report]/route.ts`.
- [x] Budgets (optional): `src/app/api/budgets/route.ts`.
- [x] Consistent JSON errors + status codes — `src/server/http.ts` (`handle`, `AppError`, `ok`, `fail`).
- [x] zod on every input — `src/lib/validators/*`.
- [x] Auth check on every route — `requireUser()` at the top of each handler.

### Step 3 — Database
- [x] Prisma schema with User, Category, Transaction, Budget, RateLimit; `TxType` enum; `amountMinor Int`; indexes `[userId, date]`, `[userId, categoryId]`, `[userId, type, date]` — `prisma/schema.base.prisma`.
- [x] Migrations for SQLite and PostgreSQL — `prisma/migrations/{sqlite,postgresql}` (Postgres migration applied successfully to a real Postgres server).
- [x] Seed with demo user and ~3 months of realistic data — `prisma/seed.ts`.
- [x] Commands documented — README *Scripts*.
- [x] One-line switch to Neon/Supabase — `scripts/prisma-schema.mjs`, `scripts/db-provider.mjs`, `prisma7.config.ts`, `src/lib/prisma-client.ts`.

### Step 4 — Reports and summaries
- [x] Dashboard: income, expenses, net balance, savings rate, this vs last month, recent transactions.
- [x] Charts: income vs expenses (bar), spending by category (donut), balance trend (line) — `src/components/charts/*`; palette validated for colour-vision deficiency.
- [x] Reports page: date-range picker, category breakdown table, top expenses, CSV export — `src/app/(app)/reports/page.tsx`, `src/components/reports/*`.
- [x] Transactions page: filters, add/edit modal, delete confirmation, empty + loading states — `src/components/transactions/transactions-view.tsx`, `loading.tsx`.
- [x] `Intl.NumberFormat` with user-selectable currency, default LKR — `src/lib/money.ts`, `src/components/amount.tsx`, Settings → Preferences.

### Step 5 — Authentication
- [x] Register, login, logout — `src/app/(auth)/**`, user menu sign-out.
- [x] Protected routes via proxy (Next 16 middleware) + redirect rules — `src/proxy.ts`, `authorized()` in `src/auth.config.ts`.
- [x] Password rules (8–72 chars, letter + number) — `passwordSchema` in `src/lib/validators/auth.ts`.
- [x] Duplicate email → 409 — `createUser()`.
- [x] Login rate limiting / lockout — `src/server/rate-limit.ts`, `authorize()` in `src/auth.ts`.
- [x] No user enumeration on login — generic error, dummy-hash timing equalisation in `verifyCredentials()`.
- [x] Profile: update name, change password — `src/app/(app)/settings/page.tsx`, `src/components/settings/*`, `src/app/api/profile/**`.

### Step 6 — Quality and security
- [x] Users can only access their own data — every service query filters by `userId`; **explicitly tested** in `tests/api/ownership.test.ts` and the browser E2E with a second user.
- [x] Secrets only in `.env` (git-ignored); `.env.example` committed.
- [x] Accessibility: labels, `aria-invalid`/`aria-describedby` errors, focus rings, skip link, focus trap + return in dialogs, keyboard-only login and dialog flow checked, chart text alternatives + data tables, AA contrast, reduced motion.
- [x] Vitest: unit tests for summary calculations; API tests for auth and ownership (68 tests, pass on SQLite and Postgres).
- [x] ESLint and TypeScript clean; no console errors on any page.
- [x] Security headers (`nosniff`, `DENY` framing, referrer policy) — `next.config.ts`.

### Step 7 — Deploy
- [x] `npm run lint`, `npm test`, `npm run build` pass.
- [x] Vercel + Neon/Supabase steps with env vars and migration command — README *Deployment*.

## Deliverables
1. [x] Source code in logical commits (`git log`).
2. [x] README with overview, features, stack, screenshots, setup, env vars, demo login, deployment, live-link placeholder.
3. [x] DESIGN.md and CLAUDE.md.
4. [x] This checklist.
5. [x] Remaining configuration — README *Deployment* and the list below.

## Still to configure (by you)
- A GitHub repository and `git push` (no remote is set).
- A Neon or Supabase Postgres database → `DATABASE_URL` and `DIRECT_URL`.
- A Vercel project with `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (fresh value) and the build command `npm run db:deploy && npm run build`.
- Optional: seed the demo account in production, then add the live URL to the README.
