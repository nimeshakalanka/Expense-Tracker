"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <Button variant="ghost" size="icon-lg" onClick={() => setTheme(next)} aria-label="Toggle colour theme">
      <Sun className="size-4.5 dark:hidden" aria-hidden />
      <Moon className="hidden size-4.5 dark:block" aria-hidden />
    </Button>
  );
}
