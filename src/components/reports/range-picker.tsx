"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_PRESETS, type RangePreset, matchPreset, presetRange } from "@/lib/date-presets";

export function RangePicker({ range }: { range: { from: string; to: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const preset = matchPreset(range);

  const go = (r: { from: string; to: string }) => {
    if (!r.from || !r.to || r.from > r.to) return;
    startTransition(() => router.replace(`${pathname}?from=${r.from}&to=${r.to}`, { scroll: false }));
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="grid w-full gap-1.5 sm:w-48">
          <Label htmlFor="r-preset">Period</Label>
          <Select value={preset} onValueChange={(v) => v !== "custom" && go(presetRange(v as RangePreset))}>
            <SelectTrigger id="r-preset" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_PRESETS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
              <SelectItem value="custom" disabled>
                Custom range
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-44">
          <Label htmlFor="r-from">From</Label>
          <Input id="r-from" type="date" value={range.from} max={range.to} onChange={(e) => go({ ...range, from: e.target.value })} />
        </div>
        <div className="grid min-w-0 flex-1 gap-1.5 sm:max-w-44">
          <Label htmlFor="r-to">To</Label>
          <Input id="r-to" type="date" value={range.to} min={range.from} onChange={(e) => go({ ...range, to: e.target.value })} />
        </div>
        {pending && <Loader2 className="mb-2 size-5 animate-spin text-muted-foreground" aria-label="Updating report" />}
        <Button variant="outline" size="lg" asChild className="sm:ml-auto">
          <a href={`/api/transactions/export?from=${range.from}&to=${range.to}`} download>
            <Download aria-hidden /> Export CSV
          </a>
        </Button>
      </div>
    </Card>
  );
}
