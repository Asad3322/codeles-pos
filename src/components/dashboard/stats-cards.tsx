import { Banknote, ShoppingCart, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  today: {
    revenue: number;
    sales: number;
    avgOrder?: number;
    purchases?: number;
    purchasesCount?: number;
    expenses?: number;
    netCashFlow?: number;
  };
}

export function StatsCards({ today }: StatsCardsProps) {
  const revenue = today.revenue || 0;
  const purchases = today.purchases || 0;
  const expenses = today.expenses || 0;
  const netCashFlow = today.netCashFlow !== undefined ? today.netCashFlow : revenue - (purchases + expenses);

  const stats = [
    {
      title: "Today's Sales Revenue",
      value: formatCurrency(revenue),
      icon: Banknote,
      change: `${today.sales} completed ${today.sales === 1 ? "order" : "orders"} today`,
      color: "text-lime-600 dark:text-lime-400 bg-lime-500/10",
    },
    {
      title: "Today's Purchases",
      value: formatCurrency(purchases),
      icon: ShoppingCart,
      change: `${today.purchasesCount || 0} supplier ${today.purchasesCount === 1 ? "delivery" : "deliveries"}`,
      color: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      change: "Operating & utility expenses",
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      title: "Net Cash Flow",
      value: formatCurrency(netCashFlow),
      icon: DollarSign,
      change: "Sales - (Purchases + Expenses)",
      color:
        netCashFlow >= 0
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          : "text-red-600 dark:text-red-400 bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="shadow-xs transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
