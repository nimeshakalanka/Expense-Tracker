export type TxType = "INCOME" | "EXPENSE";

export type CategoryRef = { id: string; name: string; color: string };

export type TransactionDTO = {
  id: string;
  type: TxType;
  amountMinor: number;
  description: string;
  date: string;
  category: CategoryRef;
  createdAt: string;
};

export type CategoryDTO = CategoryRef & {
  type: TxType;
  transactionCount: number;
  monthTotalMinor: number;
  budgetMinor: number | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type Summary = {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  savingsRate: number | null;
  count: number;
};

export type MonthPoint = { month: string; incomeMinor: number; expenseMinor: number; netMinor: number };

export type TrendPoint = { month: string; balanceMinor: number };

export type CategoryBreakdown = CategoryRef & { totalMinor: number; count: number; share: number };

export type BudgetStatus = CategoryRef & { limitMinor: number; spentMinor: number; ratio: number };

export type ApiError = { error: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } } };
