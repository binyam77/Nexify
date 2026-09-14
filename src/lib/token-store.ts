// Module-level (React-independent) holder for the current in-memory
// access token. AuthContext is the only writer (on every login/refresh/
// logout); api-client.ts is the only reader — this is what lets every
// authenticated request auto-attach `Authorization` without each caller
// (posts.api.ts, follow.api.ts, ...) needing to know or pass the token
// explicitly.
let currentAccessToken: string | null = null;

export function getStoredToken(): string | null {
  return currentAccessToken;
}

export function setStoredToken(token: string | null): void {
  currentAccessToken = token;
}
