import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Role } from "./roles";

type JwtPayload = {
  sub: string;
  role: Role;
  organizationId: string;
  exp: number;
};

type AuthUser = {
  id: string;
  role: Role;
  organizationId: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser({
          id: decoded.sub,
          role: decoded.role,
          organizationId: decoded.organizationId,
        });
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return {
    user,
    isLoading,
    logout,
  };
}
