/**
 * Base API URL
 * - Uses Vite env variable in production
 * - Falls back to localhost for local development
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Helper function to clean the token from localStorage
 * Handles cases where:
 * 1. Plain string: eyJ...
 * 2. Stringified string: "eyJ..."
 * 3. JSON object: { "access_token": "..." }
 */
function getCleanToken(): string | null {
  const raw = localStorage.getItem("token");
  if (!raw) return null;

  try {
    // Case 1: JSON object
    if (raw.trim().startsWith("{")) {
      const parsed = JSON.parse(raw);
      return parsed.access_token || parsed.token || null;
    }

    // Case 2: Stringified string
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return raw.slice(1, -1);
    }
  } catch {
    // Ignore parse errors – assume raw token
  }

  return raw;
}

export default async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getCleanToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "API error";

    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // Non-JSON error response
    }

    if (res.status === 401) {
      console.error(
        "❌ 401 Unauthorized: Token is invalid, expired, or malformed."
      );
      // Optional future improvement:
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }

    throw new Error(message);
  }

  // Handle empty responses (204, file downloads, etc.)
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  return res.json();
}
