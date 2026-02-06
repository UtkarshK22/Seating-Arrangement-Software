const API_BASE_URL = "http://localhost:3000";

/**
 * Helper function to clean the token from LocalStorage
 * Handles cases where:
 * 1. It is stored as a plain string: eyJ...
 * 2. It is stored as a JSON string: "eyJ..."
 * 3. It is stored as a JSON object: {"access_token":"..."}
 */
function getCleanToken(): string | null {
  const raw = localStorage.getItem("token");
  if (!raw) return null;

  try {
    // Case A: It's a JSON object (e.g., { "access_token": "..." })
    if (raw.trim().startsWith("{")) {
      const parsed = JSON.parse(raw);
      return parsed.access_token || parsed.token || null;
    }
    
    // Case B: It's a stringified string (e.g., "eyJ...")
    if (raw.trim().startsWith('"') && raw.trim().endsWith('"')) {
      return raw.slice(1, -1);
    }
  } catch {
    // If parsing fails, it's likely just the raw token string
  }
  
  return raw;
}

export default async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getCleanToken();

  // 🔍 DEBUGGING: Look at your browser console to see exactly what is being sent!
  // console.log(`[API Request] ${path} | Token:`, token ? "Present" : "Missing");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "API error";
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // ignore JSON parse error
    }
    
    if (res.status === 401) {
      console.error("❌ 401 Unauthorized: Token is invalid, expired, or malformed.");
      // Optional: Redirect to login if token is bad
      // window.location.href = "/login";
    }

    throw new Error(message);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  return res.json();
}