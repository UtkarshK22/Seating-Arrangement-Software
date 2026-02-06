export type Role = "OWNER" | "ADMIN" | "EMPLOYEE";

export function canAssignSeat(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "EMPLOYEE";
}

export function canUnassignSeat(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "EMPLOYEE";
}

export function canReassignSeat(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canLockSeat(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canViewSeatAudit(role?: Role) {
  return role === 'OWNER' || role === 'ADMIN';
}
