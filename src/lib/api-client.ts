// ⭐ ይህ ፋይል "Backend ጋር እንዴት እንገናኝ" የሚለውን 1 ቦታ ብቻ ይይዛል።
import { getStoredToken, setStoredToken } from "./token-store";
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

// Raw fetch to /auth/refresh — deliberately NOT calling auth.api.ts's
// refreshRequest() (which itself calls apiClient from this very file) to
// avoid a circular import. Mirrors refreshRequest's contract exactly: no
// body, credentials included so the httpOnly refresh_token cookie is
// sent, returns { accessToken }.
async function rawRefresh(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("refresh failed");
  }
  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}

// Several requests can 401 around the same moment (e.g. a feed page load
// plus a couple of action calls in flight together) — this ensures only
// ONE real refresh network call happens; everyone else awaits the same
// in-flight promise instead of each triggering their own refresh.
let refreshInFlight: Promise<string> | null = null;

function refreshOnce(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = rawRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
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
      // Explicit caller headers always win — preserves Auth's existing
      // pattern (meRequest/changeUsernameRequest/changePasswordRequest
      // passing their own Authorization) exactly as-is.
      ...options.headers,
    },
    // ⚠️ ይህ ወሳኝ ነው — refresh_token httpOnly cookie እንዲላክ/እንዲቀበል ያደርጋል
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

  // Auto-refresh-and-retry — only for requests that were authenticated via
  // the auto-attached STORED token (not calls where the caller is managing
  // its own explicit token, like Settings' changePasswordRequest — those
  // keep their exact current behavior), and never for /auth/* endpoints
  // themselves (avoids retry-looping the refresh call against itself).
  const isAuthEndpointCall = path.startsWith("/auth/");
  if (
    result.status === 401 &&
    storedToken &&
    !explicitAuthHeader &&
    !isAuthEndpointCall
  ) {
    try {
      const newToken = await refreshOnce();
      setStoredToken(newToken);
      result = await performFetch(path, options, `Bearer ${newToken}`);
    } catch {
      // Refresh itself failed — the session is genuinely over, not a
      // transient network blip. Clear the stored token and tell
      // AuthContext so it can clear user state (route guards then send
      // the person back to login) instead of leaving the app in a
      // half-authenticated limbo where every action keeps silently
      // failing with a confusing "network error" message.
      setStoredToken(null);
      notifySessionExpired();
    }
  }

  if (!result.ok) {
    // Backend's error format (Global Exception Filter):
    // {success: false, error: {message, code, statusCode}}
    // Fallback to a flat `.message` is kept for safety, in case any
    // response ever bypasses the filter.
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
