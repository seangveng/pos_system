import type { UserRole } from "@/models/User";

export type Permission =
  | "products.view"
  | "products.manage"
  | "inventory.view"
  | "inventory.manage"
  | "orders.view_own"
  | "orders.view_all"
  | "orders.create_online"
  | "orders.create_pos"
  | "orders.update_status"
  | "customers.view"
  | "customers.manage"
  | "reports.view"
  | "reports.view_limited"
  | "staff.manage"
  | "admins.manage"
  | "settings.view"
  | "settings.manage"
  | "activity_logs.view"
  | "roles.manage";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: ["products.view", "orders.view_own", "orders.create_online"],

  STAFF: [
    "products.view",
    "inventory.view",
    "inventory.manage",
    "orders.view_all",
    "orders.create_pos",
    "orders.update_status",
    "customers.view",
    "customers.manage",
    "reports.view_limited",
  ],

  ADMIN: [
    "products.view",
    "products.manage",
    "inventory.view",
    "inventory.manage",
    "orders.view_all",
    "orders.create_pos",
    "orders.update_status",
    "customers.view",
    "customers.manage",
    "reports.view",
    "staff.manage",
    "settings.view",
    "activity_logs.view",
  ],

  OWNER: [
    "products.view",
    "products.manage",
    "inventory.view",
    "inventory.manage",
    "orders.view_all",
    "orders.create_pos",
    "orders.update_status",
    "customers.view",
    "customers.manage",
    "reports.view",
    "staff.manage",
    "admins.manage",
    "settings.view",
    "settings.manage",
    "activity_logs.view",
    "roles.manage",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
