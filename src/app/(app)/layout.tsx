import { CurrencyProvider } from "@/components/currency-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getPageUser } from "@/server/auth-helpers";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getPageUser();
  return (
    <CurrencyProvider currency={user.currency}>
      <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>
    </CurrencyProvider>
  );
}
