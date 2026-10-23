import { addMonthsUTC, endOfMonthUTC, startOfMonthUTC, toISODate, todayUTC } from "@/lib/dates";

export const RANGE_PRESETS = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "last-6-months": "Last 6 months",
  "this-year": "This year",
} as const;

export type RangePreset = keyof typeof RANGE_PRESETS;

export function presetRange(preset: RangePreset, now = new Date()): { from: string; to: string } {
  const month = startOfMonthUTC(todayUTC(now));
  switch (preset) {
    case "this-month":
      return { from: toISODate(month), to: toISODate(endOfMonthUTC(month)) };
    case "last-month": {
      const last = addMonthsUTC(month, -1);
      return { from: toISODate(last), to: toISODate(endOfMonthUTC(last)) };
    }
    case "last-3-months":
      return { from: toISODate(addMonthsUTC(month, -2)), to: toISODate(endOfMonthUTC(month)) };
    case "last-6-months":
      return { from: toISODate(addMonthsUTC(month, -5)), to: toISODate(endOfMonthUTC(month)) };
    case "this-year":
      return {
        from: `${month.getUTCFullYear()}-01-01`,
        to: `${month.getUTCFullYear()}-12-31`,
      };
  }
}

export function matchPreset(range: { from: string; to: string }, now = new Date()): RangePreset | "custom" {
  for (const key of Object.keys(RANGE_PRESETS) as RangePreset[]) {
    const r = presetRange(key, now);
    if (r.from === range.from && r.to === range.to) return key;
  }
  return "custom";
}
