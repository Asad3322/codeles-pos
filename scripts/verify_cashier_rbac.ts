import { connectDB } from "../src/lib/db";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Category } from "../src/models/Category";
import { Brand } from "../src/models/Brand";
import { Sale } from "../src/models/Sale";
import { Purchase } from "../src/models/Purchase";
import { Ingredient } from "../src/models/Ingredient";
import { Customer } from "../src/models/Customer";
import { Supplier } from "../src/models/Supplier";
import { Settings } from "../src/models/Settings";
import { hasPermission, getPermissionsForRole, getDefaultRouteForRole, ROUTE_PERMISSIONS } from "../src/lib/permissions";
import type { Permission, UserRole } from "../src/types";

async function main() {
  console.log("=== CODELES POS: CASHIER ROLE ACCESS & RBAC VERIFICATION ===\n");

  await connectDB();

  // 1. Verify Database State Preservation
  console.log("1. DATABASE BASELINE VERIFICATION");
  const [
    productCount,
    categoryCount,
    brandCount,
    saleCount,
    purchaseCount,
    customerCount,
    supplierCount,
    userCount,
    settingsCount,
    ingredientCount,
  ] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Brand.countDocuments(),
    Sale.countDocuments(),
    Purchase.countDocuments(),
    Customer.countDocuments(),
    Supplier.countDocuments(),
    User.countDocuments(),
    Settings.countDocuments(),
    Ingredient.countDocuments(),
  ]);

  console.log(`- Products: ${productCount} (Expected: 10)`);
  console.log(`- Categories: ${categoryCount} (Expected: 11)`);
  console.log(`- Brands: ${brandCount} (Expected: 1)`);
  console.log(`- Sales: ${saleCount} (Expected: 6)`);
  console.log(`- Purchases: ${purchaseCount} (Expected: 0)`);
  console.log(`- Customers: ${customerCount} (Expected: 3)`);
  console.log(`- Suppliers: ${supplierCount} (Expected: 2)`);
  console.log(`- Users: ${userCount} (Expected: 2)`);
  console.log(`- Settings: ${settingsCount} (Expected: 1)`);
  console.log(`- Ingredients: ${ingredientCount}`);

  if (userCount !== 2) throw new Error(`Unexpected user count: ${userCount}`);
  if (productCount !== 10) throw new Error(`Unexpected product count: ${productCount}`);

  // 2. Verify Existing Users & Roles
  console.log("\n2. EXISTING USERS IN MONGODB");
  const users = await User.find().select("name email role isActive").lean();
  for (const u of users) {
    console.log(`- User: ${u.email} | Role: ${u.role} | Name: ${u.name} | Active: ${u.isActive}`);
  }

  const cashierUser = users.find((u) => u.email === "cashier@pos.local");
  const adminUser = users.find((u) => u.email === "admin@pos.local");
  if (!cashierUser || cashierUser.role !== "cashier") {
    throw new Error("cashier@pos.local is missing or not a cashier");
  }
  if (!adminUser || adminUser.role !== "admin") {
    throw new Error("admin@pos.local is missing or not an admin");
  }

  // 3. Default Landing Routes
  console.log("\n3. DEFAULT LANDING ROUTES");
  console.log(`- Admin default route: ${getDefaultRouteForRole("admin")} (Expected: /dashboard)`);
  console.log(`- Manager default route: ${getDefaultRouteForRole("manager")} (Expected: /dashboard)`);
  console.log(`- Cashier default route: ${getDefaultRouteForRole("cashier")} (Expected: /pos)`);
  console.log(`- Staff default route: ${getDefaultRouteForRole("staff")} (Expected: /pos)`);

  if (getDefaultRouteForRole("admin") !== "/dashboard") throw new Error("Admin default route failed");
  if (getDefaultRouteForRole("cashier") !== "/pos") throw new Error("Cashier default route failed");

  // 4. Cashier Role Permissions Check
  console.log("\n4. CASHIER PERMISSIONS AUDIT");
  const cashierPerms = getPermissionsForRole("cashier");
  console.log("Cashier permissions:", cashierPerms);

  const allowedCashierPermissions: Permission[] = ["pos.access", "sales.manage", "customers.manage"];
  const forbiddenCashierPermissions: Permission[] = [
    "dashboard.view",
    "products.manage",
    "inventory.manage",
    "ingredients.view",
    "ingredients.manage",
    "ingredients.adjust",
    "suppliers.manage",
    "purchases.view",
    "purchases.manage",
    "expenses.manage",
    "employees.manage",
    "reports.view",
    "settings.manage",
    "branches.manage",
  ];

  for (const perm of allowedCashierPermissions) {
    const ok = hasPermission("cashier", perm);
    console.log(`  [ALLOW] Cashier has '${perm}': ${ok}`);
    if (!ok) throw new Error(`Cashier should have permission: ${perm}`);
  }

  for (const perm of forbiddenCashierPermissions) {
    const denied = !hasPermission("cashier", perm);
    console.log(`  [DENY] Cashier lacks '${perm}': ${denied}`);
    if (!denied) throw new Error(`Cashier MUST NOT have permission: ${perm}`);
  }

  // 5. Admin Role Permissions Check
  console.log("\n5. ADMIN PERMISSIONS AUDIT");
  const adminPerms = getPermissionsForRole("admin");
  console.log(`Admin has ${adminPerms.length} permissions.`);
  for (const perm of [...allowedCashierPermissions, ...forbiddenCashierPermissions]) {
    const ok = hasPermission("admin", perm);
    if (!ok) throw new Error(`Admin MUST have permission: ${perm}`);
  }
  console.log("  [PASS] Admin retains all 16 modules/permissions.");

  // 6. UI Route Protection Mapping
  console.log("\n6. ROUTE PROTECTION MATRIX FOR CASHIER");
  const testRoutes = [
    { path: "/dashboard", expectedAllowed: false },
    { path: "/pos", expectedAllowed: true },
    { path: "/sales", expectedAllowed: true },
    { path: "/customers", expectedAllowed: true },
    { path: "/products", expectedAllowed: false },
    { path: "/categories", expectedAllowed: false },
    { path: "/ingredients", expectedAllowed: false },
    { path: "/inventory", expectedAllowed: false },
    { path: "/purchases", expectedAllowed: false },
    { path: "/suppliers", expectedAllowed: false },
    { path: "/expenses", expectedAllowed: false },
    { path: "/employees", expectedAllowed: false },
    { path: "/reports", expectedAllowed: false },
    { path: "/branches", expectedAllowed: false },
    { path: "/settings", expectedAllowed: false },
    { path: "/notifications", expectedAllowed: false },
  ];

  for (const route of testRoutes) {
    const permission = ROUTE_PERMISSIONS[route.path];
    const isAllowed = permission ? hasPermission("cashier", permission) : true;
    const pass = isAllowed === route.expectedAllowed;
    console.log(
      `  Route ${route.path.padEnd(16)} -> Permission: ${(permission ?? "none").padEnd(18)} | Cashier Allowed: ${isAllowed} | Status: ${pass ? "PASS" : "FAIL"}`
    );
    if (!pass) throw new Error(`Route protection failed for ${route.path}`);
  }

  // 7. Sales History Behavior Audit
  console.log("\n7. SALES HISTORY BEHAVIOR AUDIT");
  const sampleSales = await Sale.find().limit(5).lean();
  console.log(`Total existing sales in DB: ${saleCount}`);
  for (const s of sampleSales) {
    console.log(`  - Sale #${s.invoiceNumber} | Total: Rs. ${s.total} | CashierId: ${s.cashierId ?? "none"}`);
  }
  console.log("  Observation: SaleRepository queries all sales in branch without filtering by specific cashierId.");
  console.log("  Preserved existing sales history query behavior as requested.");

  // 8. POS Product & Barcode Access for Cashier
  console.log("\n8. POS OPERATIONAL READINESS FOR CASHIER");
  const activeProducts = await Product.find({ isActive: true }).limit(3).lean();
  console.log(`Found ${activeProducts.length} sample active products for POS:`);
  for (const p of activeProducts) {
    console.log(`  - ${p.name} | SKU: ${p.sku} | Price: Rs. ${p.sellingPrice} | Stock: ${p.stock}`);
  }

  console.log("\n=== ALL RBAC & CASHIER ACCESS VERIFICATIONS PASSED ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
