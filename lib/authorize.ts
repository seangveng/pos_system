import type { UserRole } from "@/models/User";
import { hasPermission, type Permission } from "@/lib/permissions";

export function authorize(role: UserRole, permission: Permission): boolean {
  return hasPermission(role, permission);
}

export function requirePermission(role: UserRole, permission: Permission) {
  if (!authorize(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}
