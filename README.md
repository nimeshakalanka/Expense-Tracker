# Ledgerly — Expense Tracker

A secure, responsive web app for tracking income and expenses, setting monthly budgets and understanding where your money goes.

> **Task 3: Expense Tracker Web Application** — Expense Tracking · Income Management · Financial Reports · User Authentication

**Live demo:** _add your Vercel URL here_ &nbsp;·&nbsp; **Demo login:** `demo@example.com` / `Demo1234`

![Dashboard](docs/screenshots/dashboard-light.png)

---

## Features

**Expense tracking & income management**
- Add, edit and delete income and expenses (amount, category, date, description) in a modal form with validation.
- Transactions table with search, filters (type, category, date range), sorting, pagination, empty and loading states. Stacked list layout on phones.
- Categories per user (11 sensible defaults seeded on sign-up), custom colours, rename, and safe delete — a category that still has transactions must be reassigned first.
- Optional **monthly budgets** per expense category with progress bars and over-budget warnings.

**Financial reports**
- Dashboard: income, expenses, net balance, savings rate, change vs last month, recent transactions.
- Charts: income vs expenses by month (bar), spending by category (donut), balance trend (line).
- Reports page: date-range presets or custom range, category breakdown tables, top 5 expenses, income by source.
- **CSV export** of any filtered set of transactions (Excel-safe, formula-injection safe).
- Currency formatting with `Intl.NumberFormat`; user-selectable currency (default **LKR**).

**Authentication & security**
- Register / login / logout with email + password (Auth.js v5, bcrypt cost 12, JWT session in an HTTP-only cookie).
- Route protection in `proxy.ts` (Next 16's middleware) **and** a session check in every page and API route.
- Every database query is scoped to the signed-in user; another user's record returns **404**.
- Login throttling: 5 failed attempts per email (or 20 per IP) in 15 minutes → 15-minute lockout, stored in the DB so it works on serverless.
- No user enumeration on login (same message and similar timing for unknown emails and wrong passwords).
- Profile: change name, display currency, theme, and password (requires current password).

**Quality**
- zod validation on every API input with a consistent JSON error format.
- 68 Vitest tests (unit + API + ownership), all passing on **both SQLite and PostgreSQL**.
- Accessible: labelled controls, visible focus rings, skip link, keyboard-navigable dialogs that return focus, chart text alternatives, AA contrast, colour-blind-validated chart palette, reduced-motion support.
- Light/dark mode, responsive from 360px to 1440px+.

## Screenshots

| | |
|---|---|
| ![Dashboard (dark)](docs/screenshots/dashboard-dark.png) | ![Reports](docs/screenshots/reports.png) |
| ![Transactions](docs/screenshots/transactions.png) | ![Categories](docs/screenshots/categories.png) |
| ![Login](docs/screenshots/login.png) | ![Settings](docs/screenshots/settings.png) |

<p>
  <img src="docs/screenshots/mobile-dashboard.png" alt="Dashboard on a phone" width="240">
  <img src="docs/screenshots/mobile-transactions.png" alt="Transactions on a phone" width="240">
</p>

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict) |
| UI | Tailwind CSS 4, shadcn/ui (Radix), lucide-react, motion (`motion/react`), next-themes |
| Charts | Recharts 3 |
| Forms & validation | react-hook-form + zod 4 |
| Auth | Auth.js v5 (`next-auth@5` beta) — Credentials provider, JWT sessions |
| Database | Prisma 7 ORM with driver adapters — SQLite locally, PostgreSQL (Neon/Supabase) in production |
| Tests | Vitest |

## Architecture

```
Browser ──► proxy.ts (redirects only)
        ──► Server Components (pages) ─┐
        ──► Route Handlers /api/**  ───┼─► src/server/services/*  ──► Prisma ──► SQLite / Postgres
                                       │     (every query filtered by userId)
                                       └─► src/lib/reports.ts (pure aggregation, unit-tested)
```

- **Pages** read data through the service layer on the server; **client components** mutate through the REST API and call `router.refresh()`.
- **Money** is stored as integer minor units (`amountMinor`, e.g. Rs 1,250.50 → `125050`) — never floats.
- **Dates** are calendar days stored at 00:00 UTC; month bucketing is done in JS so results are identical on SQLite and Postgres.

```
src/
  app/(auth)/login, register          app/(app)/dashboard, transactions, categories, reports, settings
  app/api/**                          REST route handlers
  components/                         ui/ (shadcn), layout/, charts/, transactions/, categories/, reports/, settings/
  lib/                                money, dates, reports (pure), validators (zod), api-client, prisma-client
  server/                             services/ (data access), auth-helpers, http (errors), rate-limit
  auth.ts  auth.config.ts  proxy.ts
prisma/  schema.base.prisma  migrations/{sqlite,postgresql}  seed.ts
tests/   unit/  api/
```

### API

