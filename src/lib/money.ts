export const CURRENCIES = [
  { code: "LKR", label: "Sri Lankan Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "INR", label: "Indian Rupee" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "JPY", label: "Japanese Yen" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

export const MAX_AMOUNT_MAJOR = 10_000_000;

export function toMinor(major: number): number {
  const sign = major < 0 ? -1 : 1;
  return sign * Math.round(Number((Math.abs(major) * 100).toFixed(4)));
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  minor: number,
  currency: string = "LKR",
  opts: { signed?: boolean; compact?: boolean; whole?: boolean } = {},
): string {
  const key = `${currency}|${opts.compact ? "c" : ""}|${opts.signed ? "s" : ""}|${opts.whole ? "w" : ""}`;
  let fmt = formatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      notation: opts.compact ? "compact" : "standard",
      maximumFractionDigits: opts.compact ? 1 : opts.whole ? 0 : 2,
      minimumFractionDigits: opts.compact || opts.whole ? 0 : 2,
      signDisplay: opts.signed ? "exceptZero" : "auto",
    });
    formatters.set(key, fmt);
  }
  return fmt.format(fromMinor(minor));
}
