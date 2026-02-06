import { useMemo } from "react";
import type { Role } from "./roles";

type JwtPayload = {
  sub: string;
  role: Role;
  organizationId: string;
  exp: number;
};

export function useAuth() {
  const token = localStorage.getItem("token");

  const payload = useMemo<JwtPayload | null>(() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }, [token]);

  return {
    isAuthenticated: !!payload,
    role: payload?.role,
    userId: payload?.sub,
    organizationId: payload?.organizationId,
  };
}
