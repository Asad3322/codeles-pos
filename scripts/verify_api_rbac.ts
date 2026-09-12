import { hasPermission } from "../src/lib/permissions";
import type { Permission, UserRole } from "../src/types";

// Matrix of API endpoints and their required permissions
const API_PERMISSIONS: { endpoint: string; method: string; permission: Permission }[] = [
  { endpoint: "POST /api/ingredients", method: "POST", permission: "ingredients.manage" },
  { endpoint: "PUT /api/ingredients/[id]", method: "PUT", permission: "ingredients.manage" },
  { endpoint: "DELETE /api/ingredients/[id]", method: "DELETE", permission: "ingredients.manage" },
  { endpoint: "POST /api/ingredients/[id]/adjust", method: "POST", permission: "ingredients.adjust" },
  { endpoint: "GET /api/ingredients", method: "GET", permission: "ingredients.view" },
  { endpoint: "POST /api/purchases", method: "POST", permission: "purchases.manage" },
  { endpoint: "GET /api/purchases", method: "GET", permission: "purchases.view" },
  { endpoint: "GET /api/dashboard", method: "GET", permission: "dashboard.view" },
  { endpoint: "GET /api/reports", method: "GET", permission: "reports.view" },
  { endpoint: "POST /api/products", method: "POST", permission: "products.manage" },
  { endpoint: "POST /api/categories", method: "POST", permission: "products.manage" },
  { endpoint: "POST /api/suppliers", method: "POST", permission: "suppliers.manage" },
  { endpoint: "POST /api/expenses", method: "POST", permission: "expenses.manage" },
  { endpoint: "POST /api/employees", method: "POST", permission: "employees.manage" },
  { endpoint: "POST /api/branches", method: "POST", permission: "branches.manage" },
  { endpoint: "PUT /api/settings", method: "PUT", permission: "settings.manage" },
  { endpoint: "GET /api/notifications", method: "GET", permission: "settings.manage" },
  { endpoint: "POST /api/inventory/adjust", method: "POST", permission: "inventory.manage" },
];

const POS_ALLOWED_APIS: { endpoint: string; method: string; permission: Permission }[] = [
  { endpoint: "POST /api/sales/checkout", method: "POST", permission: "pos.access" },
  { endpoint: "GET /api/sales", method: "GET", permission: "sales.manage" },
  { endpoint: "GET /api/customers", method: "GET", permission: "customers.manage" },
  { endpoint: "POST /api/customers", method: "POST", permission: "customers.manage" },
  { endpoint: "PUT /api/customers/[id]", method: "PUT", permission: "customers.manage" },
];

function testApiRbac() {
  console.log("=== API AUTHORIZATION VERIFICATION ===");
  console.log("\n--- Testing Restricted Administrative APIs for Cashier (Expected: 403 Forbidden) ---");
  for (const api of API_PERMISSIONS) {
    const isAllowed = hasPermission("cashier", api.permission);
    const status = isAllowed ? "FAIL - Cashier Has Access!" : "PASS (403 Forbidden)";
    console.log(`  ${api.endpoint.padEnd(36)} [${api.permission}] -> ${status}`);
    if (isAllowed) {
      throw new Error(`Security violation: cashier allowed access to ${api.endpoint}`);
    }
  }

  console.log("\n--- Testing Operational POS APIs for Cashier (Expected: 200/201 Allowed) ---");
  for (const api of POS_ALLOWED_APIS) {
    const isAllowed = hasPermission("cashier", api.permission);
    const status = isAllowed ? "PASS (Allowed)" : "FAIL - Cashier Blocked!";
    console.log(`  ${api.endpoint.padEnd(36)} [${api.permission}] -> ${status}`);
    if (!isAllowed) {
      throw new Error(`POS operation blocked: cashier denied access to ${api.endpoint}`);
    }
  }

  console.log("\n--- Testing Full Access for Admin (Expected: All Allowed) ---");
  for (const api of [...API_PERMISSIONS, ...POS_ALLOWED_APIS]) {
    const isAllowed = hasPermission("admin", api.permission);
    if (!isAllowed) {
      throw new Error(`Admin unexpectedly blocked from ${api.endpoint}`);
    }
  }
  console.log("  PASS: Admin has full access to all 23 API endpoints.");

  console.log("\n=== ALL API RBAC TESTS PASSED SUCCESSFULLY ===");
}

testApiRbac();
