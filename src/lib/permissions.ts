import type { Permission, UserRole } from "@/types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "dashboard.view",
    "pos.access",
    "products.manage",
    "inventory.manage",
    "ingredients.view",
    "ingredients.manage",
    "ingredients.adjust",
    "customers.manage",
    "suppliers.manage",
    "purchases.view",
    "purchases.manage",
    "sales.manage",
    "expenses.manage",
    "employees.manage",
    "reports.view",
    "settings.manage",
    "branches.manage",
  ],
  manager: [
    "dashboard.view",
    "pos.access",
    "products.manage",
    "inventory.manage",
    "ingredients.view",
    "ingredients.manage",
    "ingredients.adjust",
    "customers.manage",
    "suppliers.manage",
    "purchases.view",
    "purchases.manage",
    "sales.manage",
    "expenses.manage",
    "reports.view",
  ],
  cashier: ["pos.access", "sales.manage", "customers.manage"],
  staff: ["pos.access", "inventory.manage", "ingredients.view"],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getDefaultRouteForRole(role?: UserRole): string {
  switch (role) {
    case "cashier":
    case "staff":
      return "/pos";
    case "admin":
    case "manager":
    default:
      return "/dashboard";
  }
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
  customPermissions?: Permission[]
): boolean {
  const perms = new Set([
    ...getPermissionsForRole(role),
    ...(customPermissions ?? []),
  ]);
  return perms.has(permission);
}

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard.view",
  "/pos": "pos.access",
  "/products": "products.manage",
  "/categories": "products.manage",
  "/brands": "products.manage",
  "/inventory": "inventory.manage",
  "/ingredients": "ingredients.view",
  "/customers": "customers.manage",
  "/suppliers": "suppliers.manage",
  "/purchases": "purchases.view",
  "/sales": "sales.manage",
  "/expenses": "expenses.manage",
  "/employees": "employees.manage",
  "/reports": "reports.view",
  "/settings": "settings.manage",
  "/branches": "branches.manage",
  "/notifications": "settings.manage",
};