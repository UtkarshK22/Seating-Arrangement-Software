/**
 * Base API URL
 * Must be defined in:
 * .env
 * .env.production
 */
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "❌ VITE_API_URL is not defined. Check your .env or .env.production file."
  );
}

/**
 * Clean token helper
 */
function getCleanToken(): string | null {
  const raw = localStorage.getItem("token");
  if (!raw) return null;

  try {
    if (raw.trim().startsWith("{")) {
      const parsed = JSON.parse(raw);
      return parsed.access_token || parsed.token || null;
    }

    if (raw.startsWith('"') && raw.endsWith('"')) {
      return raw.slice(1, -1);
    }
  } catch {
    // ignore
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
      // ignore
    }

    if (res.status === 401) {
      console.error("❌ 401 Unauthorized");
    }

    throw new Error(message);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  return res.json();
}