import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { connectDB } from "@/lib/db";
import { DashboardService } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/utils";
import { formatIngredientStock } from "@/lib/unit-conversion";
import { Award, AlertTriangle, ArrowUpRight, ShoppingBag, Wheat } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | Codeles POS" };

const dashboardService = new DashboardService();

export default async function DashboardPage() {
  await connectDB();
  const overview = await dashboardService.getOverview();
  const chart = await dashboardService.getSalesChart(7);

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        {/* Top metrics summary */}
        <StatsCards today={overview.today} />

        {/* Chart & Recent Sales Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SalesChart data={chart} />
          <RecentTransactions
            transactions={overview.recentTransactions as never[]}
          />
        </div>

        {/* Secondary Grid: Top Selling Items & Recent Purchases */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Selling Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                <CardTitle className="text-base font-bold">Top Selling Bakery Items</CardTitle>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-lime-600 hover:text-lime-700 dark:text-lime-400 flex items-center"
              >
                All Bakery Items <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {overview.topProducts.map(
                  (
                    p: { _id: unknown; name: string; quantity: number; revenue: number },
                    idx: number
                  ) => (
                    <div
                      key={String(p._id)}
                      className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-slate-800/80 dark:bg-[#172033]/60 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.revenue)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {p.quantity} units sold
                        </span>
                      </div>
                    </div>
                  )
                )}
                {overview.topProducts.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No sales recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Supplier Purchases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <CardTitle className="text-base font-bold">Recent Purchases</CardTitle>
              </div>
              <Link
                href="/purchases"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center"
              >
                All Purchases <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {overview.recentPurchases.map(
                  (purchase: any) => (
                    <div
                      key={String(purchase._id)}
                      className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-slate-800/80 dark:bg-[#172033]/60 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {purchase.purchaseNumber || purchase.invoiceNumber}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            {purchase.items?.length || 0} items
                          </Badge>
                        </div>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          {purchase.supplierId?.name || purchase.supplierId?.company || "Standard Supplier"} •{" "}
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(purchase.total)}
                        </span>
                        <Badge variant="success" className="block text-[10px] mt-0.5 ml-auto w-fit">
                          Received
                        </Badge>
                      </div>
                    </div>
                  )
                )}
                {overview.recentPurchases.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No purchases recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tertiary Grid: Low Stock Raw Ingredients & Low Stock Bakery Items */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Low Stock Raw Ingredients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Wheat className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-bold">Low Stock Raw Ingredients</CardTitle>
              </div>
              <Link
                href="/ingredients"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center"
              >
                Ingredients <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overview.lowStockIngredients.map((ing: any) => (
                  <div
                    key={String(ing._id)}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 text-sm dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {ing.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono">
                        {ing.code}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                        {formatIngredientStock(ing.stockInBaseUnit, ing.defaultDisplayUnit || ing.displayUnit || "g")}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Min: {formatIngredientStock(ing.minimumStockInBaseUnit, ing.defaultDisplayUnit || ing.displayUnit || "g")}
                      </span>
                    </div>
                  </div>
                ))}
                {overview.lowStockIngredients.length === 0 && (
                  <div className="py-6 text-center text-sm text-slate-400">
                    All raw ingredient levels are healthy
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Bakery Items (Finished Stock) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-bold">Low Finished Stock Alerts</CardTitle>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center"
              >
                Finished Stock <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overview.lowStockAlerts.map((p: { _id: unknown; name: string; stock: number; sku?: string }) => (
                  <div
                    key={String(p._id)}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 text-sm dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {p.sku}
                        </span>
                      )}
                    </div>
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                      {p.stock} units left
                    </span>
                  </div>
                ))}
                {overview.lowStockAlerts.length === 0 && (
                  <div className="py-6 text-center text-sm text-slate-400">
                    All finished bakery stock levels are healthy
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
