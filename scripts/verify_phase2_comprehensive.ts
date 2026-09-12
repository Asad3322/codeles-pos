import { connectDB } from "../src/lib/db";
import {
  toBaseUnits,
  generateIngredientCode,
  formatIngredientStock,
} from "../src/lib/unit-conversion";
import { hasPermission } from "../src/lib/permissions";
import { IngredientService } from "../src/services/ingredient.service";
import { PurchaseService } from "../src/services/purchase.service";
import { DashboardService } from "../src/services/dashboard.service";
import { SaleService } from "../src/services/sale.service";
import { Ingredient } from "../src/models/Ingredient";
import { IngredientStockLog } from "../src/models/IngredientStockLog";
import { Purchase } from "../src/models/Purchase";
import { Product } from "../src/models/Product";
import { Supplier } from "../src/models/Supplier";
import { User } from "../src/models/User";
import { Sale } from "../src/models/Sale";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

function assertThrows(fn: () => void, message: string) {
  try {
    fn();
    console.error(`  [FAIL] ${message} (did not throw)`);
    testsFailed++;
  } catch (e) {
    console.log(`  [PASS] ${message} (threw: ${(e as Error).message})`);
    testsPassed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("   CODELIS POS - PHASE 2 COMPREHENSIVE AUTOMATED VERIFICATION   ");
  console.log("===============================================================\n");

  await connectDB();

  // Test 1: Unit Conversions & Rejections
  console.log("--- TEST GROUP 1: Unit Conversion Engine & Edge Cases ---");
  {
    // Weight standard
    const kg = toBaseUnits(2.5, "kg", "weight");
    assert(kg.quantityInBaseUnit === 2500 && kg.conversionFactor === 1000, "2.5 kg -> 2500 g");

    const g = toBaseUnits(500, "g", "weight");
    assert(g.quantityInBaseUnit === 500 && g.conversionFactor === 1, "500 g -> 500 g");

    // Volume standard
    const liter = toBaseUnits(3, "liter", "volume");
    assert(liter.quantityInBaseUnit === 3000 && liter.conversionFactor === 1000, "3 liter -> 3000 ml");

    const ml = toBaseUnits(250, "ml", "volume");
    assert(ml.quantityInBaseUnit === 250 && ml.conversionFactor === 1, "250 ml -> 250 ml");

    // Count standard
    const dozen = toBaseUnits(4, "dozen", "count");
    assert(dozen.quantityInBaseUnit === 48 && dozen.conversionFactor === 12, "4 dozen -> 48 pcs");

    const pcs = toBaseUnits(10, "pcs", "count");
    assert(pcs.quantityInBaseUnit === 10 && pcs.conversionFactor === 1, "10 pcs -> 10 pcs");

    // Non-standard bulk units with custom conversion factor
    const bagFlour = toBaseUnits(2, "bag", "weight", 50000);
    assert(bagFlour.quantityInBaseUnit === 100000 && bagFlour.conversionFactor === 50000, "2 bag flour (50,000g/bag) -> 100,000 g");

    const trayEggs = toBaseUnits(5, "tray", "count", 30);
    assert(trayEggs.quantityInBaseUnit === 150 && trayEggs.conversionFactor === 30, "5 tray eggs (30pcs/tray) -> 150 pcs");

    // Custom unit without factor must THROW
    assertThrows(() => toBaseUnits(1, "bag", "weight"), "Non-standard unit 'bag' without conversion factor throws error");
    assertThrows(() => toBaseUnits(1, "box", "count", 0), "Custom unit 'box' with 0 factor throws error");

    // Incompatible unit family must THROW
    assertThrows(() => toBaseUnits(5, "liter", "weight"), "Liter is rejected for weight family");
    assertThrows(() => toBaseUnits(10, "kg", "volume"), "Kg is rejected for volume family");
    assertThrows(() => toBaseUnits(2, "dozen", "weight"), "Dozen is rejected for weight family");
  }

  // Test 2: Auto Code Generation
  console.log("\n--- TEST GROUP 2: Server-Side Ingredient Code Generation ---");
  {
    const code1 = generateIngredientCode("ING", "Wheat Flour Fine");
    const code2 = generateIngredientCode("ING", "Wheat Flour Fine");
    assert(code1.startsWith("ING-WHEAT-FLOUR"), `Code generated with prefix and name: ${code1}`);
    assert(code1 !== code2, `Collision safety: distinct random suffixes generated (${code1} vs ${code2})`);
  }

  // Test 3: RBAC Permissions
  console.log("\n--- TEST GROUP 3: RBAC Permissions for Phase 2 ---");
  {
    assert(hasPermission("admin", "ingredients.manage"), "Admin role has ingredients.manage");
    assert(hasPermission("admin", "ingredients.view"), "Admin role has ingredients.view");
    assert(hasPermission("manager", "purchases.manage"), "Manager role has purchases.manage");
    assert(hasPermission("staff", "ingredients.view"), "Staff role has ingredients.view");
    assert(!hasPermission("cashier", "ingredients.manage"), "Cashier role without ingredients.manage is denied");
    assert(hasPermission("cashier", "ingredients.manage", ["ingredients.manage"]), "Custom permissions allow ingredients.manage");
  }

  // Setup test actors in DB
  const adminUser = await User.findOne().lean();
  const testUserId = adminUser ? String(adminUser._id) : "000000000000000000000001";
  const supplier = await Supplier.findOne().lean();
  const testSupplierId = supplier ? String(supplier._id) : "000000000000000000000002";

  const ingService = new IngredientService();
  const purchaseService = new PurchaseService();

  // Test 4: Ingredient Creation with Opening Stock & Audit Log
  console.log("\n--- TEST GROUP 4: Ingredient Creation & Opening Stock Audit Log ---");
  let testIngId = "";
  {
    const created = await ingService.create(
      {
        name: "Test Belgian Cocoa Powder",
        unitFamily: "weight",
        defaultDisplayUnit: "kg",
        minimumStock: 2, // 2 kg
        openingStock: 5, // 5 kg
        openingStockUnit: "kg",
        initialCost: 1500, // Rs. 1500 / kg -> Rs. 1.50 / g
        category: "Chocolate & Cocoa",
        preferredSupplierId: testSupplierId,
      },
      testUserId
    );

    testIngId = String(created._id);
    assert(created.code.startsWith("ING-"), `Ingredient created with auto-code: ${created.code}`);
    assert(created.stockInBaseUnit === 5000, `Stock initialized in base units: ${created.stockInBaseUnit} g`);
    assert(Math.abs(created.averageCostPerBaseUnit - 1.5) < 0.0001, `Average cost initialized: Rs. ${created.averageCostPerBaseUnit}/g`);

    // Verify audit log
    const auditLog = await IngredientStockLog.findOne({
      ingredientId: created._id,
      type: "opening_stock",
    }).lean();

    assert(!!auditLog, "Opening stock audit log created");
    assert(auditLog?.quantityInBaseUnit === 5000, "Audit log quantity delta is +5000 g");
    assert(auditLog?.newStockInBaseUnit === 5000, "Audit log resulting stock is 5000 g");
  }

  // Test 5: Manual Stock Adjustment & Audit Log
  console.log("\n--- TEST GROUP 5: Manual Stock Adjustment Audit Log ---");
  {
    const { ingredient: updatedIng } = await ingService.adjustStock(
      testIngId,
      {
        adjustmentType: "subtract",
        quantity: 1, // 1 kg
        unit: "kg",
        reason: "correction",
        notes: "Quality check sample used for test batch",
      },
      testUserId
    );

    assert(updatedIng.stockInBaseUnit === 4000, `Stock adjusted from 5000g to 4000g (newStock: ${updatedIng.stockInBaseUnit})`);

    const adjAudit = await IngredientStockLog.findOne({
      ingredientId: testIngId,
      type: "adjustment",
    }).sort({ createdAt: -1 }).lean();

    assert(!!adjAudit, "Manual adjustment audit log recorded");
    assert(adjAudit?.quantityInBaseUnit === -1000, "Audit log quantity change is -1000 g");
    assert(adjAudit?.newStockInBaseUnit === 4000, "Audit log resulting stock is 4000 g");
    assert(adjAudit?.reason === "correction", "Audit log reason recorded");
  }

  // Test 6: Purchase Lifecycle, Weighted-Average Cost & Supplier Accounting
  console.log("\n--- TEST GROUP 6: Purchase Lifecycle, Weighted-Average Cost & Supplier Accounting ---");
  let testPurchaseId = "";
  {
    // Current stock: 4000g at Rs. 1.50/g (total value = Rs. 6000)
    // New purchase: 6 kg (6000g) at Rs. 1800/kg -> Rs. 1.80/g (total cost = Rs. 10800)
    // New total stock = 4000g + 6000g = 10000g
    // New weighted average cost = (6000 + 10800) / 10000 = 16800 / 10000 = Rs. 1.68 / g

    const supplierBefore = await Supplier.findById(testSupplierId).lean();
    const paidBefore = supplierBefore?.totalPaid || 0;
    const dueBefore = supplierBefore?.dueBalance || 0;

    const purchase = await purchaseService.createPurchase(
      {
        supplierId: testSupplierId,
        items: [
          {
            itemType: "ingredient",
            ingredientId: testIngId,
            name: "Test Belgian Cocoa Powder",
            quantity: 6,
            unit: "kg",
            unitCost: 1800, // Rs. 1800 / kg
          },
        ],
        paid: 5000, // Partial payment
        notes: "Phase 2 Automated Verification Purchase",
      },
      testUserId
    );

    testPurchaseId = String(purchase._id);
    assert(purchase.status === "completed", `Purchase lifecycle completed (status: ${purchase.status})`);
    assert(purchase.total === 10800, `Purchase total calculated: Rs. ${purchase.total}`);
    assert(purchase.paid === 5000, `Purchase paid recorded: Rs. ${purchase.paid}`);

    // Verify ingredient stock and cost
    const updatedIng = await Ingredient.findById(testIngId).lean();
    assert(updatedIng?.stockInBaseUnit === 10000, `Ingredient stock increased to 10,000 g (actual: ${updatedIng?.stockInBaseUnit})`);
    assert(
      Math.abs((updatedIng?.averageCostPerBaseUnit || 0) - 1.68) < 0.0001,
      `Weighted average cost updated to Rs. 1.68 / g (actual: ${updatedIng?.averageCostPerBaseUnit})`
    );

    // Verify purchase audit log
    const purchaseAudit = await IngredientStockLog.findOne({
      ingredientId: testIngId,
      type: "purchase",
      purchaseId: purchase._id,
    }).lean();

    assert(!!purchaseAudit, "IngredientStockLog for purchase created with purchaseId reference");
    assert(purchaseAudit?.quantityInBaseUnit === 6000, "Purchase log quantity change is +6000 g");
    assert(purchaseAudit?.newStockInBaseUnit === 10000, "Purchase log resulting stock is 10,000 g");

    // Verify supplier ledger update
    const supplierAfter = await Supplier.findById(testSupplierId).lean();
    const expectedPaid = paidBefore + 5000;
    const expectedDue = dueBefore + (10800 - 5000); // +5800 due
    assert(supplierAfter?.totalPaid === expectedPaid, `Supplier totalPaid updated: ${supplierAfter?.totalPaid}`);
    assert(supplierAfter?.dueBalance === expectedDue, `Supplier dueBalance updated: ${supplierAfter?.dueBalance}`);
  }

  // Test 7: Simulated Purchase Failure & Recovery (Compensating Rollback)
  console.log("\n--- TEST GROUP 7: Purchase Failure & Compensating Rollback ---");
  {
    const ingBefore = await Ingredient.findById(testIngId).lean();
    const stockBefore = ingBefore?.stockInBaseUnit || 0;

    // Simulate an error by attempting to purchase with an invalid item mixed with a valid item
    try {
      await purchaseService.createPurchase(
        {
          supplierId: testSupplierId,
          items: [
            {
              itemType: "ingredient",
              ingredientId: testIngId,
              name: "Test Belgian Cocoa Powder",
              quantity: 2,
              unit: "kg",
              unitCost: 1500,
            },
            {
              itemType: "ingredient",
              ingredientId: "000000000000000000000099", // Non-existent ingredient
              name: "Invalid Ingredient",
              quantity: 1,
              unit: "kg",
              unitCost: 1000,
            },
          ],
          paid: 0,
        },
        testUserId
      );
      assert(false, "Invalid purchase should have thrown error");
    } catch (e) {
      assert(true, `Purchase rejected cleanly during validation: ${(e as Error).message}`);
    }

    // Stock should not be modified
    const ingAfter = await Ingredient.findById(testIngId).lean();
    assert(ingAfter?.stockInBaseUnit === stockBefore, `Stock was safely unaffected: ${ingAfter?.stockInBaseUnit} g`);
  }

  // Test 8: Legacy Product Purchasing Support (Backward Compatibility)
  console.log("\n--- TEST GROUP 8: Legacy Product Purchasing Support ---");
  {
    const product = await Product.findOne({ isActive: true }).lean();
    if (product) {
      const prodStockBefore = product.stock;
      const prodPurchase = await purchaseService.createPurchase(
        {
          supplierId: testSupplierId,
          items: [
            {
              itemType: "product",
              productId: String(product._id),
              name: product.name,
              quantity: 5,
              unit: "pcs",
              unitCost: 100,
            },
          ],
          paid: 500,
        },
        testUserId
      );

      assert(prodPurchase.status === "completed", "Legacy product purchase completed successfully");
      const updatedProd = await Product.findById(product._id).lean();
      assert(updatedProd?.stock === prodStockBefore + 5, `Product stock incremented from ${prodStockBefore} to ${updatedProd?.stock}`);

      // Clean up product stock back to original
      await Product.findByIdAndUpdate(product._id, { stock: prodStockBefore });
      await Purchase.findByIdAndDelete(prodPurchase._id);
      const { InventoryLog } = await import("../src/models/InventoryLog");
      await InventoryLog.deleteMany({ reference: prodPurchase.purchaseNumber });
    } else {
      console.log("  [SKIP] No product found for legacy purchasing test");
    }
  }

  // Test 9: Low Stock Detection
  console.log("\n--- TEST GROUP 9: Low Stock Detection Engine ---");
  {
    // Set test ingredient stock below threshold
    await Ingredient.findByIdAndUpdate(testIngId, {
      stockInBaseUnit: 1500, // 1.5 kg (below 2 kg min)
    });

    const lowStockIngs = await ingService.getLowStock();
    const found = lowStockIngs.some((i) => String(i._id) === testIngId);
    assert(found, "Low stock ingredient correctly detected in low stock query");

    // Reset stock to healthy level
    await Ingredient.findByIdAndUpdate(testIngId, { stockInBaseUnit: 10000 });
  }

  // Test 10: Dashboard Analytics & Net Cash Flow
  console.log("\n--- TEST GROUP 10: Dashboard Analytics & Net Cash Flow ---");
  {
    const dashboard = new DashboardService();
    const overview = await dashboard.getOverview();

    assert(typeof overview.today.revenue === "number", "Today revenue is a number");
    assert(typeof overview.today.purchases === "number", "Today purchases is a number");
    assert(typeof overview.today.expenses === "number", "Today expenses is a number");
    assert(
      overview.today.netCashFlow === overview.today.revenue - (overview.today.purchases + overview.today.expenses),
      `Net Cash Flow formula verified: Revenue (${overview.today.revenue}) - (Purchases (${overview.today.purchases}) + Expenses (${overview.today.expenses})) = Net Cash Flow (${overview.today.netCashFlow})`
    );
    assert(Array.isArray(overview.recentPurchases), "Recent purchases array returned for dashboard");
    assert(Array.isArray(overview.lowStockIngredients), "Low stock ingredients array returned for dashboard");
  }

  // Test 11: POS Checkout Regression
  console.log("\n--- TEST GROUP 11: POS Checkout Regression Test ---");
  {
    const product = await Product.findOne({ isActive: true, stock: { $gt: 5 } }).lean();
    if (product) {
      const saleService = new SaleService();
      const initialStock = product.stock;

      const sale = await saleService.completeSale({
        items: [
          {
            productId: String(product._id),
            name: product.name,
            sku: product.sku,
            quantity: 1,
            price: product.sellingPrice,
            discount: 0,
            tax: 0,
          },
        ],
        discount: 0,
        taxRate: 0,
        payments: [{ method: "cash", amount: product.sellingPrice }],
        cashierId: testUserId,
      });

      assert(!!sale._id, `POS Checkout successful (Invoice: ${sale.invoiceNumber})`);
      const prodAfterSale = await Product.findById(product._id).lean();
      assert(prodAfterSale?.stock === initialStock - 1, `Product stock deducted accurately from ${initialStock} to ${prodAfterSale?.stock}`);

      // Verify thermal receipt fields
      assert(!!sale.invoiceNumber, "Invoice number generated for thermal receipt");
      assert(sale.items.length === 1, "Sale line item recorded");
      assert(sale.status === "completed", "Sale status is completed");
      assert(sale.total === product.sellingPrice, `Receipt total matches: Rs. ${sale.total}`);

      // Cleanup test sale and its inventory log
      await Sale.findByIdAndDelete(sale._id);
      const { InventoryLog } = await import("../src/models/InventoryLog");
      await InventoryLog.deleteMany({ reference: sale.invoiceNumber });
      await Product.findByIdAndUpdate(product._id, { stock: initialStock });
    }
  }

  // Cleanup test records created during test
  if (testPurchaseId) {
    await Purchase.findByIdAndDelete(testPurchaseId);
  }
  if (testIngId) {
    await IngredientStockLog.deleteMany({ ingredientId: testIngId });
    await Ingredient.findByIdAndDelete(testIngId);
  }
  if (testSupplierId) {
    await Supplier.findByIdAndUpdate(testSupplierId, {
      dueBalance: 0,
      totalPaid: 0,
    });
  }

  console.log("\n===============================================================");
  console.log(`TEST SUMMARY: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("===============================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  });
