"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export function PreferencesForm({ currency }: { currency: string }) {
  const router = useRouter();
  const { theme: storedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const theme = mounted ? storedTheme : undefined;
  const [value, setValue] = useState(currency);

  async function changeCurrency(next: string) {
    const previous = value;
    setValue(next);
    try {
      await apiFetch("/api/profile", { method: "PATCH", json: { currency: next } });
      toast.success(`Currency set to ${next}`);
      router.refresh();
    } catch (err) {
      setValue(previous);
      toast.error(err instanceof Error ? err.message : "Could not update currency");
    }
  }

  return (
    <Card className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>Display settings. Amounts are stored as entered; currency only changes formatting.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="pref-currency">Currency</Label>
          <Select value={value} onValueChange={changeCurrency}>
            <SelectTrigger id="pref-currency" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Preview: {formatMoney(1234567, value)}</p>
        </div>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Theme</legend>
          <div className="grid grid-cols-3 gap-2 sm:w-72">
            {THEMES.map((t) => (
              <label
                key={t.value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium text-muted-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  theme === t.value && "border-primary bg-accent text-accent-foreground",
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t.value}
                  checked={theme === t.value}
                  onChange={() => setTheme(t.value)}
                  className="sr-only"
                />
                <t.icon className="size-4" aria-hidden />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
