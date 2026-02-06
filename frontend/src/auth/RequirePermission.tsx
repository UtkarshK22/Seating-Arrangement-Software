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
  const { role } = useAuth();

  if (!can(role, permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
