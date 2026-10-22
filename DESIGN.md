# DESIGN.md — Ledgerly

A calm, data-first personal finance UI. Neutral surfaces let the two semantic colours — **teal for money in, rose for money out** — carry meaning.

## 1. Palette
All tokens are CSS variables in `src/app/globals.css` (shadcn token names), with a `.dark` override set toggled by `next-themes`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | zinc-50 `oklch(.985 .002 286)` | zinc-950 `oklch(.141 .005 286)` | page |
| `--card` | white | zinc-900-ish `oklch(.19 .006 286)` | cards, tables, dialogs |
| `--foreground` | zinc-900 | zinc-100 | body text |
| `--muted-foreground` | `oklch(.47 .014 286)` | `oklch(.72 .013 286)` | secondary text (≥ 4.5:1 on card) |
| `--primary` | emerald-700 | emerald-400 | buttons, active nav, focus ring |
| `--income` | teal-700 | teal-400 | income amount text, badges |
| `--expense` | rose-600 | rose-400 | expense amount text, badges |
| `--destructive` | red-600 | red-400 | delete actions |
| `--chart-income` / `--chart-expense` | `#0d9488` / `#e11d48` | same | income vs expense bars |
| `--chart-1…5` | blue, orange, aqua, yellow, violet (validated categorical steps) | dark-stepped equivalents | balance line, budget warning |

Contrast checks (WCAG AA): white on emerald-700 ≈ 5.5:1; rose-600 on white ≈ 4.6:1; emerald-400 / rose-400 on zinc-900 > 7:1. Colour is never the only signal — amounts also carry a `+`/`−` sign and a type badge.

**Chart colours were validated, not eyeballed.** The first draft paired emerald with rose for income/expense; a colour-vision-deficiency check showed that pair is nearly indistinguishable for deuteranopes (ΔE 5.6). Teal `#0d9488` + rose `#e11d48` passes CVD separation and lightness checks in both themes, so the bars use that pair. Every chart also has an HTML legend, a text alternative (`aria-label` summary) and, on Reports, a data table.

Category colours are user-chosen from a fixed **8-swatch categorical palette** (blue, orange, aqua, yellow, magenta, green, violet, red) validated in that order for CVD separation. They appear only as dots/legend markers beside text, so identity never depends on colour alone. The donut shows the 5 largest categories and folds the rest into a grey “Other (n)” slice.

## 2. Typography
- **Inter** variable font, self-hosted via `next/font/local` (`src/app/fonts`, OFL) so builds never depend on Google Fonts; the system monospace stack for code-like snippets.
- Scale: 12 (captions, table meta) / 14 (body, tables) / 16 (inputs on mobile — avoids iOS zoom) / 20 (card titles) / 24 (page titles) / 30 (KPI values).
- Weights: 400 body, 500 labels, 600 headings and KPI values.
- Amounts use `tabular-nums` (`.tabular`) so columns align.

## 3. Layout & navigation
- **≥ 1024px (lg):** fixed 240px left sidebar (logo, 5 nav items, theme toggle, user menu at bottom). Content area `max-w-7xl` with 32px padding.
- **< 1024px:** sticky top bar (logo, theme toggle, user menu) + **fixed bottom tab bar** with the 5 destinations (icons + short labels, 44px touch targets). Content gets bottom padding so nothing hides under the bar. The primary “Add transaction” button sits in the page header (Dashboard) or toolbar (Transactions). All five destinations fit in the tab bar, so no extra “More” drawer is needed.
- Spacing: 4px base grid; cards 16px padding (20–24px from 640px), gaps `gap-4 lg:gap-6`.
- Every grid declares `grid-cols-1` at the base so wide content (charts, tables) can never stretch the page past the viewport.
- Transactions filters: search + a “Filters” toggle on phones; full filter grid from 768px.
- Grid breakpoints for KPI cards: 1 col (360) → 2 cols (≥ 640) → 4 cols (≥ 1280). Charts: stacked < 1024, 2-column (2/3 + 1/3) ≥ 1024.
- Verified widths: **360, 768, 1024, 1440**.

