import { ChartPie, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  { icon: Wallet, text: "Log income and expenses in seconds" },
  { icon: ChartPie, text: "See where your money goes with clear charts" },
  { icon: ShieldCheck, text: "Your data stays private to your account" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <Logo className="[&>span]:bg-primary-foreground [&>span]:text-primary" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight">Know where every rupee goes.</h2>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-80">Track · Budget · Understand</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
