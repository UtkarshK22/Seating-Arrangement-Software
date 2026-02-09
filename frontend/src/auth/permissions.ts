import { Role } from "./roles";

export const permissions = {
  BUILDING_CREATE: [Role.OWNER, Role.ADMIN],
  FLOOR_CREATE: [Role.OWNER, Role.ADMIN],
  SEAT_CREATE: [Role.OWNER, Role.ADMIN],
  SEAT_LOCK: [Role.OWNER, Role.ADMIN],

  SEAT_ASSIGN_SELF: [
    Role.EMPLOYEE,
    Role.MANAGER,
    Role.HR,
    Role.ADMIN,
    Role.OWNER,
  ],

  SEAT_ASSIGN_OTHERS: [Role.OWNER, Role.ADMIN, Role.HR],
  SEAT_REASSIGN: [Role.OWNER, Role.ADMIN, Role.HR],

  VIEW_AUDIT_LOGS: [Role.OWNER, Role.ADMIN],
  EXPORT_AUDIT: [Role.OWNER, Role.ADMIN],
} as const;
