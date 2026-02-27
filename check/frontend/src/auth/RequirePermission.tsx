import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { can } from "./can";
import { permissions } from "./permissions";
import type { JSX } from "react";

type Props = {
  permission: keyof typeof permissions;
  children: JSX.Element;
};

export function RequirePermission({ permission, children }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { role } = user;

  if (!can(role, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
