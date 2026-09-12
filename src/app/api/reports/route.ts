import { connectDB } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth-helpers";
import { Customer } from "@/models/Customer";
import { Expense } from "@/models/Expense";
import { Product } from "@/models/Product";
import { Ingredient } from "@/models/Ingredient";
import { Purchase } from "@/models/Purchase";
import { Supplier } from "@/models/Supplier";
import { Sale } from "@/models/Sale";
import { SaleRepository } from "@/repositories/sale.repository";
import { formatIngredientStock } from "@/lib/unit-conversion";

const saleRepo = new SaleRepository();

export async function GET(req: Request) {
  try {
    await requirePermission("reports.view");
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "sales";
    const days = Number(searchParams.get("days") ?? 30);
    const start = new Date();
    start.setDate(start.getDate() - days);

    if (type === "sales") {
      const sales = await Sale.find({
        status: "completed",
        createdAt: { $gte: start },
      })
        .populate("cashierId", "name")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      const rows = sales.map((s) => ({
        Invoice: s.invoiceNumber,
        Date: new Date(s.createdAt).toLocaleDateString(),
        Cashier: (s.cashierId as { name?: string })?.name ?? "—",
        Subtotal: s.subtotal,
        Discount: s.discount,
        Tax: s.tax,
        Total: s.total,
        Status: s.status,
      }));

      const stats = await saleRepo.getRevenueStats(start, new Date());
      return apiSuccess({ rows, stats, type: "sales" });
    }

    if (type === "inventory") {
      const products = await Product.find({ isActive: true })
        .populate("categoryId", "name")
        .sort({ name: 1 })
        .lean();

      const rows = products.map((p) => ({
        "Bakery Item": p.name,
        SKU: p.sku,
        Category: (p.categoryId as { name?: string })?.name ?? "—",
        Stock: p.stock,
        "Low Threshold": p.lowStockThreshold,
        "Cost Price": p.costPrice,
        "Sell Price": p.sellingPrice,
        Status: p.stock <= p.lowStockThreshold ? "Low" : "OK",
      }));

      return apiSuccess({ rows, type: "inventory" });
    }

    if (type === "ingredient_stock") {
      const ingredients = await Ingredient.find({ isActive: true })
        .populate("preferredSupplierId", "name company")
        .sort({ category: 1, name: 1 })
        .lean();

      const rows = ingredients.map((ing) => {
        const totalValue = ing.stockInBaseUnit * (ing.averageCostPerBaseUnit || 0);
        return {
          Ingredient: ing.name,
          Code: ing.code,
          Category: ing.category,
          "Current Stock": formatIngredientStock(ing.stockInBaseUnit, ing.defaultDisplayUnit),
          "Base Unit Stock": `${ing.stockInBaseUnit} ${ing.baseUnit}`,
          "Avg Unit Cost": `Rs. ${ing.averageCostPerBaseUnit.toFixed(4)} / ${ing.baseUnit}`,
          "Stock Valuation": Math.round(totalValue * 100) / 100,
          "Min Threshold": `${ing.minimumStockInBaseUnit} ${ing.baseUnit}`,
          Supplier: (ing.preferredSupplierId as { name?: string })?.name ?? "—",
          Status:
            ing.stockInBaseUnit <= 0
              ? "Out of Stock"
              : ing.stockInBaseUnit <= ing.minimumStockInBaseUnit
              ? "Low Stock"
              : "In Stock",
        };
      });

      return apiSuccess({ rows, type: "ingredient_stock" });
    }

    if (type === "purchases") {
      const purchases = await Purchase.find({
        status: "completed",
        createdAt: { $gte: start },
      })
        .populate("supplierId", "name company")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();

      const rows = purchases.map((p) => ({
        "Purchase #": p.purchaseNumber,
        Date: new Date(p.createdAt).toLocaleDateString(),
        Supplier: (p.supplierId as { name?: string })?.name ?? "Unknown",
        Items: p.items.map((i) => `${i.nameSnapshot} (${i.purchaseQuantity} ${i.purchaseUnit})`).join(", "),
        Subtotal: p.subtotal,
        Tax: p.tax,
        Total: p.total,
        Paid: p.paid,
        Balance: p.total - p.paid,
        ReceivedBy: (p.createdBy as { name?: string })?.name ?? "—",
      }));

      return apiSuccess({ rows, type: "purchases" });
    }

    if (type === "low_stock") {
      const [ingredients, products] = await Promise.all([
        Ingredient.find({
          isActive: true,
          $expr: { $lte: ["$stockInBaseUnit", "$minimumStockInBaseUnit"] },
        })
          .populate("preferredSupplierId", "name phone")
          .lean(),
        Product.find({
          isActive: true,
          $expr: { $lte: ["$stock", "$lowStockThreshold"] },
        }).lean(),
      ]);

      const rows = [
        ...ingredients.map((ing) => ({
          Type: "Raw Ingredient",
          Item: ing.name,
          Identifier: ing.code,
          "Current Stock": formatIngredientStock(ing.stockInBaseUnit, ing.defaultDisplayUnit),
          "Min Threshold": `${ing.minimumStockInBaseUnit} ${ing.baseUnit}`,
          Supplier: (ing.preferredSupplierId as { name?: string })?.name ?? "—",
          Status: ing.stockInBaseUnit <= 0 ? "Out of Stock" : "Low Stock",
        })),
        ...products.map((p) => ({
          Type: "Bakery Item",
          Item: p.name,
          Identifier: p.sku,
          "Current Stock": `${p.stock} ${p.unit || "pcs"}`,
          "Min Threshold": `${p.lowStockThreshold} ${p.unit || "pcs"}`,
          Supplier: "—",
          Status: p.stock <= 0 ? "Out of Stock" : "Low Stock",
        })),
      ];

      return apiSuccess({ rows, type: "low_stock" });
    }

    if (type === "suppliers") {
      const suppliers = await Supplier.find({ isActive: true })
        .sort({ name: 1 })
        .lean();

      const rows = suppliers.map((s) => ({
        Supplier: s.name,
        Company: s.company ?? "—",
        Phone: s.phone ?? "—",
        Email: s.email ?? "—",
        "Total Paid": s.totalPaid || 0,
        "Outstanding Balance": s.dueBalance || 0,
      }));

      return apiSuccess({ rows, type: "suppliers" });
    }

    if (type === "customers") {
      const customers = await Customer.find({ isActive: true })
        .sort({ name: 1 })
        .lean();

      const rows = customers.map((c) => ({
        Name: c.name,
        Email: c.email ?? "—",
        Phone: c.phone ?? "—",
        "Loyalty Points": c.loyaltyPoints,
        "Due Balance": c.dueBalance,
        "Total Purchases": c.totalPurchases,
      }));

      return apiSuccess({ rows, type: "customers" });
    }

    if (type === "profit" || type === "cash_flow") {
      const stats = await saleRepo.getRevenueStats(start, new Date());
      const [expenseAgg, purchaseAgg] = await Promise.all([
        Expense.aggregate([
          { $match: { date: { $gte: start } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Purchase.aggregate([
          { $match: { status: "completed", createdAt: { $gte: start } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

      const expenses = expenseAgg[0]?.total ?? 0;
      const purchases = purchaseAgg[0]?.total ?? 0;
      const revenue = stats.totalRevenue ?? 0;
      const netCashFlow = revenue - (purchases + expenses);

      return apiSuccess({
        type: "cash_flow",
        rows: [
          { Metric: "Total Sales Revenue", Amount: revenue },
          { Metric: "Total Purchases (Raw Materials)", Amount: purchases },
          { Metric: "Total Operating Expenses", Amount: expenses },
          { Metric: "Net Operational Cash Flow", Amount: netCashFlow },
          { Metric: "Completed Sales Count", Amount: stats.totalSales ?? 0 },
        ],
      });
    }

    return apiError("Invalid report type");
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed", 401);
  }
}