## 4. Components
shadcn/ui (Radix): Button, Input, Label, Card, Dialog, AlertDialog, Select, Table, Badge, DropdownMenu, Skeleton, Sonner toasts, Tabs, Tooltip, Avatar. Date ranges use native `<input type="date">` (accessible and mobile-friendly) plus preset selects; budget bars are simple `role="progressbar"` divs.
- Tables collapse to stacked "list cards" below 768px (no horizontal scroll).
- Every async view has a Skeleton loading state (`loading.tsx`) and an illustrated empty state with a primary action.
- Forms: label above input, inline error text (`aria-describedby`), submit button shows a spinner and is disabled while pending.

## 5. Motion
`motion/react`, subtle only: cards fade + 8px rise (180ms, staggered 40ms) and dialog zoom/fade (built into shadcn). Chart bars grow in over 600ms; the trend line and donut render without animation. `MotionConfig reducedMotion="user"` plus a global CSS rule disable all of it under `prefers-reduced-motion`.

## 6. Accessibility
Visible focus ring (`ring-3 ring-ring/50`) on all interactive elements; skip-to-content link; nav uses `<nav aria-label>` and `aria-current="page"`; icon-only buttons have `aria-label`; charts have a text summary (`aria-label`) and the data is also available as a table on Reports; dialogs trap focus and return it on close.

## 7. Screen wireframes

### Login / Register
```
┌──────────────── centered card (max 400px) ─────────────────┐
│ [logo] Ledgerly                                            │
│ Welcome back / Create your account                         │
│ (Name) · Email · Password [show]                           │
│ password rules hint (register)                             │
│ [ Sign in ]                                                │
│ Don't have an account? Register   ·  demo login hint       │
└────────────────────────────────────────────────────────────┘
```
Left half on ≥1024px shows a brand panel (gradient, tagline, 3 feature bullets); hidden on mobile.

### Dashboard
```
Header: "Good morning, Name"  ·  [Add transaction]
[Income][Expenses][Net balance][Savings rate]   ← each with Δ vs last month
┌ Income vs expenses (bar, 6 months) ──────┐┌ Spending by category (donut) ┐
└──────────────────────────────────────────┘└──────────────────────────────┘
┌ Balance trend (line) ────────────────────┐┌ Budgets (progress bars)      ┐
└──────────────────────────────────────────┘└──────────────────────────────┘
┌ Recent transactions (5) ─────────────────────────────── View all → ┐
```

### Transactions
```
Title · [Export CSV] [Add]
Filters: search · type (All/Income/Expense) · category · from–to · sort
Table: Date | Description | Category (dot+name) | Type badge | Amount (±) | ⋯ (Edit/Delete)
Pagination: "Showing 1–20 of 134"  [Prev][Next]
Add/Edit = Dialog (type toggle, amount, category filtered by type, date, description)
Delete = AlertDialog confirmation
Mobile: rows become cards (description + category on left, amount + date on right)
```

### Categories
```
Tabs: Expense | Income       [New category]
Grid of cards: colour dot · name · #transactions · this month total
  · monthly budget progress (expense only) · ⋯ (Edit, Set budget, Delete)
Delete with transactions → dialog offering "Move transactions to…" select
```

### Reports
```
Date range (presets: This month, Last month, Last 3 months, This year, Custom) · [Export CSV]
KPIs for range: income · expenses · net · savings rate
Income vs expenses by month (bar) · Spending by category (donut)
Category breakdown table: Category | Transactions | Total | % of expenses
Top 5 expenses list
```

### Settings / Profile
```
Profile card: name, email (read-only), [Save]
Preferences card: currency select (LKR default, USD, EUR, GBP, INR, AUD…), theme (Light/Dark/System)
Security card: current password, new password, confirm → [Change password]
```
