import api from "./http";

export type LoginResponse = {
  access_token: string;
};

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // ✅ STORE TOKEN HERE (single source of truth)
  localStorage.setItem("token", res.access_token);

  return res;
}

export function logout() {
  localStorage.removeItem("token");
}
