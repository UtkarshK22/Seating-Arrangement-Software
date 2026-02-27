import { useAuth } from "./useAuth";
import { hasPermission, permissions } from "./permissions";

export function usePermission(
  permission: keyof typeof permissions,
) {
  const { user } = useAuth();

  if (!user?.role) return false;

  return hasPermission(user.role, permission);
}