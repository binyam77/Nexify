import { io, Socket } from "socket.io-client";

// ⭐ Same base URL as REST (lib/api-client.ts) — the Gateway lives on the
// same NestJS server, just a different protocol upgrade (WebSocket instead
// of plain HTTP), not a separate host.
const API_URL = import.meta.env.VITE_API_URL as string;
if (!API_URL) {
  throw new Error("VITE_API_URL is not defined in .env");
}

let socket: Socket | null = null;

// Idempotent — calling this again with an already-connected socket just
// returns the existing instance rather than opening a second connection
// (React StrictMode double-invokes effects in development, and this makes
// that harmless).
export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    // Verified once at connect time by RealtimeGateway.handleConnection —
    // see that method's own comment for why this lives in the handshake
    // payload rather than a header (Socket.IO's own convention).
    auth: { token: accessToken },
    withCredentials: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Access tokens are short-lived (15-minute TTL — see AuthService's
 * ACCESS_TOKEN_TTL on the backend). AuthContext silently refreshes this
 * token in-memory; the socket's own `auth` payload has to be kept in sync,
 * or the NEXT reconnect attempt (e.g. after a brief network drop) hands
 * the server a stale token and gets disconnected again immediately.
 * Socket.IO re-reads `socket.auth` on every reconnect attempt, so simply
 * updating this object is enough — no manual reconnect needed here.
 */
export function updateSocketAuth(accessToken: string): void {
  if (socket) {
    socket.auth = { token: accessToken };
  }
}
