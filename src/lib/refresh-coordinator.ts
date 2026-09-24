import { setStoredToken } from "./token-store";

const API_URL = import.meta.env.VITE_API_URL as string;

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

// Single shared in-flight promise — this is the ONLY place a real network
// call to /auth/refresh is ever made. Both AuthContext's mount-time
// silent-refresh AND api-client.ts's 401 auto-retry call THIS function,
// never their own separate fetch. This matters because refresh_token is
// single-use/rotating: two concurrent refresh calls racing against the
// same cookie would have the first rotate it and invalidate it for the
// second — causing exactly the "just logged in, immediately logged out
// again" symptom this fixes.
let inFlight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!inFlight) {
    inFlight = rawRefresh()
      .then((token) => {
        setStoredToken(token);
        return token;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
