type JwtPayload = {
  sub: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
  exp: number;
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split(".")[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

export function useAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    return { user: null };
  }

  const decoded = decodeJwt(token);

  if (!decoded || decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    return { user: null };
  }

  return {
    user: {
      id: decoded.sub,
      role: decoded.role,
      organizationId: decoded.organizationId,
    },
  };
}
