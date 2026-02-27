import { Role } from "./roles";

type PermissionMap = {
  [key: string]: Role[];
};

export const permissions: PermissionMap = {
  /* ================= BUILDING / FLOOR ================= */

  BUILDING_CREATE: [Role.OWNER, Role.ADMIN],
  FLOOR_CREATE: [Role.OWNER, Role.ADMIN],

  /* ================= SEATS ================= */

  SEAT_CREATE: [Role.OWNER, Role.ADMIN],
  SEAT_LOCK: [Role.OWNER, Role.ADMIN],

  SEAT_ASSIGN_SELF: [
    Role.EMPLOYEE,
    Role.MANAGER,
    Role.HR,
    Role.ADMIN,
    Role.OWNER,
  ],

  SEAT_ASSIGN_OTHERS: [
    Role.OWNER,
    Role.ADMIN,
    Role.HR,
    Role.MANAGER,
  ],

  SEAT_REASSIGN: [
    Role.OWNER,
    Role.ADMIN,
    Role.HR,
  ],

  /* ================= ANALYTICS ================= */

  VIEW_ANALYTICS: [
    Role.OWNER,
    Role.ADMIN,
    Role.HR,
    Role.MANAGER,
  ],

  /* ================= AUDIT ================= */

  VIEW_AUDIT_LOGS: [Role.OWNER, Role.ADMIN],
  EXPORT_AUDIT: [Role.OWNER, Role.ADMIN],
};

export function hasPermission(
  role: Role | undefined,
  permission: keyof typeof permissions,
): boolean {
  if (!role) return false;
  return permissions[permission].includes(role);
}

export function canEditFloor(role: Role | undefined) {
  return role === Role.OWNER || role === Role.ADMIN;
}