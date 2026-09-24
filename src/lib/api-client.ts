// ⭐ ይህ ፋይል "Backend ጋር እንዴት እንገናኝ" የሚለውን 1 ቦታ ብቻ ይይዛል።
import { getStoredToken } from "./token-store";
import { refreshAccessToken } from "./refresh-coordinator";
import { notifySessionExpired } from "./session-events";

const API_URL = import.meta.env.VITE_API_URL as string;
if (!API_URL) {
  throw new Error("VITE_API_URL is not defined in .env");
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

async function performFetch(
  path: string,
  options: RequestOptions,
  authHeader?: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...options.headers,
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const explicitAuthHeader = options.headers?.Authorization;
  const storedToken = getStoredToken();
  const authHeader =
    explicitAuthHeader ?? (storedToken ? `Bearer ${storedToken}` : undefined);

  let result = await performFetch(path, options, authHeader);

  // Retried for any 401 that used the auto-attached STORED-token path
  // (not calls where the caller manages its own explicit token), and
  // never for /auth/* endpoints themselves. Always goes through the
  // SHARED refreshAccessToken() — never its own fetch — so it can never
  // race against AuthContext's own refresh attempt (see
  // refresh-coordinator.ts's comment for why that race mattered).
  const isAuthEndpointCall = path.startsWith("/auth/");
  if (result.status === 401 && !explicitAuthHeader && !isAuthEndpointCall) {
    try {
      const newToken = await refreshAccessToken();
      result = await performFetch(path, options, `Bearer ${newToken}`);
    } catch {
      notifySessionExpired();
    }
  }

  if (!result.ok) {
    const wrapped = (
      result.data as { error?: { message?: string; code?: string } }
    )?.error;
    const message =
      wrapped?.message ??
      (result.data as { message?: string })?.message ??
      "An unexpected error occurred.";
    throw new ApiError(result.status, message, wrapped?.code);
  }

  return result.data as T;
}
