/**
 * Seeds a demo account with ~3 months of realistic LKR data.
 * Idempotent: the demo user (and all of its data) is recreated on every run.
 *
 *   npm run db:seed
 *   Login: demo@example.com / Demo1234
 */
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";
import { createPrismaClient } from "../src/lib/prisma-client";
import { addMonthsUTC, startOfMonthUTC, todayUTC } from "../src/lib/dates";

process.loadEnvFile?.(".env");

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo1234";

const prisma = createPrismaClient();

// Small deterministic PRNG so the demo data is the same on every machine.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
const day = (monthStart: Date, d: number) =>
  new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), d));

const variable: Record<string, { items: readonly string[]; min: number; max: number; perMonth: number }> = {
  Food: {
    items: ["Keells groceries", "Cargills Food City", "Lunch with team", "Pizza night", "Bakery", "Kottu dinner", "Coffee", "Uber Eats order"],
    min: 800, max: 9500, perMonth: 12,
  },
  Transport: {
    items: ["PickMe ride", "Uber ride", "Fuel top-up", "Train ticket", "Bus card reload", "Parking"],
    min: 300, max: 7500, perMonth: 7,
  },
  Shopping: {
    items: ["Clothing — ODEL", "Daraz order", "Shoes", "Household items", "Books", "Phone accessories"],
    min: 2500, max: 22000, perMonth: 3,
  },
  Health: {
    items: ["Pharmacy", "Doctor consultation", "Gym membership", "Vitamins"],
    min: 1500, max: 12000, perMonth: 2,
  },
  Entertainment: {
    items: ["Netflix", "Cinema tickets", "Spotify", "Concert", "Weekend trip", "Board game café"],
    min: 900, max: 18000, perMonth: 3,
  },
  Other: { items: ["Gift", "Donation", "Haircut", "Stationery"], min: 500, max: 6000, perMonth: 2 },
};

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
      currency: "LKR",
      categories: { create: DEFAULT_CATEGORIES },
    },
    include: { categories: true },
  });
  const cat = (name: string) => user.categories.find((c) => c.name === name)!;

  const today = todayUTC();
  const rows: {
    userId: string; categoryId: string; type: "INCOME" | "EXPENSE";
    amountMinor: number; description: string; date: Date;
  }[] = [];
  const add = (name: string, amount: number, description: string, date: Date) => {
    if (date > today) return; // never seed future-dated transactions
    const c = cat(name);
    rows.push({ userId: user.id, categoryId: c.id, type: c.type, amountMinor: amount * 100, description, date });
  };

  // Current month plus the two before it.
  for (let m = -2; m <= 0; m++) {
    const ms = addMonthsUTC(startOfMonthUTC(today), m);
    add("Salary", 285000, "Monthly salary", day(ms, 1));
    add("Rent", 85000, "Apartment rent", day(ms, 2));
    add("Bills", between(4800, 7200), "Electricity bill", day(ms, 8));
    add("Bills", between(1800, 2600), "Water bill", day(ms, 9));
    add("Bills", 4990, "Fibre internet", day(ms, 10));
    add("Bills", between(1500, 2500), "Mobile reload", day(ms, 12));
    add("Freelance", between(35000, 90000), pick(["Logo design project", "Website fixes", "React consulting", "Mobile UI mockups"]), day(ms, between(14, 26)));
    if (rand() > 0.5) add("Other Income", between(5000, 15000), pick(["Sold old bicycle", "Bank interest", "Cashback reward"]), day(ms, between(5, 25)));

    for (const [name, v] of Object.entries(variable)) {
      for (let i = 0; i < v.perMonth; i++) {
        add(name, between(v.min, v.max), pick(v.items), day(ms, between(1, 28)));
      }
    }
  }

  await prisma.transaction.createMany({ data: rows });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: cat("Food").id, monthlyLimitMinor: 60000_00 },
      { userId: user.id, categoryId: cat("Transport").id, monthlyLimitMinor: 25000_00 },
      { userId: user.id, categoryId: cat("Entertainment").id, monthlyLimitMinor: 20000_00 },
      { userId: user.id, categoryId: cat("Shopping").id, monthlyLimitMinor: 30000_00 },
    ],
  });

  console.log(`Seeded ${DEMO_EMAIL} / ${DEMO_PASSWORD} with ${rows.length} transactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
