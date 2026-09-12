import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { Product } from "@/models/Product";
import { Purchase } from "@/models/Purchase";
import { Ingredient } from "@/models/Ingredient";
import { SaleRepository } from "@/repositories/sale.repository";
import { ProductRepository } from "@/repositories/product.repository";

const saleRepo = new SaleRepository();
const productRepo = new ProductRepository();

export class DashboardService {
  async getOverview(branchId?: string) {
    await connectDB();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySales,
      weekSales,
      monthSales,
      recentSales,
      topProducts,
      lowStockProducts,
      todayPurchasesAgg,
      todayExpensesAgg,
      monthExpensesAgg,
      recentPurchases,
      lowStockIngredients,
      totalProducts,
      totalIngredients,
    ] = await Promise.all([
      saleRepo.getRevenueStats(startOfDay, new Date(), branchId),
      saleRepo.getRevenueStats(startOfWeek, new Date(), branchId),
      saleRepo.getRevenueStats(startOfMonth, new Date(), branchId),
      saleRepo.recent(8),
      saleRepo.topProducts(5, startOfMonth, new Date()),
      productRepo.lowStock(),
      Purchase.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfDay },
            ...(branchId ? { branchId } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startOfDay },
            ...(branchId ? { branchId } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth },
            ...(branchId ? { branchId } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Purchase.find({ status: "completed" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("supplierId", "name company")
        .lean(),
      Ingredient.find({
        isActive: true,
        $expr: { $lte: ["$stockInBaseUnit", "$minimumStockInBaseUnit"] },
      })
        .populate("preferredSupplierId", "name phone")
        .sort({ stockInBaseUnit: 1 })
        .limit(10)
        .lean(),
      Product.countDocuments({ isActive: true }),
      Ingredient.countDocuments({ isActive: true }),
    ]);

    const todayPurchases = todayPurchasesAgg[0]?.total ?? 0;
    const todayPurchasesCount = todayPurchasesAgg[0]?.count ?? 0;
    const todayExpenses = todayExpensesAgg[0]?.total ?? 0;
    const monthExpenses = monthExpensesAgg[0]?.total ?? 0;

    const todayNetCashFlow = todaySales.totalRevenue - (todayPurchases + todayExpenses);

    return {
      today: {
        revenue: todaySales.totalRevenue,
        sales: todaySales.totalSales,
        avgOrder: todaySales.avgOrder,
        purchases: todayPurchases,
        purchasesCount: todayPurchasesCount,
        expenses: todayExpenses,
        netCashFlow: todayNetCashFlow,
      },
      week: { revenue: weekSales.totalRevenue, sales: weekSales.totalSales },
      month: { revenue: monthSales.totalRevenue, sales: monthSales.totalSales, expenses: monthExpenses },
      recentTransactions: recentSales,
      recentPurchases,
      topProducts,
      lowStockAlerts: lowStockProducts,
      lowStockIngredients,
      totalProducts,
      totalIngredients,
    };
  }

  async getSalesChart(days = 7, branchId?: string) {
    await connectDB();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const { Sale } = await import("@/models/Sale");
    return Sale.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: start },
          ...(branchId ? { branchId } : {}),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
