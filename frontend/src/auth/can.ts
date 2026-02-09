import { Role } from "./roles";
import { permissions } from "./permissions";

export function can(
  role: Role,
  permission: keyof typeof permissions
): boolean {
  return permissions[permission].includes(role);
}
