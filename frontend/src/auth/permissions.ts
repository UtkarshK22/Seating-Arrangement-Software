import type { Role } from "./roles";

export const permissions = {
  BUILDING_CREATE: ["OWNER", "ADMIN"] as Role[],
  FLOOR_CREATE: ["OWNER", "ADMIN"] as Role[],
  SEAT_CREATE: ["OWNER", "ADMIN"] as Role[],
  SEAT_LOCK: ["OWNER", "ADMIN"] as Role[],
  SEAT_ASSIGN_SELF: ["EMPLOYEE", "MANAGER", "HR", "ADMIN", "OWNER"] as Role[],
  SEAT_ASSIGN_OTHERS: ["OWNER", "ADMIN", "HR"] as Role[],
  SEAT_REASSIGN: ["OWNER", "ADMIN", "HR"] as Role[],
  VIEW_AUDIT_LOGS: ["OWNER", "ADMIN"] as Role[],
  EXPORT_AUDIT: ["OWNER", "ADMIN"] as Role[],
};
