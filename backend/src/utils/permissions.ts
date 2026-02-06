export type OrgRole =
  | 'OWNER'
  | 'ADMIN'
  | 'HR'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'GUEST';

export function canViewSeatAudit(role: OrgRole) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'HR' || role === 'MANAGER';
}
