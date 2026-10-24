import { ArrowLeftRight, ChartColumn, LayoutDashboard, Settings, Tags } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", short: "Activity", icon: ArrowLeftRight },
  { href: "/categories", label: "Categories", short: "Categories", icon: Tags },
  { href: "/reports", label: "Reports", short: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
] as const;
