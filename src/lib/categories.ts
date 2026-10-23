import type { TxType } from "@/generated/prisma/enums";

export const CATEGORY_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
] as const;

const [blue, orange, aqua, yellow, magenta, green, violet, red] = CATEGORY_COLORS;

export const DEFAULT_CATEGORIES: { name: string; type: TxType; color: string }[] = [
  { name: "Salary", type: "INCOME", color: aqua },
  { name: "Freelance", type: "INCOME", color: blue },
  { name: "Other Income", type: "INCOME", color: violet },
  { name: "Food", type: "EXPENSE", color: blue },
  { name: "Transport", type: "EXPENSE", color: orange },
  { name: "Rent", type: "EXPENSE", color: aqua },
  { name: "Bills", type: "EXPENSE", color: yellow },
  { name: "Shopping", type: "EXPENSE", color: magenta },
  { name: "Health", type: "EXPENSE", color: green },
  { name: "Entertainment", type: "EXPENSE", color: violet },
  { name: "Other", type: "EXPENSE", color: red },
];
