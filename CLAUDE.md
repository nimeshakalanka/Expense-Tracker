# CLAUDE.md — Ledgerly (Expense Tracker)

@AGENTS.md

## Stack
- Next.js 16.4 App Router + TypeScript (strict), Tailwind CSS 4, shadcn/ui (radix-nova style, `cn` package for class merging)
- Prisma 7.10 with driver adapters — SQLite locally (`better-sqlite3`), PostgreSQL in production (`pg`)
- Auth.js v5 (`next-auth@5.0.0-beta`) Credentials provider, JWT sessions in HTTP-only cookies, bcryptjs hashes
- zod 4 (all inputs), react-hook-form, Recharts 3, motion (`motion/react`), next-themes, lucide-react
- Vitest for unit + API tests

## Commands
| Task | Command |
|---|---|
| Install (also generates Prisma schema + client) | `npm install` |
| Dev server | `npm run dev` |
| Create/apply a migration (dev) | `npm run db:migrate -- --name <name>` |
| Apply migrations (prod/CI) | `npm run db:deploy` |
| Seed demo data | `npm run db:seed` |
| Reset DB + seed | `npm run db:reset` |
| Lint / typecheck / tests | `npm run lint` / `npm run typecheck` / `npm test` |
| Tests against Postgres | `TEST_DATABASE_URL=postgresql://… npm run test:pg` (disposable DB only) |
| Production build | `npm run build` |

## Conventions
- **Database provider is derived from `DATABASE_URL`.** Edit `prisma/schema.base.prisma`, never `prisma/schema.prisma` (generated, git-ignored). `scripts/prisma-schema.mjs` writes it; migrations live in `prisma/migrations/{sqlite,postgresql}`. After changing the schema, run `npm run db:migrate -- --name x` (SQLite) **and** `npm run db:migrations:pg` to regenerate the Postgres baseline.
- **Every data access goes through `src/server/services/*`**, whose functions take `userId` first and always filter by it. Route handlers and server components never call `prisma` directly.
- **Route handlers** (`src/app/api/**`) follow: `handle(async () => { const user = await requireUser(); const input = schema.parse(...); return ok(await service(user.id, input)) })`. Errors: `{ error: { code, message, details? } }`. Another user's record → 404, never 403.
- **Money is integer minor units** (`amountMinor`). Convert with `toMinor`/`fromMinor` in `src/lib/money.ts`; format with `formatMoney(minor, currency)`.
- Dates are stored as UTC instants; a transaction's `date` is the calendar day at 00:00 UTC. Month bucketing happens in JS (`src/lib/reports.ts`) so it's identical on SQLite and Postgres.
- Server components fetch via services; client components mutate through `fetch('/api/...')` then `router.refresh()`.
- Cache Components is **off** (`next.config.ts`); all app pages are dynamic.
- `proxy.ts` (Next 16 replacement for middleware) only redirects; authorization is re-checked in every route and page.
- Tests call route handlers directly; `@/auth` is mocked and `actAs(userId)` (tests/helpers.ts) picks the session. Add an ownership test for every new user-scoped endpoint.
- Chart colours come from validated tokens (`--chart-income`, `--chart-expense`, `--chart-1…5`, `CATEGORY_COLORS`); re-validate before changing them (see DESIGN.md).
- Windows: `@rolldown/binding-win32-x64-msvc` is pinned in optionalDependencies to work around an npm optional-deps bug; bump it together with vitest/vite.
- Keep animations subtle (UI entrances ≤200ms, chart bars 600ms) and respect `prefers-reduced-motion`.