All endpoints require a session (except register) and return `{ "data": … }` or `{ "error": { "code", "message", "details?" } }`.

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` | Create account (201, 409 duplicate email) |
| `GET /api/transactions?page&pageSize&from&to&type&categoryId&q&sort&order` | List with pagination/filters/search/sort |
| `POST /api/transactions` | Create |
| `GET / PATCH / DELETE /api/transactions/:id` | Read / update / delete (404 if not yours) |
| `GET /api/transactions/export?…filters` | CSV download |
| `GET / POST /api/categories` | List (with counts, month totals, budgets) / create |
| `PATCH / DELETE /api/categories/:id[?reassignTo=]` | Rename/recolour / delete (409 if it has transactions) |
| `PUT / DELETE /api/budgets` | Set / remove a monthly budget |
| `GET /api/reports/{summary,by-category,by-month,trend,top-expenses}?from&to` | Report data |
| `GET / PATCH /api/profile`, `POST /api/profile/password` | Profile, currency, password |

Status codes: 200, 201, 204, 400 (validation, with `details.fieldErrors`), 401, 404, 409, 429, 500.

## Local setup

Requirements: **Node.js 20.12+** (developed on Node 24) and npm. No database server needed.

```bash
npm install
```

```bash
cp .env.example .env
```

Generate a secret and put it in `.env` as `AUTH_SECRET`:

```bash
npx auth secret
```

Create the database and load demo data:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000 and sign in with **demo@example.com / Demo1234** (3 months of sample LKR data), or register a new account.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` (SQLite) **or** a `postgresql://…` URL. The Prisma provider and migrations folder are chosen from this automatically. |
| `DIRECT_URL` | no | Non-pooled Postgres URL used for migrations (Neon/Supabase). |
| `DATABASE_POOL_MAX` | no | Postgres connections per server instance (e.g. `5` on Vercel; `1` for `npx prisma dev`). |
| `AUTH_SECRET` | yes | Random secret for signing session tokens (`npx auth secret`). |
| `AUTH_TRUST_HOST` | local/self-host | `true` when not on Vercel. |

Only `.env.example` is committed; `.env` is git-ignored.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Vitest (uses a throwaway SQLite `test.db`) |
| `TEST_DATABASE_URL=postgresql://… npm run test:pg` | Same suite against a **disposable** Postgres database |
| `npm run db:migrate -- --name <name>` | Create + apply a migration (dev) |
| `npm run db:deploy` | Apply committed migrations (production/CI) |
| `npm run db:seed` | (Re)create the demo user and sample data |
| `npm run db:reset` | Drop all data, re-apply migrations and seed (dev only) |
| `npm run db:migrations:pg` | Regenerate the initial Postgres migration from the schema (no server needed) |
| `npm run db:studio` | Prisma Studio |

### Switching database (one line)

The data model lives in `prisma/schema.base.prisma`. `scripts/prisma-schema.mjs` (run automatically by `npm install`, `npm run build` and the `db:*` scripts) writes `prisma/schema.prisma` with the right provider for `DATABASE_URL`. So moving from SQLite to Neon/Supabase is just:

```diff
- DATABASE_URL="file:./dev.db"
+ DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
```

then `npm run db:deploy` (and optionally `npm run db:seed`).

## Deployment (Vercel + Neon)

1. **Push to GitHub.** Create an empty repository and push this project (`git remote add origin …` then `git push -u origin main`).
2. **Create the database.** In [Neon](https://neon.tech) create a project and database. From *Connect* copy:
   - the **pooled** connection string → `DATABASE_URL`
   - the **direct** (unpooled) connection string → `DIRECT_URL`

   (Supabase works the same: *Transaction pooler* URL → `DATABASE_URL`, *Direct connection* URL → `DIRECT_URL`.)
3. **Import the repo in [Vercel](https://vercel.com/new).** Framework preset: Next.js. Set **Environment Variables** (Production and Preview):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled URL (`…-pooler…?sslmode=require`) |
   | `DIRECT_URL` | Neon direct URL |
   | `AUTH_SECRET` | output of `npx auth secret` (a new value, not your local one) |
   | `DATABASE_POOL_MAX` | `5` (optional) |

4. **Build command** (Project → Settings → Build & Development) — runs migrations on every deploy:

   ```bash
   npm run db:deploy && npm run build
   ```

   Install command stays the default (`npm install`); its `postinstall` generates the Postgres Prisma client.
5. **Deploy.** Then, optionally, load the demo account into the production database from your machine:

   ```bash
   DATABASE_URL="<neon direct url>" npm run db:seed
   ```

6. Put the deployment URL in the **Live demo** line at the top of this README.

## Testing

```bash
npm test
```

- `tests/unit` — summary maths (totals, savings rate incl. zero income, month bucketing, running balance), money conversion/formatting, CSV escaping, validators, date presets.
- `tests/api` — route handlers called directly with a mocked session: registration, duplicate email, 401s, login lockout window, password change, CRUD + filters + pagination + sort + CSV, category reassign, budgets.
- `tests/api/ownership.test.ts` — **user B cannot read, update, delete, list, search, export, re-categorise into, budget, or report on user A's data.**

The app was also checked end-to-end in a real browser (register → add/edit/delete → dashboard totals and charts → second user isolation → lockout → sign out) against both SQLite and PostgreSQL, and every page was reviewed at 360, 768, 1024 and 1440px in light and dark mode.

## Security notes & known limitations

- Sessions are stateless JWTs (7-day expiry). Changing your password does not sign out other devices until their token expires.
- The per-IP login limit trusts `x-forwarded-for`, which Vercel sets; behind other proxies make sure it can't be spoofed. The per-email limit applies regardless.
- Registration necessarily reveals whether an email is already registered (409); login does not.
- Changing the display currency re-formats amounts; it does not convert them.

