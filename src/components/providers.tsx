"use client";

import { ThemeProvider } from "next-themes";
import { MotionProvider } from "@/components/motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}
