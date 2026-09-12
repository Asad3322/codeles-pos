"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  Cake,
  Warehouse,
  Users,
  Truck,
  ShoppingBag,
  Receipt,
  Wallet,
  UserCog,
  BarChart3,
  Settings,
  Bell,
  Building2,
  Tags,
  Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CodelesLogo } from "@/components/ui/codeles-logo";
import { hasPermission } from "@/lib/permissions";
import type { Permission, UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      { href: "/pos", label: "POS Checkout", icon: ShoppingCart, permission: "pos.access" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/sales", label: "Sales History", icon: Receipt, permission: "sales.manage" },
    ],
  },
  {
    label: "Bakery",
    items: [
      { href: "/products", label: "Bakery Items", icon: Cake, permission: "products.manage" },
      { href: "/categories", label: "Categories", icon: Tags, permission: "products.manage" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/ingredients", label: "Ingredients", icon: Wheat, permission: "ingredients.view" },
      { href: "/inventory", label: "Finished Stock", icon: Warehouse, permission: "inventory.manage" },
      { href: "/purchases", label: "Purchases", icon: ShoppingBag, permission: "purchases.view" },
      { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers.manage" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/customers", label: "Customers", icon: Users, permission: "customers.manage" },
      { href: "/expenses", label: "Expenses", icon: Wallet, permission: "expenses.manage" },
      { href: "/employees", label: "Employees", icon: UserCog, permission: "employees.manage" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/branches", label: "Branches", icon: Building2, permission: "branches.manage" },
      { href: "/notifications", label: "Notifications", icon: Bell, permission: "settings.manage" },
      { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

export function Sidebar({ className }: { className?: string } = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  const homeHref = role === "cashier" || role === "staff" ? "/pos" : "/dashboard";

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || (role && hasPermission(role, item.permission))
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_3px_rgba(0,0,0,0.02)] dark:border-slate-800/80 dark:bg-[#0b1120]",
        className ?? "hidden lg:flex"
      )}
    >
      {/* Branding Header */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <Link
          href={homeHref}
          className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-lime-500 rounded-lg p-1 -m-1"
        >
          <CodelesLogo size="md" />
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-3.5 pt-4">
        {visibleNavGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            <div className="space-y-0.5 pt-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 border-l-3",
                      active
                        ? "bg-slate-100/90 text-slate-900 font-semibold border-lime-600 shadow-2xs dark:bg-slate-800/80 dark:text-white dark:border-lime-400"
                        : "border-transparent text-slate-600 hover:bg-slate-100/60 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-lime-600 dark:text-lime-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(132,204,22,0.8)] dark:bg-lime-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer subtle brand mark */}
      <div className="shrink-0 border-t border-slate-200/80 px-4 py-3 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold tracking-tight text-slate-700 dark:text-slate-300">
            Codeles POS
          </span>
          <span className="text-[10px] rounded-sm bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 font-mono text-slate-500 dark:text-slate-400">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
