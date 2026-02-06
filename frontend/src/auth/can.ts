import { permissions } from "./permissions";
import type { Role } from "./roles";

export function can(
  role: Role | undefined,
  permission: keyof typeof permissions
): boolean {
  if (!role) return false;
  return permissions[permission].includes(role);
}
